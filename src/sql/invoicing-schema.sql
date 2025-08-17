-- Invoicing System Schema for Stay Cool Air CRM
-- This schema adds invoicing capabilities to the existing CRM

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    
    -- Reference to lead or contact
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    
    -- Invoice details
    invoice_number VARCHAR(50) NOT NULL,
    invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('invoice', 'quote', 'proforma')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'expired')),
    
    -- Dates
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_date DATE,
    quote_valid_until DATE, -- For quotes only
    
    -- Customer details (denormalized for historical accuracy)
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_company VARCHAR(255),
    
    -- Billing address
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100) DEFAULT 'Nederland',
    
    -- Financial details
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 21.00, -- Dutch BTW
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Payment details
    payment_terms VARCHAR(255),
    payment_method VARCHAR(50),
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint for invoice number per tenant
    CONSTRAINT unique_invoice_number_per_tenant UNIQUE (tenant_id, invoice_number)
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Product/Service details
    product_id UUID, -- Optional reference to products table (if exists)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Pricing
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 21.00,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Calculated fields
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Order
    position INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products/Services catalog (optional)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    
    -- Product details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    category VARCHAR(100),
    
    -- Pricing
    unit_price DECIMAL(12, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 21.00,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique SKU per tenant
    CONSTRAINT unique_sku_per_tenant UNIQUE (tenant_id, sku)
);

-- Invoice sequences for generating invoice numbers
CREATE TABLE IF NOT EXISTS invoice_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    sequence_type VARCHAR(20) NOT NULL CHECK (sequence_type IN ('invoice', 'quote')),
    year INTEGER NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    prefix VARCHAR(20),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_sequence_per_tenant_year UNIQUE (tenant_id, sequence_type, year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_lead_id ON invoices(lead_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contact_id ON invoices(contact_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_sequences_updated_at BEFORE UPDATE ON invoice_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate item totals
    NEW.subtotal := NEW.quantity * NEW.unit_price;
    NEW.discount_amount := NEW.subtotal * (NEW.discount_percentage / 100);
    NEW.tax_amount := (NEW.subtotal - NEW.discount_amount) * (NEW.tax_rate / 100);
    NEW.total := NEW.subtotal - NEW.discount_amount + NEW.tax_amount;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_invoice_item_totals 
    BEFORE INSERT OR UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION calculate_invoice_totals();

-- Function to update invoice totals when items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices
    SET 
        subtotal = COALESCE((
            SELECT SUM(subtotal) 
            FROM invoice_items 
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ), 0),
        tax_amount = COALESCE((
            SELECT SUM(tax_amount) 
            FROM invoice_items 
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ), 0),
        discount_amount = COALESCE((
            SELECT SUM(discount_amount) 
            FROM invoice_items 
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ), 0),
        total_amount = COALESCE((
            SELECT SUM(total) 
            FROM invoice_items 
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ), 0)
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoice_totals_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION update_invoice_totals();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number(
    p_tenant_id UUID,
    p_invoice_type VARCHAR(20)
)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_year INTEGER;
    v_next_number INTEGER;
    v_prefix VARCHAR(20);
    v_invoice_number VARCHAR(50);
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Get or create sequence
    INSERT INTO invoice_sequences (tenant_id, sequence_type, year, last_number, prefix)
    VALUES (
        p_tenant_id, 
        p_invoice_type, 
        v_year, 
        0, 
        CASE 
            WHEN p_invoice_type = 'invoice' THEN 'INV'
            WHEN p_invoice_type = 'quote' THEN 'OFF'
            ELSE 'PRO'
        END
    )
    ON CONFLICT (tenant_id, sequence_type, year) DO NOTHING;
    
    -- Get next number
    UPDATE invoice_sequences
    SET last_number = last_number + 1
    WHERE tenant_id = p_tenant_id 
        AND sequence_type = p_invoice_type 
        AND year = v_year
    RETURNING last_number, prefix INTO v_next_number, v_prefix;
    
    -- Generate invoice number
    v_invoice_number := v_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 4, '0');
    
    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;

-- Invoice policies
CREATE POLICY "Users can view invoices in their tenant" ON invoices
    FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IN (
        SELECT tenant_id FROM auth.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create invoices in their tenant" ON invoices
    FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IN (
        SELECT tenant_id FROM auth.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update invoices in their tenant" ON invoices
    FOR UPDATE USING (tenant_id = auth.uid() OR tenant_id IN (
        SELECT tenant_id FROM auth.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete invoices in their tenant" ON invoices
    FOR DELETE USING (tenant_id = auth.uid() OR tenant_id IN (
        SELECT tenant_id FROM auth.users WHERE id = auth.uid()
    ));

-- Invoice items policies (inherit from invoice)
CREATE POLICY "Users can view invoice items" ON invoice_items
    FOR SELECT USING (invoice_id IN (
        SELECT id FROM invoices WHERE tenant_id = auth.uid() OR tenant_id IN (
            SELECT tenant_id FROM auth.users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage invoice items" ON invoice_items
    FOR ALL USING (invoice_id IN (
        SELECT id FROM invoices WHERE tenant_id = auth.uid() OR tenant_id IN (
            SELECT tenant_id FROM auth.users WHERE id = auth.uid()
        )
    ));

-- Products policies
CREATE POLICY "Users can view products in their tenant" ON products
    FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IN (
        SELECT tenant_id FROM auth.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can manage products in their tenant" ON products
    FOR ALL USING (tenant_id = auth.uid() OR tenant_id IN (
        SELECT tenant_id FROM auth.users WHERE id = auth.uid()
    ));

-- Invoice sequences policies
CREATE POLICY "Users can manage sequences in their tenant" ON invoice_sequences
    FOR ALL USING (tenant_id = auth.uid() OR tenant_id IN (
        SELECT tenant_id FROM auth.users WHERE id = auth.uid()
    ));