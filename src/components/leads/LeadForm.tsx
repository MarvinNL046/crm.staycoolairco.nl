'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { useTheme } from '@/lib/theme/ThemeProvider'

type Lead = Database['public']['Tables']['leads']['Insert']

interface LeadFormProps {
  tenantId: string
  onClose: () => void
  onSuccess: () => void
}

export default function LeadForm({ tenantId, onClose, onSuccess }: LeadFormProps) {
  const { colors } = useTheme()
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'manual',
    notes: '',
    value: 0,
  })
  const [tags, setTags] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const leadData: Lead = {
        name: formData.name || '',
        email: formData.email || null,
        phone: formData.phone || null,
        company: formData.company || null,
        source: formData.source || 'manual',
        notes: formData.notes || null,
        value: formData.value || 0,
        tenant_id: tenantId,
        created_by: user?.id || null,
        status: 'new',
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      }

      const { error: insertError } = await supabase
        .from('leads')
        .insert(leadData)

      if (insertError) throw insertError

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.background.elevated }}>
        <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: colors.background.elevated, borderBottom: `1px solid ${colors.border.primary}` }}>
          <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Nieuwe Lead</h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: colors.text.tertiary }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.text.tertiary}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
              Naam *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-1 transition-colors"
              style={{
                backgroundColor: colors.background.input,
                border: `1px solid ${colors.border.input}`,
                color: colors.text.primary,
                ['--tw-ring-color' as any]: colors.border.focus
              }}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
              E-mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-1 transition-colors"
              style={{
                backgroundColor: colors.background.input,
                border: `1px solid ${colors.border.input}`,
                color: colors.text.primary,
                ['--tw-ring-color' as any]: colors.border.focus
              }}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
              Telefoon
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="+31 6 12345678"
              className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-1 transition-colors"
              style={{
                backgroundColor: colors.background.input,
                border: `1px solid ${colors.border.input}`,
                color: colors.text.primary,
                ['--tw-ring-color' as any]: colors.border.focus,
                ['::placeholder' as any]: { color: colors.text.placeholder }
              }}
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
              Bedrijf
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company || ''}
              onChange={handleChange}
              className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-1 transition-colors"
              style={{
                backgroundColor: colors.background.input,
                border: `1px solid ${colors.border.input}`,
                color: colors.text.primary,
                ['--tw-ring-color' as any]: colors.border.focus
              }}
            />
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
              Bron
            </label>
            <select
              id="source"
              name="source"
              value={formData.source || 'manual'}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
              className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-1 transition-colors"
              style={{
                backgroundColor: colors.background.input,
                border: `1px solid ${colors.border.input}`,
                color: colors.text.primary,
                ['--tw-ring-color' as any]: colors.border.focus
              }}
            >
              <option value="manual">Handmatig</option>
              <option value="website">Website</option>
              <option value="webform">Webformulier</option>
              <option value="import">Import</option>
              <option value="referral">Referral</option>
              <option value="social">Social Media</option>
              <option value="adwords">Google Ads</option>
            </select>
          </div>

          <div>
            <label htmlFor="value" className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
              Geschatte waarde
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.tertiary }}>€</span>
              <input
                type="number"
                id="value"
                name="value"
                step="0.01"
                min="0"
                value={formData.value || ''}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-1 transition-colors"
                style={{
                  backgroundColor: colors.background.input,
                  border: `1px solid ${colors.border.input}`,
                  color: colors.text.primary,
                  ['--tw-ring-color' as any]: colors.border.focus,
                  ['::placeholder' as any]: { color: colors.text.placeholder }
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
              Tags (gescheiden door komma's)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="airco, installatie, amsterdam"
              className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-1 transition-colors"
              style={{
                backgroundColor: colors.background.input,
                border: `1px solid ${colors.border.input}`,
                color: colors.text.primary,
                ['--tw-ring-color' as any]: colors.border.focus,
                ['::placeholder' as any]: { color: colors.text.placeholder }
              }}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
              Notities
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes || ''}
              onChange={handleChange}
              className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-1 transition-colors"
              style={{
                backgroundColor: colors.background.input,
                border: `1px solid ${colors.border.input}`,
                color: colors.text.primary,
                ['--tw-ring-color' as any]: colors.border.focus
              }}
            />
          </div>

          {error && (
            <div className="rounded-md p-3" style={{ backgroundColor: colors.status.error + '20' }}>
              <p className="text-sm" style={{ color: colors.status.error }}>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              style={{ 
                border: `1px solid ${colors.border.primary}`,
                color: colors.text.primary,
                backgroundColor: colors.background.elevated,
                ['--tw-ring-color' as any]: colors.border.focus
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.interactive.secondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.background.elevated}
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ 
                backgroundColor: colors.interactive.primary,
                ['--tw-ring-color' as any]: colors.border.focus
              }}
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = colors.interactive.primaryHover)}
              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = colors.interactive.primary)}
            >
              {loading ? 'Bezig...' : 'Lead Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}