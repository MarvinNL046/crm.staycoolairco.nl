'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wifi, WifiOff } from 'lucide-react'

interface RealtimeStatusProps {
  tenantId: string
}

export default function RealtimeStatus({ tenantId }: RealtimeStatusProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionTime, setConnectionTime] = useState<Date | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('status-check')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          // This will trigger when any change happens, confirming connection is active
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionTime(new Date())
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setConnectionTime(null)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId])

  const formatConnectionTime = (time: Date) => {
    return time.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {isConnected ? (
        <>
          <div className="flex items-center gap-1 text-green-600">
            <Wifi className="h-3 w-3" />
            <span>Live</span>
          </div>
          {connectionTime && (
            <span className="text-gray-500">
              sinds {formatConnectionTime(connectionTime)}
            </span>
          )}
        </>
      ) : (
        <div className="flex items-center gap-1 text-gray-400">
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </div>
      )}
    </div>
  )
}