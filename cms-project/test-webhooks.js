/**
 * Webhook Testing Script
 * Tests the production-ready webhook system
 */

const crypto = require('crypto');

class WebhookTester {
  constructor(baseUrl = 'https://crm.staycoolairco.nl') {
    this.baseUrl = baseUrl;
  }

  // Generate HMAC signature for webhook
  generateSignature(payload, secret) {
    const cleanSecret = secret.replace('whsec_', '');
    const signature = crypto
      .createHmac('sha256', cleanSecret)
      .update(payload)
      .digest('hex');
    return `sha256=${signature}`;
  }

  // Test webhook info endpoint
  async testWebhookInfo(tenantId) {
    console.log('\n🔍 Testing Webhook Info Endpoint...');
    
    const url = `${this.baseUrl}/api/webhook/leads?tenant=${tenantId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('✅ Webhook info endpoint working!');
        return data;
      } else {
        console.log('❌ Webhook info endpoint failed');
        return null;
      }
    } catch (error) {
      console.log('❌ Error testing webhook info:', error.message);
      return null;
    }
  }

  // Test webhook without signature (should warn but might accept)
  async testWebhookWithoutSignature(tenantId) {
    console.log('\n🔓 Testing Webhook WITHOUT Signature...');
    
    const url = `${this.baseUrl}/api/webhook/leads?tenant=${tenantId}`;
    const payload = {
      name: 'Test Lead Zonder Signature',
      email: 'test-no-sig@example.com',
      phone: '+31 6 1234 5678',
      company: 'Test Company',
      message: 'This is a test lead without signature',
      source: 'webhook_test'
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (response.status === 201) {
        console.log('✅ Lead created successfully (no signature required in current config)');
      } else if (response.status === 401) {
        console.log('🔒 Signature required (good security!)');
      } else {
        console.log(`⚠️  Unexpected response: ${response.status}`);
      }
      
      return { status: response.status, data };
    } catch (error) {
      console.log('❌ Error testing webhook without signature:', error.message);
      return null;
    }
  }

  // Test webhook with signature
  async testWebhookWithSignature(tenantId, webhookSecret) {
    console.log('\n🔐 Testing Webhook WITH Signature...');
    
    const url = `${this.baseUrl}/api/webhook/leads?tenant=${tenantId}`;
    const payload = {
      name: 'Test Lead Met Signature',
      email: 'test-with-sig@example.com',
      phone: '+31 6 9876 5432',
      company: 'Secure Test Company',
      message: 'This is a test lead with HMAC signature',
      source: 'webhook_test_secure',
      metadata: {
        test_id: 'webhook-security-test',
        timestamp: new Date().toISOString()
      }
    };

    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString, webhookSecret);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature
        },
        body: payloadString
      });

      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log(`Signature used: ${signature.substring(0, 20)}...`);
      
      if (response.status === 201) {
        console.log('✅ Lead created successfully with signature validation!');
      } else if (response.status === 401) {
        console.log('❌ Signature validation failed');
      } else {
        console.log(`⚠️  Unexpected response: ${response.status}`);
      }
      
      return { status: response.status, data };
    } catch (error) {
      console.log('❌ Error testing webhook with signature:', error.message);
      return null;
    }
  }

  // Test rate limiting
  async testRateLimit(tenantId, webhookSecret, requestCount = 5) {
    console.log(`\n⚡ Testing Rate Limiting (${requestCount} requests)...`);
    
    const url = `${this.baseUrl}/api/webhook/leads?tenant=${tenantId}`;
    const results = [];

    for (let i = 1; i <= requestCount; i++) {
      const payload = {
        name: `Rate Limit Test ${i}`,
        email: `ratetest${i}@example.com`,
        company: `Test Company ${i}`,
        message: `Rate limit test request ${i} of ${requestCount}`,
        source: 'rate_limit_test'
      };

      const payloadString = JSON.stringify(payload);
      const signature = webhookSecret ? this.generateSignature(payloadString, webhookSecret) : null;

      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (signature) {
        headers['X-Webhook-Signature'] = signature;
      }

      try {
        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: payloadString
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const data = await response.json();

        results.push({
          request: i,
          status: response.status,
          responseTime: `${responseTime}ms`,
          rateLimitHeaders: {
            limit: response.headers.get('X-RateLimit-Limit'),
            remaining: response.headers.get('X-RateLimit-Remaining'),
            reset: response.headers.get('X-RateLimit-Reset')
          }
        });

        console.log(`Request ${i}: ${response.status} (${responseTime}ms) - Remaining: ${response.headers.get('X-RateLimit-Remaining')}`);

        if (response.status === 429) {
          console.log('🚫 Rate limit hit!');
          break;
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`Request ${i} error:`, error.message);
      }
    }

    console.log('\n📊 Rate Limit Test Results:');
    results.forEach(result => {
      console.log(`  Request ${result.request}: ${result.status} - ${result.responseTime} - Remaining: ${result.rateLimitHeaders.remaining}`);
    });

    return results;
  }

  // Test invalid data
  async testInvalidData(tenantId) {
    console.log('\n❌ Testing Invalid Data Validation...');
    
    const url = `${this.baseUrl}/api/webhook/leads?tenant=${tenantId}`;
    
    const testCases = [
      {
        name: 'Missing email',
        payload: { name: 'Test User' }
      },
      {
        name: 'Invalid email',
        payload: { name: 'Test User', email: 'invalid-email' }
      },
      {
        name: 'Missing name',
        payload: { email: 'test@example.com' }
      },
      {
        name: 'Empty payload',
        payload: {}
      }
    ];

    for (const testCase of testCases) {
      console.log(`\nTesting: ${testCase.name}`);
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testCase.payload)
        });

        const data = await response.json();
        
        console.log(`Status: ${response.status}`);
        if (response.status === 400) {
          console.log('✅ Validation working - rejected invalid data');
        } else {
          console.log('⚠️  Unexpected response for invalid data');
        }
        
        if (data.details) {
          console.log('Validation errors:', data.details);
        }

      } catch (error) {
        console.log('Error:', error.message);
      }
    }
  }

  // Run all tests
  async runAllTests(tenantId, webhookSecret = null) {
    console.log('🧪 Starting Comprehensive Webhook Tests...');
    console.log(`Tenant ID: ${tenantId}`);
    console.log(`Webhook Secret: ${webhookSecret ? 'Provided' : 'Not provided'}`);
    console.log('=' .repeat(60));

    // 1. Test webhook info
    const info = await this.testWebhookInfo(tenantId);
    
    // 2. Test without signature
    await this.testWebhookWithoutSignature(tenantId);
    
    // 3. Test with signature (if provided)
    if (webhookSecret) {
      await this.testWebhookWithSignature(tenantId, webhookSecret);
    }
    
    // 4. Test rate limiting
    await this.testRateLimit(tenantId, webhookSecret, 3);
    
    // 5. Test invalid data
    await this.testInvalidData(tenantId);
    
    console.log('\n🎉 All webhook tests completed!');
    
    if (info && info.signatureGeneration) {
      console.log('\n📝 To generate valid signatures for your webhooks:');
      console.log(`Algorithm: ${info.signatureGeneration.algorithm}`);
      console.log(`Header: ${info.signatureGeneration.header}`);
      console.log(`Format: ${info.signatureGeneration.format}`);
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebhookTester;
}

// Run tests if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node test-webhooks.js <TENANT_ID> [WEBHOOK_SECRET]');
    console.log('Example: node test-webhooks.js abc-123-def whsec_1234567890abcdef');
    process.exit(1);
  }
  
  const tenantId = args[0];
  const webhookSecret = args[1];
  
  const tester = new WebhookTester();
  tester.runAllTests(tenantId, webhookSecret)
    .catch(error => {
      console.error('Test error:', error);
      process.exit(1);
    });
}