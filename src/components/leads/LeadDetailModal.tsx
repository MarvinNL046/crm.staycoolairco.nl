'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, Calendar, Phone, Mail, Building2, Tag, FileText, Save, Send, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Lead = Database['public']['Tables']['leads']['Row']
type LeadStatus = Database['public']['Enums']['lead_status']

interface LeadDetailModalProps {
  lead: Lead
  onClose: () => void
  onUpdate: () => void
  onDelete: () => void
}

const statusOptions: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'Nieuw', color: 'bg-gray-100 text-gray-800' },
  { value: 'contacted', label: 'Gecontacteerd', color: 'bg-blue-100 text-blue-800' },
  { value: 'qualified', label: 'Gekwalificeerd', color: 'bg-purple-100 text-purple-800' },
  { value: 'proposal', label: 'Offerte', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'won', label: 'Gewonnen', color: 'bg-green-100 text-green-800' },
  { value: 'lost', label: 'Verloren', color: 'bg-red-100 text-red-800' },
]

export default function LeadDetailModal({ lead, onClose, onUpdate, onDelete }: LeadDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: lead.name,
    email: lead.email || '',
    phone: lead.phone || '',
    company: lead.company || '',
    status: lead.status,
    source: lead.source || '',
    notes: lead.notes || '',
  })
  const [tags, setTags] = useState(lead.tags?.join(', ') || '')
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)
  const [sendingSMS, setSendingSMS] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [messagingSuccess, setMessagingSuccess] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleSave = async () => {
    setError(null)
    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          company: formData.company || null,
          status: formData.status,
          source: formData.source || null,
          notes: formData.notes || null,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)

      if (updateError) throw updateError

      setIsEditing(false)
      onUpdate()
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het opslaan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)

    try {
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id)

      if (deleteError) throw deleteError

      onDelete()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het verwijderen')
      setSaving(false)
    }
  }

  const sendWelcomeEmail = async () => {
    if (!lead.email) {
      setError('Deze lead heeft geen email adres')
      return
    }

    setSendingEmail(true)
    setError(null)
    setEmailSuccess(null)

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
          tenantId: lead.tenant_id,
          type: 'welcome',
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setEmailSuccess('Welkom email succesvol verzonden!')
        setTimeout(() => setEmailSuccess(null), 5000)
      } else {
        throw new Error(result.error || 'Failed to send email')
      }
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het verzenden van de email')
    } finally {
      setSendingEmail(false)
    }
  }

  const sendMessage = async (channel: 'sms' | 'whatsapp') => {
    if (!lead.phone) {
      setError('Deze lead heeft geen telefoonnummer')
      return
    }

    const setSending = channel === 'sms' ? setSendingSMS : setSendingWhatsApp
    setSending(true)
    setError(null)
    setMessagingSuccess(null)

    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
          tenantId: lead.tenant_id,
          type: 'welcome',
          channel,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const channelName = channel === 'sms' ? 'SMS' : 'WhatsApp'
        setMessagingSuccess(`${channelName} bericht succesvol verzonden!`)
        setTimeout(() => setMessagingSuccess(null), 5000)
      } else {
        throw new Error(result.error || `Failed to send ${channel} message`)
      }
    } catch (err: any) {
      setError(err.message || `Er is een fout opgetreden bij het verzenden van het ${channel} bericht`)
    } finally {
      setSending(false)
    }
  }

  const sendSMS = () => sendMessage('sms')
  const sendWhatsApp = () => sendMessage('whatsapp')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const currentStatus = statusOptions.find(s => s.value === (isEditing ? formData.status : lead.status))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Lead Bewerken' : 'Lead Details'}
            </h2>
            {currentStatus && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                {lead.email && (
                  <button
                    onClick={sendWelcomeEmail}
                    disabled={sendingEmail}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {sendingEmail ? 'Bezig...' : 'Email'}
                  </button>
                )}
                {lead.phone && (
                  <>
                    <button
                      onClick={sendSMS}
                      disabled={sendingSMS}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Phone className="h-4 w-4" />
                      {sendingSMS ? 'Bezig...' : 'SMS'}
                    </button>
                    <button
                      onClick={sendWhatsApp}
                      disabled={sendingWhatsApp}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {sendingWhatsApp ? 'Bezig...' : 'WhatsApp'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Bewerken
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Bezig...' : 'Opslaan'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: lead.name,
                      email: lead.email || '',
                      phone: lead.phone || '',
                      company: lead.company || '',
                      status: lead.status,
                      source: lead.source || '',
                      notes: lead.notes || '',
                    })
                    setTags(lead.tags?.join(', ') || '')
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuleren
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {emailSuccess && (
            <div className="rounded-md bg-green-50 p-3">
              <p className="text-sm text-green-800">{emailSuccess}</p>
            </div>
          )}

          {messagingSuccess && (
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-sm text-blue-800">{messagingSuccess}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Naam
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{lead.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              {isEditing ? (
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${currentStatus?.color}`}>
                  {currentStatus?.label}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Mail className="h-4 w-4" />
                E-mail
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{lead.email || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Telefoon
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{lead.phone || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                Bedrijf
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{lead.company || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bron
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{lead.source || '-'}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Tag className="h-4 w-4" />
              Tags
            </label>
            {isEditing ? (
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Gescheiden door komma's"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="flex flex-wrap gap-1">
                {lead.tags && lead.tags.length > 0 ? (
                  lead.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">Geen tags</p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Notities
            </label>
            {isEditing ? (
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">{lead.notes || '-'}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="border-t pt-4 text-sm text-gray-500 space-y-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Aangemaakt: {formatDate(lead.created_at)}
            </div>
            {lead.updated_at && lead.updated_at !== lead.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Laatst bijgewerkt: {formatDate(lead.updated_at)}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Lead Verwijderen
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Weet je zeker dat je deze lead wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Bezig...' : 'Verwijderen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}