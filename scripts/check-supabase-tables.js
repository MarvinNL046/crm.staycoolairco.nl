require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
    try {
        // Query to get all tables from the public schema
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');

        if (error) {
            // Try alternative approach - query each potential table
            console.log('Checking tables using alternative method...');
            
            const potentialTables = [
                'leads', 'contacts', 'users', 'companies', 'deals', 
                'pipelines', 'tasks', 'activities', 'notes', 'tags',
                'invoices', 'quotes', 'invoice_items', 'products'
            ];

            console.log('\nExisting tables:');
            for (const table of potentialTables) {
                try {
                    const { data, error } = await supabase
                        .from(table)
                        .select('*')
                        .limit(1);
                    
                    if (!error) {
                        console.log(`✓ ${table}`);
                    }
                } catch (e) {
                    // Table doesn't exist
                }
            }
        } else {
            console.log('Tables in database:');
            data.forEach(table => {
                console.log(`- ${table.table_name}`);
            });
        }

        // Check specific tables we need
        console.log('\nChecking CRM tables structure...');
        
        // Check leads table
        try {
            const { data: leadsData, error: leadsError } = await supabase
                .from('leads')
                .select('*')
                .limit(1);
            
            if (!leadsError && leadsData) {
                console.log('\nLeads table columns:', Object.keys(leadsData[0] || {}));
            }
        } catch (e) {
            console.log('Leads table not found');
        }

        // Check contacts table
        try {
            const { data: contactsData, error: contactsError } = await supabase
                .from('contacts')
                .select('*')
                .limit(1);
            
            if (!contactsError && contactsData) {
                console.log('\nContacts table columns:', Object.keys(contactsData[0] || {}));
            }
        } catch (e) {
            console.log('Contacts table not found');
        }

    } catch (err) {
        console.error('Error checking tables:', err);
    }
}

checkTables();