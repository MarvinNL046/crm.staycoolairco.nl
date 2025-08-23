import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(process.env.RESEND_API_KEY);

// GET /api/appointments/reminders - Process and send appointment reminders
export async function GET(request: NextRequest) {
  try {
    // Check for authorization (only allow from cron job or admin)
    const authHeader = request.headers.get('authorization');
    const isAuthorized = authHeader && (
      authHeader.includes(process.env.WORKFLOW_SECRET_KEY!) ||
      authHeader.includes('admin') // Voor manual testing
    );
    
    if (!isAuthorized && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get current time
    const now = new Date();
    
    // Fetch appointments that need reminders
    const { data: appointments, error } = await supabase
      .from('appointments_pending_reminders')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    const remindersToSend = [];
    
    // Check each appointment for reminders
    for (const appointment of appointments || []) {
      const startTime = new Date(appointment.start_time);
      const minutesUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
      
      // Check if any reminder time matches
      for (const reminderMinutes of appointment.reminder_minutes || []) {
        if (minutesUntilStart <= reminderMinutes && minutesUntilStart > reminderMinutes - 15) {
          // 15-minute window for sending reminders
          remindersToSend.push({
            appointment,
            reminderMinutes,
            minutesUntilStart
          });
        }
      }
    }

    // Send reminders
    const results = [];
    for (const reminder of remindersToSend) {
      const { appointment, reminderMinutes } = reminder;
      
      try {
        // Prepare email content
        const recipients = appointment.reminder_emails || [];
        if (appointment.recipient_email) {
          recipients.push(appointment.recipient_email);
        }
        
        // Skip if no recipients
        if (recipients.length === 0) continue;
        
        // Format time
        const startTime = new Date(appointment.start_time);
        const timeStr = startTime.toLocaleTimeString('nl-NL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const dateStr = startTime.toLocaleDateString('nl-NL', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // Calculate time until appointment
        let timeUntil = '';
        if (reminderMinutes >= 60) {
          const hours = Math.floor(reminderMinutes / 60);
          timeUntil = hours === 1 ? '1 uur' : `${hours} uur`;
        } else {
          timeUntil = `${reminderMinutes} minuten`;
        }
        
        // Send email
        const emailResult = await resend.emails.send({
          from: 'StayCool Airconditioning <noreply@staycoolairco.nl>',
          to: recipients,
          subject: `Herinnering: ${appointment.title} - ${timeUntil} van tevoren`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">Afspraak Herinnering</h2>
              
              <p>Beste ${appointment.recipient_name || 'klant'},</p>
              
              <p>Dit is een herinnering voor uw aanstaande afspraak:</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">${appointment.title}</h3>
                <p style="margin: 5px 0;"><strong>Datum:</strong> ${dateStr}</p>
                <p style="margin: 5px 0;"><strong>Tijd:</strong> ${timeStr}</p>
                ${appointment.location ? `<p style="margin: 5px 0;"><strong>Locatie:</strong> ${appointment.location}</p>` : ''}
                ${appointment.description ? `<p style="margin: 5px 0;"><strong>Details:</strong> ${appointment.description}</p>` : ''}
              </div>
              
              <p>Deze afspraak begint over <strong>${timeUntil}</strong>.</p>
              
              <p>Kunt u niet aanwezig zijn? Neem dan zo snel mogelijk contact met ons op.</p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #6b7280; font-size: 14px;">
                Met vriendelijke groet,<br>
                StayCool Airconditioning<br>
                Tel: +31 20 123 4567<br>
                Email: info@staycoolairco.nl<br>
                Web: www.staycoolairco.nl
              </p>
            </div>
          `,
          text: `
Afspraak Herinnering

Beste ${appointment.recipient_name || 'klant'},

Dit is een herinnering voor uw aanstaande afspraak:

${appointment.title}
Datum: ${dateStr}
Tijd: ${timeStr}
${appointment.location ? `Locatie: ${appointment.location}` : ''}
${appointment.description ? `Details: ${appointment.description}` : ''}

Deze afspraak begint over ${timeUntil}.

Kunt u niet aanwezig zijn? Neem dan zo snel mogelijk contact met ons op.

Met vriendelijke groet,
StayCool Airconditioning
Tel: +31 20 123 4567
Email: info@staycoolairco.nl
Web: www.staycoolairco.nl
          `.trim()
        });
        
        // Update appointment to mark reminder as sent
        await supabase
          .from('appointments')
          .update({
            reminder_sent: true,
            reminder_sent_at: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', appointment.id);
        
        results.push({
          appointmentId: appointment.id,
          success: true,
          recipients
        });
        
      } catch (emailError) {
        console.error(`Failed to send reminder for appointment ${appointment.id}:`, emailError);
        results.push({
          appointmentId: appointment.id,
          success: false,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      processed: remindersToSend.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
    
  } catch (error) {
    console.error('Reminder processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process reminders', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/appointments/reminders/test - Test reminder for specific appointment
export async function POST(request: NextRequest) {
  // SECURITY: Check authorization for test reminders
  const authHeader = request.headers.get('authorization');
  const isAuthorized = authHeader && (
    authHeader.includes(process.env.WORKFLOW_SECRET_KEY!) ||
    authHeader.includes('admin') // Voor manual testing
  );
  
  if (!isAuthorized && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { appointmentId, email, tenantId } = body;
    
    // SECURITY: Fetch appointment with tenant validation if provided
    let query = supabase
      .from('appointments')
      .select(`
        *,
        customers!appointments_customer_id_fkey(name, email),
        contacts!appointments_contact_id_fkey(name, email),
        leads!appointments_lead_id_fkey(name, email)
      `)
      .eq('id', appointmentId);

    // Add tenant filter if provided (for admin testing with tenant context)
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: appointment, error } = await query.single();
    
    if (error || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    
    // Determine recipient
    const recipientEmail = email || 
      appointment.customers?.email || 
      appointment.contacts?.email || 
      appointment.leads?.email;
      
    const recipientName = appointment.customers?.name || 
      appointment.contacts?.name || 
      appointment.leads?.name ||
      'klant';
    
    if (!recipientEmail) {
      return NextResponse.json({ error: 'No recipient email found' }, { status: 400 });
    }
    
    // Format appointment details
    const startTime = new Date(appointment.start_time);
    const timeStr = startTime.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const dateStr = startTime.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Send test reminder
    await resend.emails.send({
      from: 'StayCool Airconditioning <noreply@staycoolairco.nl>',
      to: [recipientEmail],
      subject: `[TEST] Herinnering: ${appointment.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #fef3c7; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e;"><strong>Dit is een TEST herinnering</strong></p>
          </div>
          
          <h2 style="color: #1e40af;">Afspraak Herinnering</h2>
          
          <p>Beste ${recipientName},</p>
          
          <p>Dit is een herinnering voor uw aanstaande afspraak:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">${appointment.title}</h3>
            <p style="margin: 5px 0;"><strong>Datum:</strong> ${dateStr}</p>
            <p style="margin: 5px 0;"><strong>Tijd:</strong> ${timeStr}</p>
            ${appointment.location ? `<p style="margin: 5px 0;"><strong>Locatie:</strong> ${appointment.location}</p>` : ''}
            ${appointment.description ? `<p style="margin: 5px 0;"><strong>Details:</strong> ${appointment.description}</p>` : ''}
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">
            Met vriendelijke groet,<br>
            StayCool Airconditioning<br>
            Tel: +31 20 123 4567<br>
            Email: info@staycoolairco.nl<br>
            Web: www.staycoolairco.nl
          </p>
        </div>
      `
    });
    
    return NextResponse.json({
      success: true,
      message: `Test reminder sent to ${recipientEmail}`
    });
    
  } catch (error) {
    console.error('Test reminder error:', error);
    return NextResponse.json({ 
      error: 'Failed to send test reminder', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}