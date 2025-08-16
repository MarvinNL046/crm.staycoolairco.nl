import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/layout/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user's tenants
  const { data: tenants } = await supabase
    .from('tenant_users')
    .select('tenant_id, role, tenants(id, name)')
    .eq('user_id', user.id)

  if (!tenants || tenants.length === 0) {
    // User has no tenants, redirect to create one
    redirect('/auth/register')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} tenants={tenants} />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}