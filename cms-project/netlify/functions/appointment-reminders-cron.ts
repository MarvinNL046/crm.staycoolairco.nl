// Netlify Scheduled Function voor Appointment Reminders
// Dit draait elke 15 minuten om afspraak herinneringen te versturen

import { schedule } from '@netlify/functions';

// Environment variabelen
const API_URL = process.env.URL || 'http://localhost:3000';
const CRON_SECRET = process.env.WORKFLOW_SECRET_KEY || 'your-secret-key';

// Scheduled function die elke 15 minuten draait
export const handler = schedule('*/15 * * * *', async (event) => {
  console.log('[Appointment Reminders] Starting reminder check...');
  
  try {
    // Call de appointment reminders API
    const response = await fetch(`${API_URL}/api/appointments/reminders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[Appointment Reminders] API call failed:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to process appointment reminders' })
      };
    }
    
    const result = await response.json();
    console.log('[Appointment Reminders] Processing complete:', result);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Appointment reminders processed',
        processed: result.processed,
        sent: result.sent,
        failed: result.failed,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error: any) {
    console.error('[Appointment Reminders] Error:', error);
    
    // Optioneel: stuur notificatie bij fout
    if (process.env.WEBHOOK_ALERT_URL) {
      try {
        await fetch(process.env.WEBHOOK_ALERT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'appointment-reminders',
            error: error.message,
            timestamp: new Date().toISOString()
          })
        });
      } catch (alertError) {
        console.error('[Appointment Reminders] Alert failed:', alertError);
      }
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Appointment reminder processing failed',
        details: error.message
      })
    };
  }
});