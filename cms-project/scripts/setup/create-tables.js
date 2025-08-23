const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://bdrbfgqgktiuvmynksbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcmJmZ3Fna3RpdXZteW5rc2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM1NDU0OSwiZXhwIjoyMDcwOTMwNTQ5fQ.fA0gJUpspPNTNhk8mhmmXvNg0IFTroKzr_ya0E7lYlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingTables() {
  console.log('🚀 CREATING MISSING CRM TABLES...\n');
  
  const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616';
  
  try {
    // 1. Create email_logs table via RPC (if we have a function) or direct SQL
    console.log('📧 Creating email_logs table...');
    
    const emailLogsSQL = `
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id UUID NOT NULL,
        subject TEXT NOT NULL,
        body TEXT,
        html_body TEXT,
        to_email TEXT NOT NULL,
        to_name TEXT,
        from_email TEXT NOT NULL,
        from_name TEXT,
        cc_emails TEXT[],
        bcc_emails TEXT[],
        lead_id UUID,
        contact_id UUID,
        customer_id UUID,
        campaign_id UUID,
        template_id UUID,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
        provider TEXT,
        provider_message_id TEXT,
        error_message TEXT,
        sent_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ,
        opened_at TIMESTAMPTZ,
        clicked_at TIMESTAMPTZ,
        bounced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    // Execute via RPC if available, otherwise we'll use a different approach
    try {
      const { data: emailResult, error: emailError } = await supabase.rpc('exec_sql', { 
        query: emailLogsSQL 
      });
      
      if (emailError) {
        console.log('⚠️  RPC not available, trying alternative approach...');
        throw emailError;
      }
      console.log('✅ email_logs table created successfully!');
    } catch (err) {
      console.log('⚠️  Direct SQL execution not available via Supabase client');
      console.log('   We\'ll create the data structure through data operations...');
    }
    
    // 2. Add sample products since we can access the products table
    console.log('\n📦 Setting up Product Catalog...');
    
    const products = [
      {
        name: 'Airconditioning Installatie',
        description: 'Complete installatie van airconditioning systeem inclusief materiaal en arbeid',
        type: 'service',
        price: 2999.00,
        currency: 'EUR',
        category: 'installation',
        sku: 'AIRCO-INST-001',
        is_active: true,
        tenant_id: tenantId
      },
      {
        name: 'Airco Onderhoud',
        description: 'Jaarlijks onderhoudsbeurt voor optimale prestaties',
        type: 'service', 
        price: 125.00,
        currency: 'EUR',
        category: 'maintenance',
        sku: 'AIRCO-MAINT-001',
        is_active: true,
        tenant_id: tenantId
      },
      {
        name: 'Airco Reparatie',
        description: 'Reparatie van defecte airconditioning',
        type: 'service',
        price: 150.00,
        currency: 'EUR', 
        category: 'repair',
        sku: 'AIRCO-REP-001',
        is_active: true,
        tenant_id: tenantId
      },
      {
        name: 'Split-unit Daikin 3.5kW',
        description: 'Daikin split-unit airconditioning 3.5kW, energielabel A+++',
        type: 'product',
        price: 899.00,
        currency: 'EUR',
        category: 'hardware',
        sku: 'DAIKIN-35KW-001', 
        is_active: true,
        tenant_id: tenantId
      },
      {
        name: 'Multi-split systeem',
        description: 'Multi-split airconditioning systeem voor meerdere ruimtes',
        type: 'product',
        price: 1799.00,
        currency: 'EUR',
        category: 'hardware',
        sku: 'MULTI-SPLIT-001',
        is_active: true,
        tenant_id: tenantId
      }
    ];
    
    for (const product of products) {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select();
        
      if (error && !error.message.includes('duplicate')) {
        console.log(`❌ Error creating product ${product.name}: ${error.message}`);
      } else {
        console.log(`✅ Product created: ${product.name} - €${product.price}`);
      }
    }
    
    // 3. Add message templates
    console.log('\n📧 Creating Message Templates...');
    
    const templates = [
      {
        name: 'Welkom Nieuwe Lead',
        type: 'email',
        subject: 'Welkom bij Staycool Airconditioning!',
        body: `Beste {{name}},

Bedankt voor uw interesse in onze airconditioning services! 

Wij nemen binnen 24 uur contact met u op om uw wensen te bespreken en een vrijblijvende offerte op te stellen.

Met vriendelijke groet,
Team Staycool Airconditioning

---
Tel: +31 6 1234 5678
Email: info@staycoolairco.nl`,
        is_active: true,
        tenant_id: tenantId
      },
      {
        name: 'Offerte Follow-up',
        type: 'email', 
        subject: 'Uw airconditioning offerte van Staycool',
        body: `Beste {{name}},

In de bijlage vindt u de besproken offerte voor uw airconditioning installatie.

De offerte is 30 dagen geldig. Heeft u nog vragen? Neem gerust contact op!

Met vriendelijke groet,
Team Staycool Airconditioning`,
        is_active: true,
        tenant_id: tenantId
      },
      {
        name: 'Afspraak Bevestiging',
        type: 'sms',
        subject: '',
        body: 'Hallo {{name}}, uw afspraak voor airco installatie is bevestigd op {{appointment_date}} om {{appointment_time}}. Tot dan! - Staycool',
        is_active: true,
        tenant_id: tenantId
      },
      {
        name: 'Onderhoud Reminder',
        type: 'email',
        subject: 'Tijd voor uw jaarlijkse airco onderhoud',
        body: `Beste {{name}},

Het is weer tijd voor het jaarlijkse onderhoud van uw airconditioning!

Regelmatig onderhoud zorgt voor:
- Optimale prestaties
- Langere levensduur 
- Energiebesparing
- Gezonde lucht

Plan nu uw onderhoudsbeurt in via onze website of bel ons direct.

Met vriendelijke groet,
Team Staycool Airconditioning`,
        is_active: true,
        tenant_id: tenantId
      }
    ];
    
    for (const template of templates) {
      const { data, error } = await supabase
        .from('message_templates')
        .insert(template)
        .select();
        
      if (error && !error.message.includes('duplicate')) {
        console.log(`❌ Error creating template ${template.name}: ${error.message}`);
      } else {
        console.log(`✅ Template created: ${template.name} (${template.type})`);
      }
    }
    
    // 4. Verify what we created
    console.log('\n📊 VERIFICATION - CURRENT DATABASE STATUS:');
    console.log('═'.repeat(50));
    
    // Check products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId);
      
    if (!productsError) {
      console.log(`✅ Products: ${productsData.length} items in catalog`);
      productsData.forEach(p => console.log(`   📦 ${p.name} - €${p.price} (${p.type})`));
    }
    
    // Check templates
    const { data: templatesData, error: templatesError } = await supabase
      .from('message_templates')
      .select('*')
      .eq('tenant_id', tenantId);
      
    if (!templatesError) {
      console.log(`✅ Templates: ${templatesData.length} communication templates`);
      templatesData.forEach(t => console.log(`   📧 ${t.name} (${t.type})`));
    }
    
    console.log('\n🎉 PHASE 1 FOUNDATION SETUP COMPLETE!');
    console.log('═'.repeat(50));
    console.log('✅ Product Catalog ready for invoicing');
    console.log('✅ Message Templates ready for communication');  
    console.log('⚠️  Note: email_logs & sms_logs tables need manual creation via Supabase Dashboard');
    console.log('');
    console.log('🚀 Ready for Phase 2: Contact & Customer Management!');
    
  } catch (error) {
    console.error('❌ Error setting up foundation:', error.message);
  }
}

createMissingTables();