'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSuperAdmin } from '@/hooks/useSuperAdmin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Tenant {
  id: string
  name: string
  plan: string
  status: string
  created_at: string
  max_users: number
  max_leads: number
  trial_ends_at: string | null
}

interface TenantWithStats extends Tenant {
  user_count: number
  lead_count: number
}

export default function SuperAdminDashboard() {
  const { isSuperAdmin, loading } = useSuperAdmin()
  const [tenants, setTenants] = useState<TenantWithStats[]>([])
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    totalLeads: 0,
    totalUsers: 0
  })
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (isSuperAdmin) {
      loadSuperAdminData()
    }
  }, [isSuperAdmin])

  const loadSuperAdminData = async () => {
    try {
      const supabase = createClient()
      
      // Load all tenants with user and lead counts
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          *,
          tenant_users(count),
          leads(count)
        `)
        .order('created_at', { ascending: false })

      if (tenantsError) {
        console.error('Error loading tenants:', tenantsError)
        return
      }

      // Process tenant data with counts
      const processedTenants: TenantWithStats[] = (tenantsData || []).map(tenant => ({
        ...tenant,
        user_count: tenant.tenant_users?.[0]?.count || 0,
        lead_count: tenant.leads?.[0]?.count || 0
      }))

      setTenants(processedTenants)

      // Calculate stats
      const totalTenants = processedTenants.length
      const activeTenants = processedTenants.filter(t => t.status === 'active').length
      const trialTenants = processedTenants.filter(t => t.status === 'trial').length
      const totalLeads = processedTenants.reduce((sum, t) => sum + t.lead_count, 0)
      const totalUsers = processedTenants.reduce((sum, t) => sum + t.user_count, 0)

      setStats({
        totalTenants,
        activeTenants,
        trialTenants,
        totalLeads,
        totalUsers
      })

    } catch (error) {
      console.error('Error loading super admin data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const updateTenantStatus = async (tenantId: string, newStatus: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('tenants')
        .update({ status: newStatus })
        .eq('id', tenantId)

      if (error) {
        console.error('Error updating tenant status:', error)
        return
      }

      // Reload data
      loadSuperAdminData()
    } catch (error) {
      console.error('Error updating tenant status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'trial': return 'bg-blue-100 text-blue-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'trial': return 'bg-blue-100 text-blue-800'
      case 'starter': return 'bg-green-100 text-green-800'
      case 'professional': return 'bg-purple-100 text-purple-800'
      case 'enterprise': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-gray-500">Checking permissions...</div>
        </div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have super admin privileges.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🚀 Super Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Platform-wide management and analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Tenants</CardDescription>
              <CardTitle className="text-2xl">{stats.totalTenants}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.activeTenants}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Trial</CardDescription>
              <CardTitle className="text-2xl text-blue-600">{stats.trialTenants}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-2xl">{stats.totalUsers}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Leads</CardDescription>
              <CardTitle className="text-2xl">{stats.totalLeads}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tenants Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tenants</CardTitle>
            <CardDescription>
              Manage all tenant accounts and subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">Loading tenants...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leads
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {tenant.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {tenant.id.substring(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary" className={getPlanColor(tenant.plan)}>
                            {tenant.plan}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary" className={getStatusColor(tenant.status)}>
                            {tenant.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tenant.user_count} / {tenant.max_users}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tenant.lead_count} / {tenant.max_leads}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(tenant.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {tenant.status === 'active' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateTenantStatus(tenant.id, 'suspended')}
                              >
                                Suspend
                              </Button>
                            )}
                            {tenant.status === 'suspended' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateTenantStatus(tenant.id, 'active')}
                              >
                                Activate
                              </Button>
                            )}
                            {tenant.status === 'trial' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateTenantStatus(tenant.id, 'active')}
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}