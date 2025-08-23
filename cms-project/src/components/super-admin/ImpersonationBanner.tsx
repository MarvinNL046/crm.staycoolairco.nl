'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, UserX, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ImpersonationBannerProps {
  tenantName: string
  tenantId: string
}

export function ImpersonationBanner({ tenantName, tenantId }: ImpersonationBannerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const stopImpersonation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/super-admin/impersonate', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Redirect to super admin dashboard
        router.push('/super-admin')
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to stop impersonation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const goToCrmDashboard = () => {
    router.push('/crm')
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <div className="font-semibold text-orange-800 dark:text-orange-200">
                Super Admin Impersonation Mode
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                You are viewing as: <Badge variant="outline" className="ml-1">{tenantName}</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToCrmDashboard}
              className="text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View CRM Dashboard
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={stopImpersonation}
              disabled={isLoading}
            >
              <UserX className="h-4 w-4 mr-2" />
              {isLoading ? 'Stopping...' : 'Stop Impersonation'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}