#!/usr/bin/env node

/**
 * Process Appointment Reminders
 * 
 * This script should be run as a cron job every 5-15 minutes to process
 * appointment reminders and send emails to recipients.
 * 
 * Setup cron job:
 * */5 * * * * /usr/bin/node /path/to/process-appointment-reminders.js >> /var/log/appointment-reminders.log 2>&1
 */

const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.APPOINTMENT_REMINDER_API_KEY;

async function processReminders() {
  console.log(`[${new Date().toISOString()}] Starting appointment reminder processing...`);
  
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if configured
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }
    
    const response = await fetch(`${API_URL}/api/appointments/reminders`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log(`[${new Date().toISOString()}] Reminder processing complete:`, {
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
    });
    
    // Log any failures for monitoring
    if (result.failed > 0) {
      console.error(`[${new Date().toISOString()}] Failed reminders:`, 
        result.results.filter(r => !r.success)
      );
    }
    
    return result;
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error processing reminders:`, error);
    
    // Send alert if configured (e.g., to monitoring service)
    if (process.env.ALERT_WEBHOOK) {
      try {
        await fetch(process.env.ALERT_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'appointment-reminders',
            error: error.message,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (alertError) {
        console.error('Failed to send alert:', alertError);
      }
    }
    
    process.exit(1);
  }
}

// Run the reminder processing
processReminders()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });