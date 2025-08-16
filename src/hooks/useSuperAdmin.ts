'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSuperAdminStatus()
  }, [])

  const checkSuperAdminStatus = async () => {
    try {
      // Skip check if environment variables are missing (build time)
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setIsSuperAdmin(false)
        setLoading(false)
        return
      }

      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsSuperAdmin(false)
        setLoading(false)
        return
      }

      // Check if user is in super_admins table
      const { data, error } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.log('Not a super admin:', error.message)
        setIsSuperAdmin(false)
      } else {
        console.log('Super admin detected:', data)
        setIsSuperAdmin(true)
      }
    } catch (error) {
      console.error('Error checking super admin status:', error)
      setIsSuperAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  return { isSuperAdmin, loading, checkSuperAdminStatus }
}