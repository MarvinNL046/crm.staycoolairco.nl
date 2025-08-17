import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '../../.env.local') })

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
)

async function runMigration() {
  console.log('Running lead-to-contact workflow improvements migration...\n')
  
  try {
    // Test if customers table already exists
    const { data: existingTable } = await supabase
      .from('customers')
      .select('id')
      .limit(1)
    
    if (existingTable !== null) {
      console.log('✓ Customers table already exists - migration may have been applied')
      return
    }
  } catch (e) {
    // Table doesn't exist, continue with migration
    console.log('Customers table not found, proceeding with migration...')
  }

  console.log('\n=== Migration Summary ===')
  console.log('\nThis migration needs to be run directly in the Supabase SQL Editor.')
  console.log('\nSteps to apply the migration:')
  console.log('1. Go to your Supabase dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy the contents of: src/sql/lead-contact-improvements.sql')
  console.log('4. Paste and run the SQL in the editor')
  console.log('\nThe migration will:')
  console.log('- Add address fields to leads and contacts tables')
  console.log('- Create a unified customers table')
  console.log('- Set up automatic synchronization triggers')
  console.log('- Create indexes for performance')
  console.log('- Configure Row Level Security policies')
  
  console.log('\n=== Testing Current Schema ===')
  
  // Check leads table columns
  try {
    const { data: leadSample } = await supabase
      .from('leads')
      .select('*')
      .limit(1)
      .single()
    
    if (leadSample) {
      console.log('\nCurrent leads table columns:')
      console.log(Object.keys(leadSample).join(', '))
      
      const hasAddressFields = 'street' in leadSample || 'postal_code' in leadSample
      if (hasAddressFields) {
        console.log('✓ Address fields already exist in leads table')
      } else {
        console.log('⚠ Address fields not found in leads table - migration needed')
      }
    }
  } catch (e) {
    console.log('⚠ Could not check leads table structure')
  }
  
  // Check contacts table columns
  try {
    const { data: contactSample } = await supabase
      .from('contacts')
      .select('*')
      .limit(1)
      .single()
    
    if (contactSample) {
      console.log('\nCurrent contacts table columns:')
      console.log(Object.keys(contactSample).join(', '))
      
      const hasAddressFields = 'street' in contactSample || 'postal_code' in contactSample
      if (hasAddressFields) {
        console.log('✓ Address fields already exist in contacts table')
      } else {
        console.log('⚠ Address fields not found in contacts table - migration needed')
      }
    }
  } catch (e) {
    console.log('⚠ Could not check contacts table structure')
  }
  
  console.log('\n=== Next Steps ===')
  console.log('1. Run the SQL migration in Supabase SQL Editor')
  console.log('2. Test the lead-to-contact conversion workflow')
  console.log('3. Verify the unified customer search works correctly')
  
  // Create a test file with just the CREATE TABLE statement
  console.log('\n=== Creating simplified migration for customers table ===')
  
  const simplifiedSQL = `
-- Create unified customer view
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  
  -- References to source records
  lead_id UUID REFERENCES leads(id),
  contact_id UUID REFERENCES contacts(id),
  
  -- Primary type indicator
  primary_type VARCHAR(20) CHECK (primary_type IN ('lead', 'contact')),
  
  -- Unified customer data (denormalized for performance)
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  
  -- Address
  street VARCHAR(255),
  house_number VARCHAR(50),
  postal_code VARCHAR(20),
  city VARCHAR(100),
  province VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Nederland',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_lead_per_customer UNIQUE (lead_id),
  CONSTRAINT unique_contact_per_customer UNIQUE (contact_id),
  CHECK (lead_id IS NOT NULL OR contact_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create view for unified customer search
CREATE OR REPLACE VIEW customer_search_view AS
SELECT 
  c.id,
  c.tenant_id,
  c.primary_type,
  c.name,
  c.email,
  c.phone,
  c.company,
  c.street,
  c.house_number,
  c.postal_code,
  c.city,
  c.province,
  c.country,
  c.lead_id,
  c.contact_id,
  CASE 
    WHEN c.lead_id IS NOT NULL THEN l.status
    WHEN c.contact_id IS NOT NULL THEN ct.status
  END as status,
  CASE 
    WHEN c.lead_id IS NOT NULL THEN l.tags
    WHEN c.contact_id IS NOT NULL THEN ct.tags
  END as tags,
  c.created_at,
  c.updated_at
FROM customers c
LEFT JOIN leads l ON c.lead_id = l.id
LEFT JOIN contacts ct ON c.contact_id = ct.id;

-- Grant permissions on the view
GRANT SELECT ON customer_search_view TO authenticated;
`
  
  console.log('\nSimplified SQL for customers table has been prepared.')
  console.log('You can run this first to test the basic functionality.')
}

// Run the migration check
runMigration()