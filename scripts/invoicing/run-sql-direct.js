#!/usr/bin/env node

/**
 * Direct SQL Execution Script voor Supabase
 * 
 * Dit script voert het SQL direct uit via de Supabase client
 * Als alternatief voor de swarm setup
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

async function runSQL() {
  console.log(`${colors.cyan}🚀 Starting Supabase SQL execution...${colors.reset}\n`);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error(`${colors.red}❌ Error: Missing Supabase credentials in .env.local${colors.reset}`);
    console.log(`
Please add to your .env.local:
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key (optional but recommended)
`);
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const sqlContent = await fs.readFile(path.join(__dirname, 'setup-database.sql'), 'utf8');
    
    console.log(`${colors.yellow}📝 SQL script loaded, preparing execution...${colors.reset}`);
    
    // Voor Supabase moeten we het SQL via de dashboard uitvoeren
    // Dit script genereert instructies
    
    console.log(`
${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}
${colors.green}✅ SQL Script Ready!${colors.reset}

Since Supabase doesn't support direct SQL execution via the client library,
please follow these steps:

1. Open your Supabase Dashboard:
   ${colors.cyan}${supabaseUrl.replace('.supabase.co', '.supabase.com/project/_/sql')}${colors.reset}

2. Copy the SQL from this file:
   ${colors.yellow}${path.join(__dirname, 'setup-database.sql')}${colors.reset}

3. Paste and run in the SQL Editor

4. After running, test with this command:
   ${colors.cyan}npm run dev${colors.reset}

${colors.green}The SQL script will create:${colors.reset}
  • quotes table - For managing quotes/offers
  • invoices table - For managing invoices  
  • line_items table - For quote/invoice items
  • payments table - For tracking payments
  • products table - For product catalog
  • All necessary indexes and RLS policies

${colors.yellow}Alternative: Use the automated setup:${colors.reset}
  ${colors.cyan}node scripts/invoicing/setup-invoicing-swarm.js${colors.reset}
${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}
`);
    
    // Create a simple test to verify tables exist
    console.log(`${colors.yellow}Testing connection...${colors.reset}`);
    const { data, error } = await supabase.from('tenants').select('id').limit(1);
    
    if (error) {
      console.log(`${colors.red}❌ Connection test failed: ${error.message}${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Supabase connection successful!${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSQL();
}