'use client'

import { useState } from 'react'
import { Copy, Check, Eye, EyeOff, TestTube } from 'lucide-react'

interface WebhookSettingsProps {
  tenantId: string
  tenantName: string
}

export default function WebhookSettings({ tenantId, tenantName }: WebhookSettingsProps) {
  const [webhookKey, setWebhookKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const webhookUrl = `${window.location.origin}/api/webhook?tenant_id=${tenantId}`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const testWebhook = async () => {
    setTesting(true)
    setTestResult(null)

    const testData = {
      name: 'Test Lead',
      email: 'test@example.com',
      phone: '+31612345678',
      company: 'Test Bedrijf',
      message: 'Dit is een test lead vanuit de webhook configuratie',
      source: 'webhook-test',
      tags: ['test', 'webhook']
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookKey && { 'x-webhook-key': webhookKey })
        },
        body: JSON.stringify(testData)
      })

      const result = await response.json()
      setTestResult({ success: response.ok, data: result, status: response.status })
    } catch (error) {
      setTestResult({ 
        success: false, 
        data: { error: 'Network error', message: error.message },
        status: 0
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Webhook Integratie</h3>
        <p className="mt-1 text-sm text-gray-500">
          Koppel externe formulieren aan je CRM via webhooks
        </p>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Webhook URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={webhookUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
            />
            <button
              onClick={() => copyToClipboard(webhookUrl)}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Gekopieerd!' : 'Kopiëren'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Gebruik deze URL in je externe formulieren om automatisch leads aan te maken
          </p>
        </div>

        {/* Webhook Key (optioneel) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook Key (optioneel)
          </label>
          <div className="flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={webhookKey}
              onChange={(e) => setWebhookKey(e.target.value)}
              placeholder="Optionele beveiligingssleutel"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Voeg extra beveiliging toe door een webhook key in te stellen
          </p>
        </div>

        {/* Test Webhook */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Webhook
          </label>
          <button
            onClick={testWebhook}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TestTube className="h-4 w-4" />
            {testing ? 'Bezig met testen...' : 'Test Webhook'}
          </button>
          
          {testResult && (
            <div className={`mt-3 p-3 rounded-md ${
              testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-medium ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.success ? '✅ Webhook werkt!' : '❌ Webhook fout'}
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

        {/* Documentatie */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-3">Implementatie Guide</h4>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h5 className="font-medium text-gray-800">1. HTML Formulier</h5>
              <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
{`<form id="contact-form">
  <input name="name" placeholder="Naam" required>
  <input name="email" type="email" placeholder="Email">
  <input name="phone" placeholder="Telefoon">
  <input name="company" placeholder="Bedrijf">
  <textarea name="message" placeholder="Bericht"></textarea>
  <button type="submit">Versturen</button>
</form>`}
              </pre>
            </div>

            <div>
              <h5 className="font-medium text-gray-800">2. JavaScript Integratie</h5>
              <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
{`document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const response = await fetch('${webhookUrl}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'${webhookKey ? `,
      'x-webhook-key': '${webhookKey}'` : ''}
    },
    body: JSON.stringify(Object.fromEntries(formData))
  });
  
  if (response.ok) {
    alert('Bedankt voor je bericht!');
    e.target.reset();
  }
});`}
              </pre>
            </div>

            <div>
              <h5 className="font-medium text-gray-800">3. Ondersteunde Velden</h5>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li><strong>Verplicht:</strong> name (of first_name + last_name)</li>
                <li><strong>Optioneel:</strong> email, phone, company, message, tags, source</li>
                <li><strong>UTM tracking:</strong> utm_source, utm_medium, utm_campaign</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}