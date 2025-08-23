'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ImpersonateButtonProps {
  tenantId: string
  tenantName: string
  size?: 'sm' | 'default' | 'lg'
}

export function ImpersonateButton({ tenantId, tenantName, size = 'sm' }: ImpersonateButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleImpersonate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/super-admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: tenantId
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Now viewing as ${tenantName}`)
        // Redirect to CRM dashboard
        router.push('/crm')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to impersonate tenant')
      }
    } catch (error) {
      console.error('Impersonation error:', error)
      toast.error('Failed to impersonate tenant')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="default" 
      size={size}
      onClick={handleImpersonate}
      disabled={isLoading}
      className="bg-orange-600 hover:bg-orange-700 text-white"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
      ) : (
        <Eye className="mr-2 h-3 w-3" />
      )}
      {isLoading ? 'Viewing...' : 'View as'}
    </Button>
  )
}