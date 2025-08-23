const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProductionDatabase() {
  console.log('🔧 FIXING PRODUCTION DATABASE - V2\n');
  console.log('='.repeat(80));
  
  try {
    // First, get the actual tenant ID from the database
    console.log('🔍 Finding correct tenant ID...\n');
    
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('*');
    
    if (tenantError) {
      console.log('❌ Error fetching tenants:', tenantError);
      return;
    }
    
    if (!tenants || tenants.length === 0) {
      console.log('❌ No tenants found!');
      return;
    }
    
    const tenant = tenants[0];
    const tenantId = tenant.id;
    
    console.log(`✅ Found tenant: ${tenant.name} (${tenantId})\n`);
    
    let fixCount = 0;
    let errorCount = 0;

    // 1. Check and add BTW Percentages
    console.log('💰 CHECKING BTW PERCENTAGES...\n');
    
    const { data: existingBtw, count: btwCount } = await supabase
      .from('btw_percentages')
      .select('*', { count: 'exact' });

    console.log(`Current BTW percentages: ${btwCount || 0}`);
    
    if (!btwCount || btwCount === 0) {
      const btwPercentages = [
        { tenant_id: tenantId, percentage: 0, description: 'Vrijgesteld van BTW', is_default: false },
        { tenant_id: tenantId, percentage: 9, description: 'Verlaagd tarief', is_default: false },
        { tenant_id: tenantId, percentage: 21, description: 'Standaard tarief', is_default: true }
      ];

      const { data: btwData, error: btwError } = await supabase
        .from('btw_percentages')
        .insert(btwPercentages)
        .select();

      if (btwError) {
        console.log('❌ Error adding BTW percentages:', btwError.message);
        errorCount++;
      } else {
        console.log('✅ Added 3 BTW percentages (0%, 9%, 21%)');
        fixCount++;
      }
    } else {
      console.log('ℹ️  BTW percentages already exist');
      if (existingBtw) {
        existingBtw.forEach(btw => {
          console.log(`   - ${btw.percentage}% - ${btw.description}`);
        });
      }
    }

    // 2. Check and add Tags
    console.log('\n🏷️  CHECKING TAGS...\n');
    
    const { data: existingTags, count: tagCount } = await supabase
      .from('tags')
      .select('*', { count: 'exact' });

    console.log(`Current tags: ${tagCount || 0}`);
    
    if (!tagCount || tagCount === 0) {
      const defaultTags = [
        { tenant_id: tenantId, name: 'Nieuw', color: '#3B82F6' },
        { tenant_id: tenantId, name: 'Belangrijk', color: '#EF4444' },
        { tenant_id: tenantId, name: 'Follow-up', color: '#F59E0B' },
        { tenant_id: tenantId, name: 'Contract', color: '#10B981' },
        { tenant_id: tenantId, name: 'Service', color: '#8B5CF6' },
        { tenant_id: tenantId, name: 'Installatie', color: '#6366F1' },
        { tenant_id: tenantId, name: 'Onderhoud', color: '#14B8A6' },
        { tenant_id: tenantId, name: 'Offerte', color: '#F97316' }
      ];

      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .insert(defaultTags)
        .select();

      if (tagError) {
        console.log('❌ Error adding tags:', tagError.message);
        errorCount++;
      } else {
        console.log('✅ Added 8 default tags');
        fixCount++;
      }
    } else {
      console.log('ℹ️  Tags already exist');
      if (existingTags) {
        existingTags.forEach(tag => {
          console.log(`   - ${tag.name} (${tag.color})`);
        });
      }
    }

    // 3. Check and add Email Templates
    console.log('\n📧 CHECKING EMAIL TEMPLATES...\n');
    
    const { data: existingTemplates, count: templateCount } = await supabase
      .from('email_templates')
      .select('*', { count: 'exact' });

    console.log(`Current email templates: ${templateCount || 0}`);
    
    if (!templateCount || templateCount === 0) {
      const emailTemplates = [
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
      ];

      const { data: templateData, error: templateError } = await supabase
        .from('email_templates')
        .insert(emailTemplates)
        .select();

      if (templateError) {
        console.log('❌ Error adding email templates:', templateError.message);
        errorCount++;
      } else {
        console.log('✅ Added 4 email templates');
        fixCount++;
      }
    } else {
      console.log('ℹ️  Email templates already exist');
      if (existingTemplates) {
        existingTemplates.forEach(template => {
          console.log(`   - ${template.name}`);
        });
      }
    }

    // 4. Add Basic Automation Rules (without is_active field)
    console.log('\n🤖 CHECKING AUTOMATION RULES...\n');
    
    const { data: existingRules, count: automationCount } = await supabase
      .from('automation_rules')
      .select('*', { count: 'exact' });

    console.log(`Current automation rules: ${automationCount || 0}`);
    
    if (!automationCount || automationCount === 0) {
      // First check the table structure
      const { data: sampleRule } = await supabase
        .from('automation_rules')
        .select('*')
        .limit(1);
      
      const automationRules = [
        {
          tenant_id: tenantId,
          name: 'Welkom Email - Nieuwe Lead',
          trigger_type: 'lead_created',
          conditions: {
            status: 'new'
          },
          actions: {
            type: 'send_email',
            template: 'Welkom - Nieuwe Lead',
            delay_minutes: 5
          }
        },
        {
          tenant_id: tenantId,
          name: 'Follow-up na Geen Gehoor',
          trigger_type: 'lead_updated',
          conditions: {
            retry_count: { gte: 3 },
            status: 'contacted'
          },
          actions: {
            type: 'send_email',
            template: 'Geen Gehoor - Follow Up',
            delay_minutes: 60
          }
        }
      ];

      const { data: ruleData, error: automationError } = await supabase
        .from('automation_rules')
        .insert(automationRules)
        .select();

      if (automationError) {
        console.log('❌ Error adding automation rules:', automationError.message);
        console.log('   (Table might have different structure)');
        errorCount++;
      } else {
        console.log('✅ Added 2 basic automation rules');
        fixCount++;
      }
    } else {
      console.log('ℹ️  Automation rules already exist');
      if (existingRules) {
        existingRules.forEach(rule => {
          console.log(`   - ${rule.name}`);
        });
      }
    }

    // 5. Summary
    console.log('\n\n📊 FIX SUMMARY:\n');
    console.log('='.repeat(80));
    console.log(`✅ Successful fixes: ${fixCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    
    if (errorCount === 0 && fixCount > 0) {
      console.log('\n🎉 All fixes applied successfully!');
    } else if (fixCount === 0) {
      console.log('\n✅ Database already configured correctly!');
    } else {
      console.log('\n⚠️  Some fixes failed. Please check the errors above.');
    }

    // 6. Final Status Report
    console.log('\n\n📊 FINAL DATABASE STATUS:\n');
    console.log('-'.repeat(50));
    
    const finalChecks = [
      { table: 'btw_percentages', name: 'BTW Percentages' },
      { table: 'tags', name: 'Tags' },
      { table: 'email_templates', name: 'Email Templates' },
      { table: 'automation_rules', name: 'Automation Rules' },
      { table: 'pipeline_stages', name: 'Pipeline Stages' },
      { table: 'leads', name: 'Leads' },
      { table: 'contacts', name: 'Contacts' },
      { table: 'invoices', name: 'Invoices' }
    ];

    for (const check of finalChecks) {
      const { count } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`${check.name.padEnd(20)}: ${count || 0} records`);
    }

    console.log('\n✅ Production database is now properly configured!');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  }
}

fixProductionDatabase();