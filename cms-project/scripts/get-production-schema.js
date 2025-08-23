const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getProductionSchema() {
  console.log('🔍 Fetching production database schema...\n');

  try {
    // Execute raw SQL query to get all tables
    const { data: tablesData, error: tablesError } = await supabase.rpc('get_tables_info', {
      schema_name: 'public'
    }).single();

    if (tablesError) {
      // If RPC doesn't exist, let's try a different approach
      console.log('RPC function not found, trying direct table access...\n');
      
      // Try to list known tables
      const knownTables = [
        'leads', 'contacts', 'customers', 'companies',
        'invoices', 'invoice_items', 'products', 'btw_percentages',
        'appointments', 'appointment_reminders', 'recurring_appointments',
        'campaigns', 'campaign_metrics', 'email_templates', 'email_logs',
        'workflows', 'workflow_templates', 'workflow_executions', 'workflow_steps',
        'pipeline_stages', 'tags', 'profiles', 'tenants', 'api_keys',
        'webhook_logs', 'automation_rules', 'automation_logs'
      ];

      console.log('📊 Checking for known tables in production:\n');
      
      const existingTables = [];
      
      for (const tableName of knownTables) {
        try {
          // Try to select from the table
          const { error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            existingTables.push(tableName);
            console.log(`✅ ${tableName}`);
          } else {
            console.log(`❌ ${tableName} - ${error.message}`);
          }
        } catch (e) {
          console.log(`❌ ${tableName} - Error`);
        }
      }

      console.log(`\n\n📋 Found ${existingTables.length} tables in production\n`);

      // Get detailed schema for existing tables
      console.log('📊 DETAILED SCHEMA FOR CORE TABLES:');
      console.log('='.repeat(60));

      const coreTables = ['leads', 'contacts', 'customers', 'invoices', 'appointments'].filter(
        t => existingTables.includes(t)
      );

      for (const tableName of coreTables) {
        console.log(`\n\n🔷 ${tableName.toUpperCase()}`);
        console.log('-'.repeat(40));

        // Get a sample record to infer schema
        const { data: sample, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
          .single();

        if (sample && !sampleError) {
          const columns = Object.keys(sample);
          console.log('Columns found:');
          columns.forEach(col => {
            const value = sample[col];
            const type = value === null ? 'unknown' : typeof value;
            console.log(`  - ${col} (${type})`);
          });
        } else {
          console.log('  Unable to fetch schema');
        }

        // Get count
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        console.log(`\nRecord count: ${count || 0}`);
      }

      // Generate migration SQL
      console.log('\n\n📝 GENERATING MIGRATION SCRIPTS...\n');
      
      const migrationPath = './supabase/migrations/001_production_schema.sql';
      let migrationSQL = `-- Production database schema for StayCool CRM
-- Generated on ${new Date().toISOString()}

`;

      // Add basic table creation for core tables
      if (existingTables.includes('leads')) {
        migrationSQL += `-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  city VARCHAR(100),
  status VARCHAR(50) DEFAULT 'new',
  source VARCHAR(100),
  value DECIMAL(10,2),
  notes TEXT,
  retry_count INTEGER DEFAULT 0,
  assigned_to UUID,
  tags TEXT[],
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

`;
      }

      if (existingTables.includes('contacts')) {
        migrationSQL += `-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  lead_id UUID REFERENCES leads(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  address VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

`;
      }

      if (existingTables.includes('customers')) {
        migrationSQL += `-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  customer_number VARCHAR(50) UNIQUE,
  company_name VARCHAR(255),
  btw_number VARCHAR(50),
  kvk_number VARCHAR(50),
  billing_address VARCHAR(255),
  billing_city VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(100),
  shipping_address VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(100),
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

`;
      }

      if (existingTables.includes('invoices')) {
        migrationSQL += `-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(50) DEFAULT 'draft',
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(10,2) DEFAULT 0,
  btw_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

`;
      }

      console.log('Migration script preview:');
      console.log(migrationSQL.substring(0, 500) + '...\n');

      return existingTables;
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

getProductionSchema();