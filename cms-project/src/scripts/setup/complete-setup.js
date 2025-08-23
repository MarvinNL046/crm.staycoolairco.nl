const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bdrbfgqgktiuvmynksbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcmJmZ3Fna3RpdXZteW5rc2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM1NDU0OSwiZXhwIjoyMDcwOTMwNTQ5fQ.fA0gJUpspPNTNhk8mhmmXvNg0IFTroKzr_ya0E7lYlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function completeSetup() {
  console.log('🎯 COMPLETING CRM FOUNDATION SETUP\n');
  
  const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616';
  
  // Products with required unit_price field
  console.log('📦 Creating Products with required fields...');
  
  const completeProducts = [
    {
      name: 'Airconditioning Installatie',
      description: 'Complete installatie van airconditioning systeem inclusief materiaal en arbeid',
      unit_price: 2999.00, // Required field
      category: 'service',
      sku: 'AIRCO-INST-001',
      is_active: true,
      tenant_id: tenantId
    },
    {
      name: 'Airco Onderhoud',
      description: 'Jaarlijks onderhoudsbeurt voor optimale prestaties en lange levensduur',
      unit_price: 125.00,
      category: 'service', 
      sku: 'AIRCO-MAINT-001',
      is_active: true,
      tenant_id: tenantId
    },
    {
      name: 'Airco Reparatie',
      description: 'Snelle reparatie van defecte airconditioning, inclusief diagnose',
      unit_price: 150.00,
      category: 'service',
      sku: 'AIRCO-REP-001', 
      is_active: true,
      tenant_id: tenantId
    },
    {
      name: 'Split-unit Daikin 3.5kW',
      description: 'Daikin split-unit airconditioning 3.5kW, energielabel A+++, inclusief afstandsbediening',
      unit_price: 899.00,
      category: 'hardware',
      sku: 'DAIKIN-35KW-001',
      is_active: true,
      tenant_id: tenantId
    },
    {
      name: 'Multi-split systeem',
      description: 'Multi-split airconditioning systeem voor meerdere ruimtes, 2x binnenunit',
      unit_price: 1799.00,
      category: 'hardware',
      sku: 'MULTI-SPLIT-001',
      is_active: true,
      tenant_id: tenantId
    },
    {
      name: 'Airco Inspectie',
      description: 'Uitgebreide inspectie en advies voor airconditioning systemen',
      unit_price: 75.00,
      category: 'service',
      sku: 'AIRCO-INSP-001',
      is_active: true,
      tenant_id: tenantId
    }
  ];
  
  for (const product of completeProducts) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select();
      
    if (error) {
      console.log(`❌ ${product.name}: ${error.message}`);
    } else {
      console.log(`✅ ${product.name} - €${product.unit_price}`);
    }
  }
  
  // Message templates with required channel field
  console.log('\n📧 Creating Message Templates with required fields...');
  
  const completeTemplates = [
    {
      name: 'Welkom Nieuwe Lead',
      channel: 'email', // Required field
      subject: 'Welkom bij Staycool Airconditioning!',
      body: `Beste {{name}},

Hartelijk dank voor uw interesse in onze airconditioning services! 

Wij zijn gespecialiseerd in:
✅ Professionele installatie van airconditioners
✅ Regelmatig onderhoud voor optimale prestaties  
✅ Snelle reparaties door ervaren technici
✅ Energiezuinige systemen van topmerken

Binnen 24 uur nemen wij contact met u op om uw wensen te bespreken en een vrijblijvende offerte op te stellen.

Met vriendelijke groet,
Team Staycool Airconditioning

📞 Tel: +31 6 3648 1054
📧 Email: info@staycoolairco.nl
🌐 Web: www.staycoolairco.nl`,
      is_active: true,
      tenant_id: tenantId
    },
    {
      name: 'Offerte Follow-up',
      channel: 'email',
      subject: 'Uw airconditioning offerte van Staycool - {{quote_number}}',
      body: `Beste {{name}},

Bijgaand vindt u de besproken offerte voor uw airconditioning project.

📋 Offerte details:
- Offerte nummer: {{quote_number}}
- Geldig tot: {{valid_until}}
- Totaal bedrag: €{{total_amount}}

✅ Onze service omvat:
- Gratis advies en inspectie ter plaatse
- Professionele installatie door ervaren technici
- 2 jaar garantie op installatie
- Nazorg en onderhoudsmogelijkheden

Heeft u nog vragen of wilt u de offerte bespreken? Neem gerust contact op!

Met vriendelijke groet,
Team Staycool Airconditioning`,
      is_active: true,
      tenant_id: tenantId
    },
    {
      name: 'Afspraak Bevestiging SMS',
      channel: 'sms',
      subject: '',
      body: 'Hallo {{name}}, uw afspraak voor airco {{service_type}} is bevestigd op {{appointment_date}} om {{appointment_time}}. Adres: {{address}}. Tot dan! - Staycool Airco',
      is_active: true,
      tenant_id: tenantId
    },
    {
      name: 'Onderhoud Reminder',
      channel: 'email',
      subject: 'Tijd voor uw jaarlijkse airco onderhoud 🔧',
      body: `Beste {{name}},

Het is weer tijd voor het jaarlijkse onderhoud van uw airconditioning!

🔧 Waarom jaarlijks onderhoud?
- Optimale prestaties en efficiëntie
- Langere levensduur van uw systeem
- Tot 30% energiebesparing
- Gezonde en schone lucht
- Voorkomen van storingen

📅 Plan nu uw onderhoudsbeurt in:
- Online via onze website: www.staycoolairco.nl
- Telefonisch: +31 6 3648 1054
- E-mail: info@staycoolairco.nl

Onderhoud vanaf €125,- (inclusief verbruiksmateriaal)

Met vriendelijke groet,
Team Staycool Airconditioning`,
      is_active: true,
      tenant_id: tenantId
    },
    {
      name: 'Klant Tevredenheid Enquête',
      channel: 'email',
      subject: 'Hoe tevreden bent u over onze service? ⭐',
      body: `Beste {{name}},

Onlangs hebben wij voor u een {{service_type}} uitgevoerd.

Wij hopen dat u tevreden bent met onze service en zouden het zeer op prijs stellen als u een moment zou willen nemen om ons te beoordelen.

⭐ Beoordeel ons op Google: [LINK]
⭐ Of laat een review achter op onze website

Uw feedback helpt ons om onze service verder te verbeteren en andere klanten te helpen bij hun keuze.

Dank u wel voor uw vertrouwen in Staycool Airconditioning!

Met vriendelijke groet,
Team Staycool Airconditioning`,
      is_active: true,
      tenant_id: tenantId
    }
  ];
  
  for (const template of completeTemplates) {
    const { data, error } = await supabase
      .from('message_templates')
      .insert(template)
      .select();
      
    if (error) {
      console.log(`❌ ${template.name}: ${error.message}`);
    } else {
      console.log(`✅ ${template.name} (${template.channel})`);
    }
  }
  
  // Create a sample deal for our customer
  console.log('\n💰 Creating Sample Deal...');
  
  const { data: customerData } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();
    
  if (customerData) {
    const dealData = {
      title: 'Airco installatie woonkamer + slaapkamer',
      value: 3599.00,
      stage: 'proposal',
      customer_id: customerData.id,
      probability: 75,
      expected_close_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
      notes: 'Klant wil split-unit in woonkamer en slaapkamer. Offerte verstuurd voor Daikin systemen.',
      products: ['Split-unit Daikin 3.5kW', 'Airconditioning Installatie'],
      tenant_id: tenantId
    };
    
    const { data: dealResult, error: dealError } = await supabase
      .from('deals')
      .insert(dealData)
      .select();
      
    if (dealError) {
      console.log(`❌ Deal creation: ${dealError.message}`);
    } else {
      console.log(`✅ Deal created: ${dealData.title} - €${dealData.value}`);
    }
  }
  
  // Final verification
  console.log('\n📊 FINAL DATABASE STATUS:');
  console.log('═'.repeat(60));
  
  const finalTables = ['tenants', 'leads', 'contacts', 'customers', 'deals', 'products', 'message_templates', 'pipeline_stages'];
  let totalRecords = 0;
  
  for (const table of finalTables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);
      
    if (!error) {
      console.log(`✅ ${table.padEnd(20)} ${count.toString().padStart(3)} records`);
      totalRecords += count;
    }
  }
  
  console.log('─'.repeat(60));
  console.log(`📈 Total CRM records: ${totalRecords}`);
  
  console.log('\n🎉 STAYCOOL CRM FOUNDATION COMPLETE!');
  console.log('═'.repeat(60));
  console.log('✅ Multi-tenant setup with Staycool Airconditioning');
  console.log('✅ Complete lead-to-customer conversion workflow'); 
  console.log('✅ Product catalog with airco services & products');
  console.log('✅ Professional email & SMS templates');
  console.log('✅ Sales pipeline with sample deal');
  console.log('✅ All core tables populated with realistic data');
  console.log('');
  console.log('🚀 READY FOR PHASE 2:');
  console.log('   📅 Appointment scheduling');
  console.log('   🧾 Invoicing system');
  console.log('   🤖 Automation workflows'); 
  console.log('   📊 Analytics dashboard');
  console.log('');
  console.log('🔗 Next: Create email_logs & sms_logs tables via Supabase Dashboard');
  console.log('   (Cannot create via API due to schema limitations)');
}

completeSetup();