'use client'

import { useState } from 'react'
import { MessageSquare, Send, Phone, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface MessagingSettingsProps {
  tenantId: string
  tenantName: string
}

export default function MessagingSettings({ tenantId, tenantName }: MessagingSettingsProps) {
  const [testPhone, setTestPhone] = useState('')
  const [testChannel, setTestChannel] = useState<'sms' | 'whatsapp'>('sms')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const testMessaging = async () => {
    if (!testPhone) return
    
    setTesting(true)
    setTestResult(null)

    // Create a test message
    const testMessageData = {
      leadId: 'test-lead-id',
      tenantId,
      type: 'welcome',
      channel: testChannel,
      testMode: true,
      testPhone,
    }

    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessageData)
      })

      const result = await response.json()
      setTestResult({ success: response.ok, data: result, status: response.status })
    } catch (error) {
      setTestResult({ 
        success: false, 
        data: { error: 'Network error', message: (error as Error).message },
        status: 0
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">SMS & WhatsApp Messaging</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configureer automatische berichten via MessageBird
        </p>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Service Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Messaging Service
          </label>
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">MessageBird/Bird Geconfigureerd</p>
              <p className="text-sm text-blue-700">
                SMS en WhatsApp berichten via Bird API
              </p>
            </div>
          </div>
        </div>

        {/* Current Messaging Automations */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Actieve Messaging Automations</h4>
          <div className="space-y-2">
            {/* SMS Automation */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">SMS Berichten</p>
                  <p className="text-sm text-gray-500">Welkom en status updates via SMS</p>
                </div>
              </div>
              <span className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Beschikbaar
              </span>
            </div>
            
            {/* WhatsApp Automation */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">WhatsApp Berichten</p>
                  <p className="text-sm text-gray-500">Rijke berichten met emojis en formatting</p>
                </div>
              </div>
              <span className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Beschikbaar
              </span>
            </div>
          </div>
        </div>

        {/* Test Messaging Function */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Messaging Functie
          </label>
          
          {/* Channel Selection */}
          <div className="flex gap-4 mb-3">
            <label className="flex items-center">
              <input
                type="radio"
                value="sms"
                checked={testChannel === 'sms'}
                onChange={(e) => setTestChannel(e.target.value as 'sms')}
                className="mr-2"
              />
              <Phone className="h-4 w-4 mr-1" />
              SMS
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="whatsapp"
                checked={testChannel === 'whatsapp'}
                onChange={(e) => setTestChannel(e.target.value as 'whatsapp')}
                className="mr-2"
              />
              <MessageSquare className="h-4 w-4 mr-1" />
              WhatsApp
            </label>
          </div>

          {/* Phone Input */}
          <div className="flex gap-2">
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+31612345678 of 06-12345678"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={testMessaging}
              disabled={testing || !testPhone}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {testing ? 'Bezig...' : 'Test'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Verstuurt een test welkom bericht naar het opgegeven nummer
          </p>
          
          {testResult && (
            <div className={`mt-3 p-3 rounded-md ${
              testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-medium ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.success ? '✅ Bericht verzonden!' : '❌ Bericht fout'}
                </span>
                <span className="text-sm text-gray-600">
                  Status: {testResult.status}
                </span>
              </div>
              <pre className="text-xs text-gray-700 overflow-x-auto bg-white p-2 rounded border">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-3">MessageBird Setup</h4>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <h5 className="font-medium text-gray-800">1. MessageBird Account</h5>
              <p>Maak een account aan op <a href="https://bird.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">bird.com</a></p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-800">2. API Key & Workspace</h5>
              <p>Genereer een API key en verkrijg je workspace ID</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-800">3. Environment Variables</h5>
              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs">
{`MESSAGEBIRD_API_KEY=live_xxxxxxxxxx
MESSAGEBIRD_WORKSPACE_ID=your-workspace-id
MESSAGEBIRD_SMS_CHANNEL_ID=your-sms-channel-id
MESSAGEBIRD_WHATSAPP_CHANNEL_ID=your-whatsapp-channel-id`}
              </pre>
            </div>

            <div>
              <h5 className="font-medium text-gray-800">4. Channel Setup</h5>
              <p>Configureer SMS en WhatsApp channels in je Bird dashboard</p>
            </div>
          </div>
        </div>

        {/* Message Templates Info */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-3">Bericht Templates</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-600" />
              <span className="font-medium">SMS Welkom</span>
              <span className="text-gray-500">- Korte professionele welkom bericht</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-600" />
              <span className="font-medium">WhatsApp Welkom</span>
              <span className="text-gray-500">- Rijke formatting met emojis en styling</span>
            </div>
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Status Updates</span>
              <span className="text-gray-500">- Automatisch bij pipeline wijzigingen</span>
            </div>
          </div>
        </div>

        {/* Features & Pricing */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-3">Features & Pricing</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-800">SMS Features</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• 160 karakters per bericht</li>
                <li>• Instant delivery</li>
                <li>• Delivery receipts</li>
                <li>• Global coverage</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800">WhatsApp Features</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• Rich messaging (emojis, formatting)</li>
                <li>• Read receipts</li>
                <li>• Media support (afbeeldingen, files)</li>
                <li>• Template messages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}