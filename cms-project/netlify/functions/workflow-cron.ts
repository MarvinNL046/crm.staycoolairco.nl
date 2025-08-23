// Netlify Scheduled Function voor Workflow Processing
// Dit draait elke 5 minuten om de workflow queue te verwerken

import { schedule } from '@netlify/functions';

// Environment variabelen
const WORKFLOW_API_URL = process.env.URL || 'http://localhost:3000';
const WORKFLOW_SECRET_KEY = process.env.WORKFLOW_SECRET_KEY || 'your-secret-key';

// Scheduled function die elke 5 minuten draait
export const handler = schedule('*/5 * * * *', async (event) => {
  console.log('[Workflow Cron] Starting workflow processing...');
  
  try {
    // Call de workflow execute API
    const response = await fetch(`${WORKFLOW_API_URL}/api/workflows/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WORKFLOW_SECRET_KEY}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[Workflow Cron] API call failed:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to process workflows' })
      };
    }
    
    const result = await response.json();
    console.log('[Workflow Cron] Processing complete:', result);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Workflow processing complete',
        processed: result.processed,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error: any) {
    console.error('[Workflow Cron] Error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Workflow processing failed',
        details: error.message
      })
    };
  }
});

// Voor Vercel gebruik je api/cron/workflow.ts:
/*
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Call workflow execute API
  // ... same logic as above
}
*/