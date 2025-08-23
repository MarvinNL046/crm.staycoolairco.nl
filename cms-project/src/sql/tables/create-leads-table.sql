-- Create leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    city VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    source VARCHAR(100),
    value DECIMAL(10, 2) DEFAULT 0,
    assigned_to VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
INSERT INTO leads (name, email, phone, company, city, status, source, value, assigned_to) VALUES
('Jan Janssen', 'jan@bakkerijjanssen.nl', '+31 6 1234 5678', 'Bakkerij Janssen', 'Amsterdam', 'new', 'Website', 15000, 'JD'),
('Maria de Groot', 'maria@restaurantgroen.nl', '+31 6 2345 6789', 'Restaurant Groen', 'Utrecht', 'qualified', 'Referral', 28500, 'MH'),
('Peter van Dam', 'peter@hotelzonneschijn.nl', '+31 6 3456 7890', 'Hotel Zonneschijn', 'Rotterdam', 'proposal', 'Cold Call', 45000, 'JD'),
('Lisa Smit', 'lisa@cafedehoek.nl', '+31 6 4567 8901', 'Café de Hoek', 'Den Haag', 'contacted', 'Social Media', 8500, 'MH'),
('Tom Bakker', 'tom@supermarktplus.nl', '+31 6 5678 9012', 'Supermarkt Plus', 'Eindhoven', 'new', 'Website', 22000, 'JD'),
('Sarah Johnson', 'sarah@fitlife.nl', '+31 6 6789 0123', 'Sportschool FitLife', 'Groningen', 'won', 'Referral', 18500, 'MH')
ON CONFLICT DO NOTHING;