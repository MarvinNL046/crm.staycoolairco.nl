const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addConfigData() {
  console.log('🔧 Adding configuration data to production...\n');
  console.log('='.repeat(80));
  
  const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616';
  let addedCount = 0;
  
  try {
    // 1. Add BTW Percentages
    console.log('💰 Adding BTW Percentages...');
    
    const { count: btwCount } = await supabase
      .from('btw_percentages')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);
    
    if (!btwCount || btwCount === 0) {
      const { data: btwData, error: btwError } = await supabase
        .from('btw_percentages')
        .insert([
          { tenant_id: tenantId, percentage: 0, description: 'Vrijgesteld van BTW', is_default: false },
          { tenant_id: tenantId, percentage: 9, description: 'Verlaagd tarief', is_default: false },
          { tenant_id: tenantId, percentage: 21, description: 'Standaard tarief', is_default: true }
        ]);
      
      if (!btwError) {
        console.log('✅ Added 3 BTW percentages (0%, 9%, 21%)');
        addedCount++;
      } else {
        console.log('❌ Error:', btwError.message);
      }
    } else {
      console.log('ℹ️  BTW percentages already exist');
    }
    
    // 2. Add Tags
    console.log('\n🏷️  Adding Tags...');
    
    const { count: tagCount } = await supabase
      .from('tags')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);
    
    if (!tagCount || tagCount === 0) {
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .insert([
          { tenant_id: tenantId, name: 'Nieuw', color: '#3B82F6' },
          { tenant_id: tenantId, name: 'Belangrijk', color: '#EF4444' },
          { tenant_id: tenantId, name: 'Follow-up', color: '#F59E0B' },
          { tenant_id: tenantId, name: 'Contract', color: '#10B981' },
          { tenant_id: tenantId, name: 'Service', color: '#8B5CF6' },
          { tenant_id: tenantId, name: 'Installatie', color: '#6366F1' },
          { tenant_id: tenantId, name: 'Onderhoud', color: '#14B8A6' },
          { tenant_id: tenantId, name: 'Offerte', color: '#F97316' }
        ]);
      
      if (!tagError) {
        console.log('✅ Added 8 default tags');
        addedCount++;
      } else {
        console.log('❌ Error:', tagError.message);
      }
    } else {
      console.log('ℹ️  Tags already exist');
    }
    
    // 3. Add Email Templates
    console.log('\n📧 Adding Email Templates...');
    
    const { count: templateCount } = await supabase
      .from('email_templates')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);
    
    if (!templateCount || templateCount === 0) {
      const { data: templateData, error: templateError } = await supabase
        .from('email_templates')
        .insert([
          {
            tenant_id: tenantId,
            name: 'Welkom - Nieuwe Lead',
            subject: 'Welkom bij StayCool Airconditioning',
            body: `Beste {{name}},

Bedankt voor uw interesse in StayCool Airconditioning. Wij zijn specialist in klimaatbeheersing en helpen u graag met het vinden van de perfecte oplossing.

Een van onze specialisten neemt binnenkort contact met u op om uw wensen te bespreken.

Met vriendelijke groet,
Het StayCool Team`,
            category: 'welcome',
            variables: ['name']
          },
          {
            tenant_id: tenantId,
            name: 'Offerte Opvolging',
            subject: 'Uw offerte van StayCool - {{company}}',
            body: `Beste {{name}},

Onlangs hebben wij u een offerte gestuurd voor {{company}}. Wij zijn benieuwd of u nog vragen heeft over onze offerte.

Mocht u aanvullende informatie wensen of een afspraak willen maken, neem dan gerust contact met ons op.

Met vriendelijke groet,
{{sales_person}}
StayCool Airconditioning`,
            category: 'sales',
            variables: ['name', 'company', 'sales_person']
          },
          {
            tenant_id: tenantId,
            name: 'Onderhouds Herinnering',
            subject: 'Tijd voor onderhoud - {{company}}',
            body: `Beste {{name}},

Het is weer tijd voor het periodieke onderhoud van uw airconditioning systeem bij {{company}}.

Regelmatig onderhoud zorgt voor:
- Optimale werking van uw systeem
- Langere levensduur
- Lagere energiekosten
- Gezondere lucht

Neem contact met ons op om een afspraak te plannen.

Met vriendelijke groet,
StayCool Service Team`,
            category: 'service',
            variables: ['name', 'company']
          },
          {
            tenant_id: tenantId,
            name: 'Geen Gehoor - Follow Up',
            subject: 'We hebben u gemist - StayCool',
            body: `Beste {{name}},

We hebben geprobeerd u telefonisch te bereiken, maar helaas zonder succes.

Uw aanvraag is belangrijk voor ons. U kunt ons bereiken op:
- Telefoon: 0800-STAYCOOL
- Email: info@staycoolairco.nl
- Of reply op deze email

We horen graag van u!

Met vriendelijke groet,
StayCool Team`,
            category: 'follow-up',
            variables: ['name']
          }
        ]);
      
      if (!templateError) {
        console.log('✅ Added 4 email templates');
        addedCount++;
      } else {
        console.log('❌ Error:', templateError.message);
      }
    } else {
      console.log('ℹ️  Email templates already exist');
    }
    
    // Summary
    console.log('\n\n📊 SUMMARY:\n');
    console.log('='.repeat(80));
    
    if (addedCount > 0) {
      console.log(`✅ Successfully added ${addedCount} configuration items!`);
    } else {
      console.log('ℹ️  All configuration data already exists.');
    }
    
    // Final check
    console.log('\n📋 Current configuration status:');
    
    const finalChecks = [
      { table: 'btw_percentages', name: 'BTW Percentages' },
      { table: 'tags', name: 'Tags' },
      { table: 'email_templates', name: 'Email Templates' }
    ];
    
    for (const check of finalChecks) {
      const { count } = await supabase
        .from(check.table)
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);
      
      console.log(`${check.name}: ${count || 0} items`);
    }
    
    console.log('\n✅ Configuration data setup complete!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

addConfigData();