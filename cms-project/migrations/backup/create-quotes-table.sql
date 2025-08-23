-- Create quotes table for the CRM system
-- Quotes are proposals/offers sent to customers before invoices

BEGIN;

-- ========================================
-- 1. Create quotes table
-- ========================================
CREATE TABLE IF NOT EXISTS public.quotes (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Quote information
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Customer information
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    
    -- Customer details (denormalized for quote history)
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    customer_city VARCHAR(100),
    customer_postal_code VARCHAR(20),
    customer_country VARCHAR(100) DEFAULT 'Nederland',
    
    -- Financial information
    subtotal DECIMAL(12, 2) DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Quote details
    valid_until DATE,
    issue_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted')),
    
    -- Conversion tracking
    converted_to_invoice BOOLEAN DEFAULT FALSE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    converted_at TIMESTAMP WITH TIME ZONE,
    
    -- Terms and conditions
    terms_and_conditions TEXT,
    payment_terms VARCHAR(100),
    delivery_terms VARCHAR(100),
    
    -- Notes
    internal_notes TEXT,
    customer_notes TEXT,
    
    -- Multi-tenant
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Tracking
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb
);

-- ========================================
-- 2. Create quote_items table
-- ========================================
CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    
    -- Product information
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    
    -- Pricing
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_percentage DECIMAL(5, 2) DEFAULT 21, -- Dutch BTW
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    
    -- Additional info
    unit VARCHAR(50) DEFAULT 'stuks',
    sort_order INTEGER DEFAULT 0,
    notes TEXT,
    
    -- Multi-tenant
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. Create quote sequence for numbering
-- ========================================
CREATE TABLE IF NOT EXISTS public.quote_sequences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    prefix VARCHAR(10) DEFAULT 'Q',
    next_number INTEGER DEFAULT 1,
    suffix VARCHAR(10),
    UNIQUE(tenant_id)
);

-- Insert default sequence for existing tenant
INSERT INTO public.quote_sequences (tenant_id, prefix, next_number)
SELECT id, 'OFF-', 1 FROM public.tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- ========================================
-- 4. Create indexes
-- ========================================
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_id ON public.quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_contact_id ON public.quotes(contact_id);
CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON public.quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON public.quotes(valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes(quote_number);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_tenant_id ON public.quote_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON public.quote_items(product_id);

-- ========================================
-- 5. Enable RLS
-- ========================================
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_sequences ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. Create RLS policies
-- ========================================

-- Quotes policies
CREATE POLICY "Users can view quotes in their tenant" ON public.quotes
    FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create quotes in their tenant" ON public.quotes
    FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update quotes in their tenant" ON public.quotes
    FOR UPDATE USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete quotes in their tenant" ON public.quotes
    FOR DELETE USING (tenant_id = get_user_tenant_id());

-- Quote items policies
CREATE POLICY "Users can view quote items in their tenant" ON public.quote_items
    FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create quote items in their tenant" ON public.quote_items
    FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update quote items in their tenant" ON public.quote_items
    FOR UPDATE USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete quote items in their tenant" ON public.quote_items
    FOR DELETE USING (tenant_id = get_user_tenant_id());

-- Quote sequences policies
CREATE POLICY "Users can view quote sequences in their tenant" ON public.quote_sequences
    FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update quote sequences in their tenant" ON public.quote_sequences
    FOR UPDATE USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- ========================================
-- 7. Create trigger for auto-updating totals
-- ========================================
CREATE OR REPLACE FUNCTION update_quote_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update quote totals when items change
    UPDATE quotes
    SET 
        subtotal = COALESCE((
            SELECT SUM(total_amount - tax_amount)
            FROM quote_items
            WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id)
        ), 0),
        tax_amount = COALESCE((
            SELECT SUM(tax_amount)
            FROM quote_items
            WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id)
        ), 0),
        total_amount = COALESCE((
            SELECT SUM(total_amount)
            FROM quote_items
            WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id)
        ), 0),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_quote_totals_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON public.quote_items
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_totals();

-- ========================================
-- 8. Create function to generate quote number
-- ========================================
CREATE OR REPLACE FUNCTION generate_quote_number(p_tenant_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR;
    v_suffix VARCHAR;
    v_number INTEGER;
    v_quote_number VARCHAR;
BEGIN
    -- Get and increment the sequence
    UPDATE quote_sequences
    SET next_number = next_number + 1
    WHERE tenant_id = p_tenant_id
    RETURNING prefix, suffix, next_number - 1 INTO v_prefix, v_suffix, v_number;
    
    -- If no sequence exists, create one
    IF v_number IS NULL THEN
        INSERT INTO quote_sequences (tenant_id, prefix, next_number)
        VALUES (p_tenant_id, 'OFF-', 2)
        RETURNING prefix, suffix, 1 INTO v_prefix, v_suffix, v_number;
    END IF;
    
    -- Generate the quote number
    v_quote_number := v_prefix || LPAD(v_number::text, 5, '0');
    IF v_suffix IS NOT NULL THEN
        v_quote_number := v_quote_number || v_suffix;
    END IF;
    
    RETURN v_quote_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========================================
-- 9. Add sample quotes for testing
-- ========================================
DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
    v_quote_id UUID;
BEGIN
    -- Get existing tenant and user
    SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
    SELECT id INTO v_user_id FROM profiles LIMIT 1;
    
    IF v_tenant_id IS NOT NULL AND v_user_id IS NOT NULL THEN
        -- Create sample quote 1
        INSERT INTO quotes (
            quote_number, title, customer_name, customer_email,
            status, valid_until, tenant_id, created_by
        ) VALUES (
            generate_quote_number(v_tenant_id),
            'Airco installatie - Woonhuis',
            'Jan de Vries',
            'jan.devries@email.nl',
            'sent',
            CURRENT_DATE + INTERVAL '30 days',
            v_tenant_id,
            v_user_id
        ) RETURNING id INTO v_quote_id;
        
        -- Add items to quote 1
        INSERT INTO quote_items (
            quote_id, product_name, quantity, unit_price, tax_percentage, 
            tax_amount, total_amount, tenant_id
        ) VALUES
        (v_quote_id, 'Daikin Stylish FTXA25AW', 1, 899.00, 21, 188.79, 1087.79, v_tenant_id),
        (v_quote_id, 'Installatie kosten', 1, 450.00, 21, 94.50, 544.50, v_tenant_id),
        (v_quote_id, 'Leidingwerk (per meter)', 15, 25.00, 21, 78.75, 453.75, v_tenant_id);
        
        -- Create sample quote 2
        INSERT INTO quotes (
            quote_number, title, customer_name, customer_email,
            status, valid_until, tenant_id, created_by
        ) VALUES (
            generate_quote_number(v_tenant_id),
            'Onderhoud contract - Kantoorpand',
            'Bedrijf XYZ B.V.',
            'info@bedrijfxyz.nl',
            'draft',
            CURRENT_DATE + INTERVAL '14 days',
            v_tenant_id,
            v_user_id
        ) RETURNING id INTO v_quote_id;
        
        -- Add items to quote 2
        INSERT INTO quote_items (
            quote_id, product_name, quantity, unit_price, tax_percentage,
            tax_amount, total_amount, tenant_id
        ) VALUES
        (v_quote_id, 'Jaarlijks onderhoud (10 units)', 1, 1250.00, 21, 262.50, 1512.50, v_tenant_id),
        (v_quote_id, 'Filter vervanging', 10, 35.00, 21, 73.50, 423.50, v_tenant_id);
        
        RAISE NOTICE 'Created 2 sample quotes with items';
    END IF;
END $$;

COMMIT;

-- ========================================
-- 10. Verify creation
-- ========================================
SELECT 
    'QUOTES TABLE CREATED' as status,
    COUNT(*) as quote_count
FROM public.quotes;

SELECT 
    q.quote_number,
    q.title,
    q.customer_name,
    q.status,
    q.total_amount,
    COUNT(qi.id) as item_count
FROM public.quotes q
LEFT JOIN public.quote_items qi ON q.id = qi.quote_id
GROUP BY q.id, q.quote_number, q.title, q.customer_name, q.status, q.total_amount
ORDER BY q.created_at DESC;