-- ==============================================
-- CRM Facturatie Systeem Database Schema
-- ==============================================
-- Dit script maakt alle benodigde tabellen aan voor het facturatiesysteem
-- binnen het bestaande CRM systeem
-- ==============================================

-- Enum voor facturatie status
CREATE TYPE IF NOT EXISTS invoice_status AS ENUM (
  'draft',      -- Concept
  'sent',       -- Verzonden
  'viewed',     -- Bekeken door klant
  'paid',       -- Betaald
  'overdue',    -- Verlopen
  'cancelled'   -- Geannuleerd
);

-- Enum voor quote/offerte status  
CREATE TYPE IF NOT EXISTS quote_status AS ENUM (
  'draft',      -- Concept
  'sent',       -- Verzonden
  'viewed',     -- Bekeken door klant
  'accepted',   -- Geaccepteerd
  'rejected',   -- Afgewezen
  'expired',    -- Verlopen
  'converted'   -- Omgezet naar factuur
);

-- Enum voor payment methods
CREATE TYPE IF NOT EXISTS payment_method AS ENUM (
  'bank_transfer',
  'credit_card',
  'cash',
  'paypal',
  'ideal',
  'other'
);

-- ==============================================
-- QUOTES (Offertes) tabel
-- ==============================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  
  -- Quote details
  quote_number VARCHAR(50) NOT NULL,
  status quote_status DEFAULT 'draft',
  valid_until DATE NOT NULL,
  
  -- Contact informatie
  contact_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Adres informatie
  billing_address JSONB,
  shipping_address JSONB,
  
  -- Financiële informatie
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 21.00, -- BTW percentage
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  
  -- Extra informatie
  terms_conditions TEXT,
  notes TEXT,
  internal_notes TEXT,
  
  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INVOICES (Facturen) tabel
-- ==============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  
  -- Invoice details
  invoice_number VARCHAR(50) NOT NULL,
  status invoice_status DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Contact informatie
  contact_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Adres informatie
  billing_address JSONB,
  shipping_address JSONB,
  
  -- Financiële informatie
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 21.00,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  
  -- Payment informatie
  payment_method payment_method,
  payment_terms VARCHAR(255) DEFAULT 'Net 30',
  
  -- Extra informatie
  terms_conditions TEXT,
  notes TEXT,
  internal_notes TEXT,
  
  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- LINE ITEMS (Regel items voor quotes en invoices)
-- ==============================================
CREATE TABLE IF NOT EXISTS line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Polymorphic association (kan bij quote of invoice horen)
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('quote', 'invoice')),
  document_id UUID NOT NULL,
  
  -- Item details
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'stuk',
  
  -- Financiële informatie
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 21.00,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Sorting
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- PAYMENTS (Betalingen) tabel
-- ==============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method NOT NULL,
  reference_number VARCHAR(255),
  
  -- Extra informatie
  notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- PRODUCTS (Producten/diensten catalogus) tabel
-- ==============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Product details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  unit VARCHAR(50) DEFAULT 'stuk',
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 21.00,
  
  -- Categorisatie
  category VARCHAR(100),
  tags TEXT[],
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- UPDATE DEALS tabel voor facturatie integratie
-- ==============================================
ALTER TABLE deals ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS last_quote_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS last_invoice_date TIMESTAMP WITH TIME ZONE;

-- ==============================================
-- INDEXES voor performance
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_id ON quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotes_deal_id ON quotes(deal_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_lead_id ON invoices(lead_id);
CREATE INDEX IF NOT EXISTS idx_invoices_deal_id ON invoices(deal_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_line_items_document ON line_items(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);

-- ==============================================
-- TRIGGERS voor automatische updates
-- ==============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_line_items_updated_at BEFORE UPDATE ON line_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- FUNCTIONS voor automatische berekeningen
-- ==============================================

-- Functie om line item totaal te berekenen
CREATE OR REPLACE FUNCTION calculate_line_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.line_total = (NEW.quantity * NEW.unit_price) - NEW.discount_amount;
    NEW.tax_amount = NEW.line_total * (NEW.tax_rate / 100);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_line_item_total BEFORE INSERT OR UPDATE ON line_items
  FOR EACH ROW EXECUTE FUNCTION calculate_line_total();

-- ==============================================
-- RLS (Row Level Security) Policies
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies for quotes
CREATE POLICY "Users can view quotes from their tenant" ON quotes
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create quotes for their tenant" ON quotes
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update quotes from their tenant" ON quotes
  FOR UPDATE USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

-- Policies for invoices
CREATE POLICY "Users can view invoices from their tenant" ON invoices
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create invoices for their tenant" ON invoices
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update invoices from their tenant" ON invoices
  FOR UPDATE USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

-- Policies for line_items
CREATE POLICY "Users can view line items from their tenant" ON line_items
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage line items for their tenant" ON line_items
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

-- Policies for payments
CREATE POLICY "Users can view payments from their tenant" ON payments
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage payments for their tenant" ON payments
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

-- Policies for products
CREATE POLICY "Users can view products from their tenant" ON products
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage products for their tenant" ON products
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

-- ==============================================
-- Sequence voor automatische nummering
-- ==============================================
CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

-- Functie voor automatische quote nummering
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS VARCHAR AS $$
DECLARE
    year_part VARCHAR;
    seq_part VARCHAR;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    seq_part := LPAD(nextval('quote_number_seq')::TEXT, 5, '0');
    RETURN 'Q-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;

-- Functie voor automatische invoice nummering  
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
    year_part VARCHAR;
    seq_part VARCHAR;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    seq_part := LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
    RETURN 'F-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- Voorbeeld data voor products tabel
-- ==============================================
-- Deze worden alleen aangemaakt als de tabel leeg is
INSERT INTO products (tenant_id, name, description, unit, price, category)
SELECT 
    (SELECT id FROM tenants LIMIT 1),
    name,
    description,
    unit,
    price,
    category
FROM (VALUES
    ('Airco installatie - Split unit', 'Installatie van een split unit airconditioning systeem', 'stuk', 2500.00, 'Installatie'),
    ('Airco installatie - Multi-split', 'Installatie van een multi-split systeem', 'stuk', 4500.00, 'Installatie'),
    ('Onderhoudsbeurt airco', 'Jaarlijkse onderhoudsbeurt voor airconditioning', 'beurt', 150.00, 'Onderhoud'),
    ('Filter vervangen', 'Vervangen van airco filters', 'stuk', 75.00, 'Onderhoud'),
    ('Koudemiddel bijvullen', 'Bijvullen van koudemiddel', 'kg', 125.00, 'Service'),
    ('Storing diagnose', 'Diagnose van storing aan airco systeem', 'uur', 85.00, 'Service'),
    ('Reparatie arbeid', 'Arbeid voor reparaties', 'uur', 85.00, 'Service'),
    ('Onderhoudscontract - Basis', 'Jaarlijks onderhoudscontract basis', 'jaar', 450.00, 'Contract'),
    ('Onderhoudscontract - Premium', 'Jaarlijks onderhoudscontract premium incl. storingen', 'jaar', 850.00, 'Contract'),
    ('Spoedtoeslag', 'Toeslag voor spoedservice buiten kantooruren', 'vast', 150.00, 'Service')
) AS temp(name, description, unit, price, category)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Melding dat de installatie voltooid is
DO $$
BEGIN
    RAISE NOTICE 'CRM Facturatie Systeem database schema succesvol aangemaakt!';
    RAISE NOTICE 'Tabellen aangemaakt: quotes, invoices, line_items, payments, products';
    RAISE NOTICE 'Deals tabel uitgebreid met facturatie velden';
    RAISE NOTICE 'Row Level Security (RLS) policies ingesteld';
END $$;