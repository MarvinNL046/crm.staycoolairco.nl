'use client'

import { useState } from 'react'
import { Mail, TestTube, Check, AlertCircle } from 'lucide-react'

interface EmailSettingsProps {
  tenantId: string
  tenantName: string
}

export default function EmailSettings({ tenantId, tenantName }: EmailSettingsProps) {
  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const testEmailFunction = async () => {
    if (!testEmail) return
    
    setTesting(true)
    setTestResult(null)

    // Create a fake lead ID for testing
    const testLeadData = {
      leadId: 'test-lead-id',
      tenantId,
      type: 'welcome',
      testMode: true,
      testEmail,
    }

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testLeadData)
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
        <h3 className="text-lg font-medium text-gray-900">Email Automatisering</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configureer automatische emails voor leads via Resend
        </p>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Email Service Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Service
          </label>
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">Resend Geconfigureerd</p>
              <p className="text-sm text-green-700">
                Automatische emails zijn actief via Resend API
              </p>
            </div>
          </div>
        </div>

        {/* Current Email Settings */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Actieve Email Automations</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-gray-900">Welkom Email</p>
                <p className="text-sm text-gray-500">Verstuurd bij nieuwe leads via webhook</p>
              </div>
              <span className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Actief
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-gray-900">Status Updates</p>
                <p className="text-sm text-gray-500">Verstuurd bij status wijzigingen</p>
              </div>
              <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                Binnenkort
              </span>
            </div>
          </div>
        </div>

        {/* Test Email Function */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Email Functie
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="jouw@email.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={testEmailFunction}
              disabled={testing || !testEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              {testing ? 'Bezig...' : 'Test'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Verstuurt een test welkom email naar het opgegeven adres
          </p>
          
          {testResult && (
            <div className={`mt-3 p-3 rounded-md ${
              testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-medium ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.success ? '✅ Email verzonden!' : '❌ Email fout'}
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
          <h4 className="font-medium text-gray-900 mb-3">Resend Setup</h4>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <h5 className="font-medium text-gray-800">1. Resend Account</h5>
              <p>Maak een gratis account aan op <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">resend.com</a></p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-800">2. API Key</h5>
              <p>Genereer een API key in je Resend dashboard</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-800">3. Environment Variable</h5>
              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs">
RESEND_API_KEY=re_xxxxxxxxxx
              </pre>
            </div>

            <div>
              <h5 className="font-medium text-gray-800">4. Domain Verificatie (Optioneel)</h5>
              <p>Voor productie: verifieer je domein in Resend voor betere deliverability</p>
            </div>
          </div>
        </div>

        {/* Email Templates Info */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-3">Email Templates</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Welkom Email</span>
              <span className="text-gray-500">- Automatisch verstuurd bij nieuwe leads</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Status Updates</span>
              <span className="text-gray-500">- Bij status wijzigingen in pipeline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}