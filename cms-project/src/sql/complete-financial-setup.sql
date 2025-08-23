-- ================================================================
-- COMPLETE FINANCIAL SETUP FOR STAYCOOL CRM
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. First ensure update function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create invoices table if not exists
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '80496bff-b559-4b80-9102-3a84afdaa616',
    
    -- Invoice Details
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL DEFAULT 'invoice' CHECK (type IN ('invoice', 'credit_note', 'expense')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    
    -- Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_date DATE,
    
    -- Relations (make nullable for now)
    lead_id INTEGER,
    contact_id UUID,
    customer_id UUID,
    
    -- Customer Info (denormalized for invoice history)
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    
    -- Financial Details
    subtotal DECIMAL(10, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 21.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Payment Details
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Item Details
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 21.00 CHECK (tax_rate IN (0, 9, 21)),
    tax_category VARCHAR(20) DEFAULT 'high' CHECK (tax_category IN ('none', 'low', 'high')),
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Calculated Fields
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_amount DECIMAL(10, 2) GENERATED ALWAYS AS ((quantity * unit_price) * discount_percentage / 100) STORED,
    tax_amount DECIMAL(10, 2) GENERATED ALWAYS AS (((quantity * unit_price) - ((quantity * unit_price) * discount_percentage / 100)) * tax_rate / 100) STORED,
    total DECIMAL(10, 2) GENERATED ALWAYS AS ((quantity * unit_price) - ((quantity * unit_price) * discount_percentage / 100) + (((quantity * unit_price) - ((quantity * unit_price) * discount_percentage / 100)) * tax_rate / 100)) STORED,
    
    -- Product Reference (optional)
    product_id UUID,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create expenses table for cost tracking
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '80496bff-b559-4b80-9102-3a84afdaa616',
    
    -- Expense Details
    expense_number VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    
    -- Dates
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_date DATE,
    
    -- Supplier Info
    supplier_name VARCHAR(255) NOT NULL,
    supplier_invoice_number VARCHAR(100),
    
    -- Financial Details
    amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Relations (link to projects/invoices)
    related_invoice_id UUID,
    related_lead_id INTEGER,
    
    -- Description
    description TEXT NOT NULL,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID,
    approved_at TIMESTAMPTZ
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- 6. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;
CREATE TRIGGER update_invoice_items_updated_at 
    BEFORE UPDATE ON invoice_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Row Level Security (optional but recommended)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 8. Create sample data for testing
-- Sample expense to show in the UI
INSERT INTO expenses (
    expense_number,
    category,
    status,
    expense_date,
    supplier_name,
    supplier_invoice_number,
    amount,
    tax_amount,
    total_amount,
    description,
    notes
) VALUES 
(
    'EXP-2024-001',
    'materials',
    'paid',
    '2024-08-15',
    'Technische Unie',
    'TU-2024-4567',
    1250.00,
    262.50,
    1512.50,
    'Airco onderdelen - Daikin split units',
    'Voor project Hotel Zonneschijn'
),
(
    'EXP-2024-002',
    'transport',
    'approved',
    '2024-08-18',
    'Shell Nederland',
    'SHELL-08-2024',
    180.00,
    37.80,
    217.80,
    'Brandstof servicebussen',
    'Augustus 2024'
),
(
    'EXP-2024-003',
    'labor',
    'pending',
    '2024-08-20',
    'FlexPersoneel BV',
    'FP-2024-089',
    2400.00,
    504.00,
    2904.00,
    'Inhuur monteur - week 33',
    'Extra capaciteit voor zomerperiode'
)
ON CONFLICT (expense_number) DO NOTHING;

-- 9. Create BTW summary views
CREATE OR REPLACE VIEW btw_summary_current_quarter AS
SELECT 
    'Verzameld 21%' as description,
    COALESCE(SUM(CASE WHEN ii.tax_rate = 21 THEN ii.tax_amount ELSE 0 END), 0) as amount
FROM invoices i
JOIN invoice_items ii ON i.id = ii.invoice_id
WHERE i.status IN ('sent', 'paid')
    AND DATE_TRUNC('quarter', i.invoice_date) = DATE_TRUNC('quarter', CURRENT_DATE)

UNION ALL

SELECT 
    'Verzameld 9%' as description,
    COALESCE(SUM(CASE WHEN ii.tax_rate = 9 THEN ii.tax_amount ELSE 0 END), 0) as amount
FROM invoices i
JOIN invoice_items ii ON i.id = ii.invoice_id
WHERE i.status IN ('sent', 'paid')
    AND DATE_TRUNC('quarter', i.invoice_date) = DATE_TRUNC('quarter', CURRENT_DATE)

UNION ALL

SELECT 
    'Aftrekbaar (kosten)' as description,
    -COALESCE(SUM(tax_amount), 0) as amount
FROM expenses
WHERE status IN ('approved', 'paid')
    AND DATE_TRUNC('quarter', expense_date) = DATE_TRUNC('quarter', CURRENT_DATE)

UNION ALL

SELECT 
    'Te betalen' as description,
    COALESCE(
        (SELECT SUM(ii.tax_amount) 
         FROM invoices i 
         JOIN invoice_items ii ON i.id = ii.invoice_id 
         WHERE i.status IN ('sent', 'paid') 
         AND DATE_TRUNC('quarter', i.invoice_date) = DATE_TRUNC('quarter', CURRENT_DATE))
        - 
        (SELECT SUM(tax_amount) 
         FROM expenses 
         WHERE status IN ('approved', 'paid') 
         AND DATE_TRUNC('quarter', expense_date) = DATE_TRUNC('quarter', CURRENT_DATE))
    , 0) as amount;

-- 10. Verify tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'invoice_items', 'expenses')
ORDER BY table_name;