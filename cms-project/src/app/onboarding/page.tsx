'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { 
  Building2, 
  Globe, 
  Sparkles, 
  Check, 
  Loader2,
  AlertCircle 
} from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    companyName: '',
    subdomain: '',
    industry: 'hvac',
    plan: 'trial'
  })

  const handleNext = () => {
    if (step === 1 && !formData.companyName) {
      setError('Vul uw bedrijfsnaam in')
      return
    }
    if (step === 2 && !formData.subdomain) {
      setError('Kies een subdomain')
      return
    }
    setError('')
    setStep(step + 1)
  }

  const handleComplete = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Onboarding failed')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8">
        {/* Progress indicator */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex items-center ${i < 3 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium
                  ${step >= i ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                {step > i ? <Check className="w-5 h-5" /> : i}
              </div>
              {i < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > i ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Company Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Welkom bij StayCool CRM</h2>
              <p className="text-gray-600 mt-2">
                Laten we uw account instellen
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Bedrijfsnaam</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="Uw bedrijfsnaam"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="industry">Branche</Label>
                <select
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  className="w-full mt-1 rounded-md border border-gray-300 p-2"
                >
                  <option value="hvac">Airconditioning & Klimaat</option>
                  <option value="general">Algemeen</option>
                  <option value="construction">Bouw</option>
                  <option value="retail">Retail</option>
                  <option value="services">Dienstverlening</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Subdomain */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Kies uw subdomain</h2>
              <p className="text-gray-600 mt-2">
                Dit wordt uw unieke CRM URL
              </p>
            </div>

            <div>
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex items-center mt-1">
                <Input
                  id="subdomain"
                  value={formData.subdomain}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                    })
                  }
                  placeholder="uwbedrijf"
                  className="rounded-r-none"
                />
                <span className="bg-gray-100 border border-l-0 border-gray-300 px-3 py-2 rounded-r-md">
                  .staycoolcrm.nl
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Alleen kleine letters, cijfers en streepjes
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Alles klaar!</h2>
              <p className="text-gray-600 mt-2">
                We gaan uw CRM account aanmaken
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Bedrijf:</span>
                <span className="font-medium">{formData.companyName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">URL:</span>
                <span className="font-medium">
                  {formData.subdomain}.staycoolcrm.nl
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Plan:</span>
                <span className="font-medium">14 dagen gratis trial</span>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">
                Wat we voor u klaar zetten:
              </h3>
              <ul className="space-y-1 text-sm text-green-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>BTW tarieven (0%, 9%, 21%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Standaard tags voor uw branche</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Email templates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Pipeline stages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Automatisering regels</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              Vorige
            </Button>
          )}
          <div className="ml-auto">
            {step < 3 ? (
              <Button onClick={handleNext}>
                Volgende
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Account aanmaken...
                  </>
                ) : (
                  'Start met StayCool CRM'
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}