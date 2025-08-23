-- ================================================================
-- SAFE FINANCIAL SETUP FOR STAYCOOL CRM
-- This checks existing tables first
-- ================================================================

-- 1. First check what tables already exist
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'invoice_items', 'expenses')
ORDER BY table_name, ordinal_position;

-- 2. Create expenses table (this one is definitely new)
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

-- 3. Create update function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Create indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- 5. Create trigger for expenses
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS on expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 7. Insert sample expenses data
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

-- 8. Check if invoices table has the columns we need
-- If not, we'll work with what exists
SELECT 
    'Expenses table created successfully' as status,
    COUNT(*) as expense_count
FROM expenses;

-- 9. Show the structure of existing invoices table (if any)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
ORDER BY ordinal_position;