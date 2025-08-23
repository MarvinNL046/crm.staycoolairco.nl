const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bdrbfgqgktiuvmynksbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcmJmZ3Fna3RpdXZteW5rc2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM1NDU0OSwiZXhwIjoyMDcwOTMwNTQ5fQ.fA0gJUpspPNTNhk8mhmmXvNg0IFTroKzr_ya0E7lYlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTemplates() {
  console.log('📧 CREATING MESSAGE TEMPLATES (corrected fields)\n');
  
  const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616';
  
  const simpleTemplates = [
    {
      name: 'Welkom Nieuwe Lead',
      channel: 'email',
      subject: 'Welkom bij Staycool Airconditioning!',
      body: `Beste {{name}},

Hartelijk dank voor uw interesse in onze airconditioning services! 

Wij zijn gespecialiseerd in:
✅ Professionele installatie van airconditioners
✅ Regelmatig onderhoud voor optimale prestaties  
✅ Snelle reparaties door ervaren technici

Binnen 24 uur nemen wij contact met u op.

Met vriendelijke groet,
Team Staycool Airconditioning
📞 +31 6 3648 1054`,
      tenant_id: tenantId
    },
    {
      name: 'Offerte Follow-up',
      channel: 'email',
      subject: 'Uw airconditioning offerte van Staycool',
      body: `Beste {{name}},

Bijgaand vindt u de besproken offerte voor uw airconditioning project.

De offerte is 30 dagen geldig. 
Heeft u nog vragen? Neem gerust contact op!

Met vriendelijke groet,
Team Staycool Airconditioning`,
      tenant_id: tenantId
    },
    {
      name: 'Afspraak Bevestiging',
      channel: 'sms', 
      subject: '',
      body: 'Hallo {{name}}, uw afspraak voor airco service is bevestigd op {{date}} om {{time}}. Tot dan! - Staycool',
      tenant_id: tenantId
    },
    {
      name: 'Onderhoud Reminder',
      channel: 'email',
      subject: 'Tijd voor uw jaarlijkse airco onderhoud',
      body: `Beste {{name}},

Het is weer tijd voor het jaarlijkse onderhoud van uw airconditioning!

Voordelen van regelmatig onderhoud:
- Optimale prestaties
- Langere levensduur
- Energiebesparing
- Gezonde lucht

Plan nu uw onderhoudsbeurt in!

Met vriendelijke groet,
Team Staycool Airconditioning`,
      tenant_id: tenantId
    }
  ];
  
  for (const template of simpleTemplates) {
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
}

fixTemplates();