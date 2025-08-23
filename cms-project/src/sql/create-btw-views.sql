-- Create BTW (VAT) summary views for Dutch tax reporting

-- View for BTW to be paid (from invoices)
CREATE OR REPLACE VIEW btw_collected AS
SELECT 
    DATE_TRUNC('quarter', i.invoice_date) as quarter,
    DATE_TRUNC('month', i.invoice_date) as month,
    ii.tax_category,
    ii.tax_rate,
    SUM(ii.subtotal - ii.discount_amount) as taxable_amount,
    SUM(ii.tax_amount) as btw_amount,
    COUNT(DISTINCT i.id) as invoice_count
FROM invoices i
JOIN invoice_items ii ON i.id = ii.invoice_id
WHERE i.status IN ('sent', 'paid')
    AND i.type = 'invoice'
GROUP BY DATE_TRUNC('quarter', i.invoice_date), 
         DATE_TRUNC('month', i.invoice_date), 
         ii.tax_category, 
         ii.tax_rate
ORDER BY quarter DESC, month DESC, tax_rate DESC;

-- View for BTW to be reclaimed (from expenses)
CREATE OR REPLACE VIEW btw_deductible AS
SELECT 
    DATE_TRUNC('quarter', e.expense_date) as quarter,
    DATE_TRUNC('month', e.expense_date) as month,
    e.category,
    SUM(e.amount) as taxable_amount,
    SUM(e.tax_amount) as btw_amount,
    COUNT(*) as expense_count
FROM expenses e
WHERE e.status IN ('approved', 'paid')
GROUP BY DATE_TRUNC('quarter', e.expense_date), 
         DATE_TRUNC('month', e.expense_date), 
         e.category
ORDER BY quarter DESC, month DESC;

-- Combined BTW summary for tax returns
CREATE OR REPLACE VIEW btw_summary AS
WITH collected AS (
    SELECT 
        quarter,
        SUM(CASE WHEN tax_rate = 21 THEN btw_amount ELSE 0 END) as btw_21_collected,
        SUM(CASE WHEN tax_rate = 9 THEN btw_amount ELSE 0 END) as btw_9_collected,
        SUM(CASE WHEN tax_rate = 0 THEN taxable_amount ELSE 0 END) as btw_0_amount,
        SUM(btw_amount) as total_btw_collected
    FROM btw_collected
    GROUP BY quarter
),
deductible AS (
    SELECT 
        quarter,
        SUM(btw_amount) as total_btw_deductible
    FROM btw_deductible
    GROUP BY quarter
)
SELECT 
    c.quarter,
    TO_CHAR(c.quarter, 'Q YYYY') as quarter_label,
    COALESCE(c.btw_21_collected, 0) as btw_21_collected,
    COALESCE(c.btw_9_collected, 0) as btw_9_collected,
    COALESCE(c.btw_0_amount, 0) as btw_0_amount,
    COALESCE(c.total_btw_collected, 0) as total_btw_collected,
    COALESCE(d.total_btw_deductible, 0) as total_btw_deductible,
    COALESCE(c.total_btw_collected, 0) - COALESCE(d.total_btw_deductible, 0) as btw_to_pay
FROM collected c
LEFT JOIN deductible d ON c.quarter = d.quarter
ORDER BY c.quarter DESC;

-- Monthly BTW details for more granular reporting
CREATE OR REPLACE VIEW btw_monthly_details AS
SELECT 
    DATE_TRUNC('month', i.invoice_date) as month,
    TO_CHAR(i.invoice_date, 'YYYY-MM') as month_label,
    'invoice' as transaction_type,
    i.invoice_number as reference,
    i.customer_name,
    ii.description,
    ii.tax_category,
    ii.tax_rate,
    ii.subtotal - ii.discount_amount as taxable_amount,
    ii.tax_amount as btw_amount
FROM invoices i
JOIN invoice_items ii ON i.id = ii.invoice_id
WHERE i.status IN ('sent', 'paid')
    AND i.type = 'invoice'
UNION ALL
SELECT 
    DATE_TRUNC('month', e.expense_date) as month,
    TO_CHAR(e.expense_date, 'YYYY-MM') as month_label,
    'expense' as transaction_type,
    e.expense_number as reference,
    e.supplier_name as customer_name,
    e.description,
    'high' as tax_category, -- Expenses usually have 21% BTW
    21 as tax_rate,
    e.amount as taxable_amount,
    -e.tax_amount as btw_amount -- Negative because it's deductible
FROM expenses e
WHERE e.status IN ('approved', 'paid')
ORDER BY month DESC, reference;