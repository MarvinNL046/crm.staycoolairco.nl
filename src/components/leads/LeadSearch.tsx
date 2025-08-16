'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Lead = Database['public']['Tables']['leads']['Row']
type LeadStatus = Database['public']['Enums']['lead_status']

interface LeadSearchProps {
  tenantId: string
  onLeadSelect: (lead: Lead) => void
  onNewLead: () => void
}

const statusOptions: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Alle statussen' },
  { value: 'new', label: 'Nieuw' },
  { value: 'contacted', label: 'Gecontacteerd' },
  { value: 'qualified', label: 'Gekwalificeerd' },
  { value: 'proposal', label: 'Offerte' },
  { value: 'won', label: 'Gewonnen' },
  { value: 'lost', label: 'Verloren' },
]

export default function LeadSearch({ tenantId, onLeadSelect, onNewLead }: LeadSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  const supabase = createClient()

  // Load all leads on mount
  useEffect(() => {
    loadLeads()
  }, [tenantId])

  // Filter leads when search term or status changes
  useEffect(() => {
    filterLeads()
  }, [searchTerm, statusFilter, leads])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLeads = () => {
    let filtered = leads

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(term) ||
        lead.email?.toLowerCase().includes(term) ||
        lead.phone?.includes(term) ||
        lead.company?.toLowerCase().includes(term) ||
        lead.tags?.some(tag => tag.toLowerCase().includes(term))
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    setFilteredLeads(filtered)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

  const getStatusColor = (status: LeadStatus) => {
    const colors = {
      new: 'bg-gray-100 text-gray-800',
      contacted: 'bg-blue-100 text-blue-800',
      qualified: 'bg-purple-100 text-purple-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
    }
    return colors[status]
  }

  const getStatusLabel = (status: LeadStatus) => {
    const labels = {
      new: 'Nieuw',
      contacted: 'Gecontacteerd',
      qualified: 'Gekwalificeerd',
      proposal: 'Offerte',
      won: 'Gewonnen',
      lost: 'Verloren',
    }
    return labels[status]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Zoek leads op naam, email, telefoon of tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 border rounded-md flex items-center gap-2 ${
              showFilters || statusFilter !== 'all' 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          <button
            onClick={onNewLead}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nieuwe Lead
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {(searchTerm || statusFilter !== 'all') && (
                <div className="pt-5">
                  <button
                    onClick={clearSearch}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Filters wissen
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-500">
          {loading ? (
            'Laden...'
          ) : (
            `${filteredLeads.length} van ${leads.length} leads`
          )}
        </div>
      </div>

      {/* Results */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Leads laden...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Geen leads gevonden met de huidige filters'
              : 'Nog geen leads. Voeg je eerste lead toe!'
            }
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => onLeadSelect(lead)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {lead.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                      {getStatusLabel(lead.status)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    {lead.company && (
                      <p className="truncate">{lead.company}</p>
                    )}
                    <div className="flex items-center gap-4">
                      {lead.email && (
                        <span className="truncate">{lead.email}</span>
                      )}
                      {lead.phone && (
                        <span>{lead.phone}</span>
                      )}
                    </div>
                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                        {lead.tags.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{lead.tags.length - 3} meer
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 ml-4">
                  {formatDate(lead.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}