-- Create invoices table for complete financial tracking
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    
    -- Invoice Details
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('invoice', 'credit_note', 'expense')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    
    -- Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_date DATE,
    
    -- Relations
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Customer Info (denormalized for invoice history)
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    
    -- Financial Details
    subtotal DECIMAL(10, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 21.00, -- Dutch BTW
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT invoices_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Item Details
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 21.00 CHECK (tax_rate IN (0, 9, 21)), -- Dutch BTW rates: 0%, 9% (low), 21% (high)
    tax_category VARCHAR(20) DEFAULT 'high' CHECK (tax_category IN ('none', 'low', 'high')), -- BTW categories
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Calculated Fields
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_amount DECIMAL(10, 2) GENERATED ALWAYS AS ((quantity * unit_price) * discount_percentage / 100) STORED,
    tax_amount DECIMAL(10, 2) GENERATED ALWAYS AS (((quantity * unit_price) - ((quantity * unit_price) * discount_percentage / 100)) * tax_rate / 100) STORED,
    total DECIMAL(10, 2) GENERATED ALWAYS AS ((quantity * unit_price) - ((quantity * unit_price) * discount_percentage / 100) + (((quantity * unit_price) - ((quantity * unit_price) * discount_percentage / 100)) * tax_rate / 100)) STORED,
    
    -- Product Reference (optional)
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expenses table for cost tracking
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    
    -- Expense Details
    expense_number VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- 'materials', 'labor', 'transport', 'overhead', 'other'
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
    related_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    related_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    
    -- Description
    description TEXT NOT NULL,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    
    CONSTRAINT expenses_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_related_invoice ON expenses(related_invoice_id);

-- Create triggers for updated_at
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only access their tenant's invoices" ON invoices
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can only access their tenant's invoice items" ON invoice_items
    FOR ALL USING (invoice_id IN (SELECT id FROM invoices WHERE tenant_id = current_setting('app.current_tenant_id')::UUID));

CREATE POLICY "Users can only access their tenant's expenses" ON expenses
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);