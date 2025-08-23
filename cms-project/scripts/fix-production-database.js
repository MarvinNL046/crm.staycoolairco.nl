const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProductionDatabase() {
  console.log('🔧 FIXING PRODUCTION DATABASE\n');
  console.log('='.repeat(80));
  console.log('Project: crm.staycoolairco.nl');
  console.log('Starting fixes...\n');

  const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616';
  let fixCount = 0;
  let errorCount = 0;

  try {
    // 1. Add BTW Percentages
    console.log('💰 ADDING BTW PERCENTAGES...\n');
    
    // Check if BTW percentages already exist
    const { count: btwCount } = await supabase
      .from('btw_percentages')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (btwCount === 0) {
      const btwPercentages = [
        { tenant_id: tenantId, percentage: 0, description: 'Vrijgesteld van BTW', is_default: false },
        { tenant_id: tenantId, percentage: 9, description: 'Verlaagd tarief', is_default: false },
        { tenant_id: tenantId, percentage: 21, description: 'Standaard tarief', is_default: true }
      ];

      const { error: btwError } = await supabase
        .from('btw_percentages')
        .insert(btwPercentages);

      if (btwError) {
        console.log('❌ Error adding BTW percentages:', btwError.message);
        errorCount++;
      } else {
        console.log('✅ Added 3 BTW percentages (0%, 9%, 21%)');
        fixCount++;
      }
    } else {
      console.log('ℹ️  BTW percentages already exist');
    }

    // 2. Add Default Tags
    console.log('\n🏷️  ADDING DEFAULT TAGS...\n');
    
    const { count: tagCount } = await supabase
      .from('tags')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (tagCount === 0) {
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

      const { error: tagError } = await supabase
        .from('tags')
        .insert(defaultTags);

      if (tagError) {
        console.log('❌ Error adding tags:', tagError.message);
        errorCount++;
      } else {
        console.log('✅ Added 8 default tags');
        fixCount++;
      }
    } else {
      console.log('ℹ️  Tags already exist');
    }

    // 3. Add Email Templates
    console.log('\n📧 ADDING EMAIL TEMPLATES...\n');
    
    const { count: templateCount } = await supabase
      .from('email_templates')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (templateCount === 0) {
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

      const { error: templateError } = await supabase
        .from('email_templates')
        .insert(emailTemplates);

      if (templateError) {
        console.log('❌ Error adding email templates:', templateError.message);
        errorCount++;
      } else {
        console.log('✅ Added 4 email templates');
        fixCount++;
      }
    } else {
      console.log('ℹ️  Email templates already exist');
    }

    // 4. Add default Pipeline Stages if missing
    console.log('\n📊 CHECKING PIPELINE STAGES...\n');
    
    const { data: stages } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('order_position');

    if (stages && stages.length === 6) {
      console.log('✅ Pipeline stages are complete (6 stages)');
    } else {
      console.log('ℹ️  Pipeline stages might need adjustment');
    }

    // 5. Add Automation Rules
    console.log('\n🤖 ADDING BASIC AUTOMATION RULES...\n');
    
    const { count: automationCount } = await supabase
      .from('automation_rules')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (automationCount === 0) {
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
          },
          is_active: true
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
          },
          is_active: true
        }
      ];

      const { error: automationError } = await supabase
        .from('automation_rules')
        .insert(automationRules);

      if (automationError) {
        console.log('❌ Error adding automation rules:', automationError.message);
        errorCount++;
      } else {
        console.log('✅ Added 2 basic automation rules');
        fixCount++;
      }
    } else {
      console.log('ℹ️  Automation rules already exist');
    }

    // 6. Summary
    console.log('\n\n📊 FIX SUMMARY:\n');
    console.log('='.repeat(80));
    console.log(`✅ Successful fixes: ${fixCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All fixes applied successfully!');
    } else {
      console.log('\n⚠️  Some fixes failed. Please check the errors above.');
    }

    // 7. Final check
    console.log('\n\n🔍 FINAL DATABASE STATUS:\n');
    console.log('-'.repeat(50));
    
    const finalChecks = [
      { table: 'btw_percentages', name: 'BTW Percentages' },
      { table: 'tags', name: 'Tags' },
      { table: 'email_templates', name: 'Email Templates' },
      { table: 'automation_rules', name: 'Automation Rules' },
      { table: 'pipeline_stages', name: 'Pipeline Stages' }
    ];

    for (const check of finalChecks) {
      const { count } = await supabase
        .from(check.table)
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);
      
      console.log(`${check.name}: ${count || 0} records`);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  }
}

fixProductionDatabase();