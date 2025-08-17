import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
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
    }
  }
)

async function runMigration() {
  try {
    console.log('Running lead-to-contact workflow improvements migration...')
    
    // Read SQL file
    const sqlPath = join(__dirname, '../../src/sql/lead-contact-improvements.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('Error running migration:', error)
      
      // If RPC doesn't exist, try running statements individually
      console.log('Attempting to run statements individually...')
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      for (const statement of statements) {
        try {
          console.log('Executing:', statement.substring(0, 50) + '...')
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          })
          
          if (stmtError) {
            console.error('Statement error:', stmtError)
          }
        } catch (err) {
          console.error('Failed to execute statement:', err)
        }
      }
    } else {
      console.log('Migration completed successfully!')
    }
    
    // Verify migration
    console.log('\nVerifying migration...')
    
    // Check if customers table exists
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'customers')
      .single()
    
    if (tables) {
      console.log('✓ Customers table created successfully')
    } else {
      console.log('⚠ Customers table not found - you may need to run the migration manually')
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
runMigration()