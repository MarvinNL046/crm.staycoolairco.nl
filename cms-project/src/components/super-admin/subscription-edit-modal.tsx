'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Calendar, CreditCard, Users, TrendingUp } from 'lucide-react'

interface SubscriptionEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  tenant: {
    id: string
    name: string
    subscription_plan?: string
    subscription_status?: string
    monthly_price?: string
    max_users?: number
    max_leads?: number
    subscription_ends_at?: string
  } | null
}

export function SubscriptionEditModal({ isOpen, onClose, onSave, tenant }: SubscriptionEditModalProps) {
  const [formData, setFormData] = useState({
    subscription_plan: 'free',
    subscription_status: 'active',
    monthly_price: '0',
    max_users: 1,
    max_leads: 100,
    subscription_ends_at: '',
  })

  // Update form data when tenant changes
  useEffect(() => {
    if (tenant) {
      setFormData({
        subscription_plan: tenant.subscription_plan || 'free',
        subscription_status: tenant.subscription_status || 'active',
        monthly_price: tenant.monthly_price || '0',
        max_users: tenant.max_users || 1,
        max_leads: tenant.max_leads || 100,
        subscription_ends_at: tenant.subscription_ends_at?.split('T')[0] || '',
      })
    }
  }, [tenant])

  const subscriptionPlans = [
    { value: 'free', label: 'Free', price: 0, users: 1, leads: 100 },
    { value: 'starter', label: 'Starter', price: 19.99, users: 3, leads: 500 },
    { value: 'professional', label: 'Professional', price: 49.99, users: 10, leads: 2000 },
    { value: 'enterprise', label: 'Enterprise', price: 99.99, users: 50, leads: 10000 },
  ]

  const handlePlanChange = (planValue: string) => {
    const plan = subscriptionPlans.find(p => p.value === planValue)
    if (plan) {
      setFormData({
        ...formData,
        subscription_plan: planValue,
        monthly_price: plan.price.toString(),
        max_users: plan.users,
        max_leads: plan.leads,
      })
    }
  }

  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!tenant) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/super-admin/subscriptions/${tenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          old_plan: tenant.subscription_plan, // For audit log
        }),
      })

      if (response.ok) {
        onSave() // Refresh parent data
      } else {
        const error = await response.json()
        console.error('Error updating subscription:', error)
        alert('Er is een fout opgetreden bij het opslaan van het abonnement.')
      }
    } catch (error) {
      console.error('Error saving subscription:', error)
      alert('Er is een fout opgetreden bij het opslaan van het abonnement.')
    }
    setLoading(false)
  }

  if (!tenant) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Abonnement Bewerken - {tenant.name}
          </DialogTitle>
          <DialogDescription>
            Pas het abonnement en de limieten voor deze tenant aan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Huidig Plan</Badge>
              <Badge className="capitalize">{tenant.subscription_plan}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Status</Badge>
              <Badge className="capitalize">{tenant.subscription_status}</Badge>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label htmlFor="plan">Abonnement Plan</Label>
            <Select value={formData.subscription_plan} onValueChange={handlePlanChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer plan" />
              </SelectTrigger>
              <SelectContent>
                {subscriptionPlans.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    <div className="flex items-center justify-between w-full">
                      <span className="capitalize font-medium">{plan.label}</span>
                      <span className="text-sm text-gray-600">
                        €{plan.price}/maand - {plan.users} users, {plan.leads} leads
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.subscription_status} 
              onValueChange={(value) => setFormData({...formData, subscription_status: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actief</SelectItem>
                <SelectItem value="trial">Proefperiode</SelectItem>
                <SelectItem value="cancelled">Geannuleerd</SelectItem>
                <SelectItem value="expired">Verlopen</SelectItem>
                <SelectItem value="suspended">Opgeschort</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pricing and Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Maandprijs (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.monthly_price}
                onChange={(e) => setFormData({...formData, monthly_price: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Einddatum</Label>
              <Input
                id="end-date"
                type="date"
                value={formData.subscription_ends_at}
                onChange={(e) => setFormData({...formData, subscription_ends_at: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-users">Max Gebruikers</Label>
              <Input
                id="max-users"
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({...formData, max_users: parseInt(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-leads">Max Leads</Label>
              <Input
                id="max-leads"
                type="number"
                value={formData.max_leads}
                onChange={(e) => setFormData({...formData, max_leads: parseInt(e.target.value)})}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Samenvatting Wijzigingen</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>€{formData.monthly_price}/maand</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>{formData.max_users} gebruikers</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span>{formData.max_leads} leads</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="capitalize">{formData.subscription_status}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}