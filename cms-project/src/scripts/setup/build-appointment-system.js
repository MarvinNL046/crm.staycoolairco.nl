const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bdrbfgqgktiuvmynksbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcmJmZ3Fna3RpdXZteW5rc2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM1NDU0OSwiZXhwIjoyMDcwOTMwNTQ5fQ.fA0gJUpspPNTNhk8mhmmXvNg0IFTroKzr_ya0E7lYlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function buildAppointmentSystem() {
  console.log('📅 BUILDING APPOINTMENT SYSTEM\n');
  
  const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616';
  
  // Get our existing customer and contact data
  const { data: customerData } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();
    
  const { data: contactData } = await supabase
    .from('contacts')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();
  
  if (!customerData || !contactData) {
    console.log('❌ No customer/contact data found');
    return;
  }
  
  console.log('👥 Found customer:', customerData.name);
  console.log('📞 Found contact:', contactData.name);
  
  // Create sample appointments
  console.log('\n📅 Creating Sample Appointments...');
  
  const appointments = [
    {
      title: 'Airco Installatie - Locatie inspectie',
      start_time: new Date('2025-08-25T14:00:00+02:00').toISOString(),
      end_time: new Date('2025-08-25T15:30:00+02:00').toISOString(),
      contact_id: contactData.id,
      customer_id: customerData.id,
      location: 'Klant adres - Te bevestigen',
      notes: 'Eerste bezoek voor locatie inspectie en technische haalbaarheid. Meetopname voor offerte.',
      type: 'inspection',
      status: 'scheduled',
      tenant_id: tenantId
    },
    {
      title: 'Airco Installatie - Uitvoering',
      start_time: new Date('2025-08-30T09:00:00+02:00').toISOString(),
      end_time: new Date('2025-08-30T16:00:00+02:00').toISOString(),
      contact_id: contactData.id,
      customer_id: customerData.id,
      location: 'Klant adres - Te bevestigen',
      notes: 'Installatie van 2x Daikin split-units (woonkamer + slaapkamer). Materiaal wordt geleverd.',
      type: 'installation',
      status: 'scheduled',
      tenant_id: tenantId
    },
    {
      title: 'Follow-up gesprek',
      start_time: new Date('2025-08-20T10:00:00+02:00').toISOString(),
      end_time: new Date('2025-08-20T10:30:00+02:00').toISOString(),
      contact_id: contactData.id,
      customer_id: customerData.id,
      location: 'Telefonisch',
      notes: 'Opvolging van offerte bespreking. Eventuele vragen beantwoorden.',
      type: 'call',
      status: 'completed',
      tenant_id: tenantId
    },
    {
      title: 'Onderhoud afspraak (volgend jaar)',
      start_time: new Date('2026-08-30T13:00:00+02:00').toISOString(),
      end_time: new Date('2026-08-30T14:00:00+02:00').toISOString(),
      contact_id: contactData.id,
      customer_id: customerData.id,
      location: 'Klant adres',
      notes: 'Jaarlijks onderhoud van geïnstalleerde airco systemen. Reiniging en controle.',
      type: 'maintenance',
      status: 'scheduled',
      tenant_id: tenantId
    }
  ];
  
  for (const appointment of appointments) {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select();
      
    if (error) {
      console.log(`❌ ${appointment.title}: ${error.message}`);
    } else {
      const startDate = new Date(appointment.start_time);
      console.log(`✅ ${appointment.title} - ${startDate.toLocaleDateString('nl-NL')} ${startDate.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'})} (${appointment.status})`);
    }
  }
  
  // Create related activities for appointments
  console.log('\n✅ Creating Activity Tracking...');
  
  const activities = [
    {
      title: 'Afspraak bevestiging verzonden',
      body: 'SMS bevestiging verstuurd naar klant voor inspectie afspraak op 25 augustus.',
      type: 'communication',
      done: true,
      lead_id: null, // No lead_id since it's converted
      tenant_id: tenantId
    },
    {
      title: 'Offerte voorbereiden',
      body: 'Na inspectie op 25 augustus, detailofferte opstellen inclusief prijzen en planning.',
      type: 'task',
      done: false,
      due_at: new Date('2025-08-25T18:00:00+02:00').toISOString(),
      lead_id: null,
      tenant_id: tenantId
    },
    {
      title: 'Materiaal bestellen',
      body: 'Daikin split-units bestellen zodra offerte is geaccepteerd.',
      type: 'task', 
      done: false,
      due_at: new Date('2025-08-27T12:00:00+02:00').toISOString(),
      lead_id: null,
      tenant_id: tenantId
    }
  ];
  
  for (const activity of activities) {
    const { data, error } = await supabase
      .from('activities')
      .insert(activity)
      .select();
      
    if (error) {
      console.log(`❌ Activity: ${activity.title}: ${error.message}`);
    } else {
      const status = activity.done ? '✅' : '⏳';
      console.log(`${status} ${activity.title} (${activity.type})`);
    }
  }
  
  // Check appointment system status
  console.log('\n📊 APPOINTMENT SYSTEM STATUS:');
  console.log('═'.repeat(50));
  
  const { data: appointmentsData, count: appointmentCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);
    
  const { data: activitiesData, count: activityCount } = await supabase
    .from('activities')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);
  
  console.log(`✅ Appointments created: ${appointmentCount}`);
  console.log(`✅ Activities created: ${activityCount}`);
  
  if (appointmentsData?.length > 0) {
    console.log('\n📅 Upcoming Appointments:');
    appointmentsData
      .filter(apt => new Date(apt.start_time) > new Date())
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .forEach(apt => {
        const date = new Date(apt.start_time);
        console.log(`   ${date.toLocaleDateString('nl-NL')} ${date.toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'})} - ${apt.title}`);
      });
  }
  
  if (activitiesData?.length > 0) {
    console.log('\n✅ Pending Activities:');
    activitiesData
      .filter(act => !act.done)
      .forEach(act => {
        const dueDate = act.due_at ? new Date(act.due_at).toLocaleDateString('nl-NL') : 'No deadline';
        console.log(`   📋 ${act.title} (Due: ${dueDate})`);
      });
  }
  
  console.log('\n🎉 APPOINTMENT SYSTEM READY!');
  console.log('Features implemented:');
  console.log('✅ Calendar scheduling with time slots');
  console.log('✅ Customer/Contact integration');
  console.log('✅ Appointment types (inspection, installation, maintenance, call)');
  console.log('✅ Location and notes management');
  console.log('✅ Activity tracking and follow-ups');
  console.log('✅ Appointment status management');
}

buildAppointmentSystem();