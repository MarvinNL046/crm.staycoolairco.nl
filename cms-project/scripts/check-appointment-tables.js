const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAppointmentTables() {
  console.log('🔍 Checking appointment tables in production...\n');
  console.log('='.repeat(80));
  
  try {
    // Check appointments table
    console.log('📋 Main appointments table:');
    const { count: appointmentCount, error: appointmentError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
    
    if (!appointmentError) {
      console.log(`✅ appointments table exists - ${appointmentCount || 0} records`);
      
      // Get a sample to see the structure
      const { data: sample } = await supabase
        .from('appointments')
        .select('id, title, reminder_minutes, reminder_sent, reminder_sent_at, reminder_emails')
        .limit(1);
      
      if (sample && sample.length > 0) {
        console.log('\n   Sample record (reminder fields):');
        console.log(`   - reminder_minutes: ${sample[0].reminder_minutes}`);
        console.log(`   - reminder_sent: ${sample[0].reminder_sent}`);
        console.log(`   - reminder_sent_at: ${sample[0].reminder_sent_at}`);
        console.log(`   - reminder_emails: ${sample[0].reminder_emails}`);
      }
    } else {
      console.log('❌ appointments table error:', appointmentError.message);
    }
    
    // Check appointment_reminders table
    console.log('\n📋 Appointment reminders table:');
    const { count: reminderCount, error: reminderError } = await supabase
      .from('appointment_reminders')
      .select('*', { count: 'exact', head: true });
    
    if (!reminderError) {
      console.log(`✅ appointment_reminders table exists - ${reminderCount || 0} records`);
    } else {
      console.log('❌ appointment_reminders table does not exist');
      console.log('   Error:', reminderError.message);
    }
    
    // Check recurring_appointments table
    console.log('\n📋 Recurring appointments table:');
    const { count: recurringCount, error: recurringError } = await supabase
      .from('recurring_appointments')
      .select('*', { count: 'exact', head: true });
    
    if (!recurringError) {
      console.log(`✅ recurring_appointments table exists - ${recurringCount || 0} records`);
    } else {
      console.log('❌ recurring_appointments table does not exist');
      console.log('   Error:', recurringError.message);
    }
    
    // Summary
    console.log('\n\n📊 SUMMARY:\n');
    console.log('-'.repeat(50));
    
    if (reminderError || recurringError) {
      console.log('⚠️  Some appointment tables are missing!');
      console.log('\nThe main appointments table has reminder fields built-in:');
      console.log('- reminder_minutes (when to send reminder)');
      console.log('- reminder_sent (boolean flag)');
      console.log('- reminder_sent_at (timestamp)');
      console.log('- reminder_emails (array of emails)');
      console.log('\nBut we\'re missing:');
      if (reminderError) console.log('- appointment_reminders table (for multiple reminders per appointment)');
      if (recurringError) console.log('- recurring_appointments table (for recurring appointments)');
      
      console.log('\n🎯 RECOMMENDATION:');
      console.log('You can either:');
      console.log('1. Use the built-in reminder fields in the appointments table (simpler)');
      console.log('2. Create the missing tables for more advanced functionality (recommended)');
    } else {
      console.log('✅ All appointment tables are properly set up!');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

checkAppointmentTables();