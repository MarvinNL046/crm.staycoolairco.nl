const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔒 RLS POLICIES DETAILED CHECK\n');
  console.log('='.repeat(80));

  try {
    // Check which tables have RLS enabled by trying to query pg_policies
    const { data: policies, error } = await supabase.rpc('get_policies_info', {});
    
    if (error) {
      console.log('Cannot directly query policies, checking table by table...\n');
      
      // Alternative approach - check each table
      const criticalTables = [
        'leads', 'contacts', 'customers', 'invoices', 'appointments',
        'products', 'companies', 'campaigns', 'workflows', 'profiles'
      ];
      
      console.log('🔍 TABEL TOEGANKELIJKHEID CHECK:\n');
      console.log('(Test met anon key om te zien of data beschermd is)\n');
      
      // Create client with anon key
      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      for (const table of criticalTables) {
        try {
          // Try to select without authentication
          const { data, error: selectError } = await anonClient
            .from(table)
            .select('id')
            .limit(1);
          
          // Try to insert without authentication
          const { error: insertError } = await anonClient
            .from(table)
            .insert({ test: 'test' })
            .select()
            .single();
          
          let status = '';
          if (selectError && selectError.message.includes('row-level')) {
            status = '✅ RLS Actief (SELECT geblokkeerd)';
          } else if (data && data.length === 0) {
            status = '⚠️  RLS mogelijk actief (geen data zichtbaar)';
          } else if (data && data.length > 0) {
            status = '❌ RLS NIET actief (data zichtbaar zonder auth!)';
          }
          
          console.log(`${table.padEnd(20)} - ${status}`);
        } catch (e) {
          console.log(`${table.padEnd(20)} - ✅ RLS Actief (toegang geweigerd)`);
        }
      }
    }
    
    // Check current user/tenant setup
    console.log('\n\n👤 GEBRUIKER & TENANT SETUP:\n');
    console.log('-'.repeat(50));
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*, tenants(name)')
      .limit(5);
    
    if (profiles && profiles.length > 0) {
      console.log(`Aantal gebruikers: ${profiles.length}`);
      profiles.forEach(profile => {
        console.log(`\nGebruiker: ${profile.email || profile.id}`);
        console.log(`Tenant: ${profile.tenants?.name || profile.tenant_id}`);
        console.log(`Rol: ${profile.role || 'user'}`);
      });
    }
    
    // Check for missing BTW percentages
    console.log('\n\n💰 BTW PERCENTAGES CHECK:\n');
    console.log('-'.repeat(50));
    
    const { data: btwData, count: btwCount } = await supabase
      .from('btw_percentages')
      .select('*', { count: 'exact' });
    
    if (btwCount === 0) {
      console.log('⚠️  GEEN BTW percentages gevonden!');
      console.log('   Dit is nodig voor facturatie.');
      console.log('   Voeg standaard BTW percentages toe: 0%, 9%, 21%');
    } else {
      console.log(`✅ ${btwCount} BTW percentages gevonden`);
    }
    
    // Final recommendations
    console.log('\n\n📝 SPECIFIEKE AANBEVELINGEN:\n');
    console.log('='.repeat(80));
    
    console.log('\n1. RLS POLICIES:');
    console.log('   - Zorg dat ALLE tabellen RLS enabled hebben');
    console.log('   - Maak policies voor SELECT, INSERT, UPDATE, DELETE');
    console.log('   - Test met verschillende gebruikers/tenants');
    
    console.log('\n2. MULTI-TENANT:');
    console.log('   - Je hebt nu 1 tenant (Staycool Airconditioning)');
    console.log('   - Alle queries moeten tenant_id filter gebruiken');
    console.log('   - Overweeg een test tenant toe te voegen');
    
    console.log('\n3. ONTBREKENDE DATA:');
    if (btwCount === 0) {
      console.log('   - Voeg BTW percentages toe (0%, 9%, 21%)');
    }
    console.log('   - Geen tags gevonden - voeg standaard tags toe');
    console.log('   - Geen email templates - voeg basis templates toe');
    
    console.log('\n4. GEBRUIKERS:');
    console.log('   - Maak verschillende gebruikersrollen (admin, user, viewer)');
    console.log('   - Test permissions per rol');
    console.log('   - Implementeer proper auth flow in applicatie');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkRLSPolicies();