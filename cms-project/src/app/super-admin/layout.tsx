import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SuperAdminSidebar } from '@/components/super-admin/super-admin-sidebar'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { getImpersonationContext } from "@/lib/supabase/impersonation"
import { ImpersonationBanner } from "@/components/super-admin/ImpersonationBanner"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component
          }
        },
      },
    }
  )
  
  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/super-admin')
  }

  // Verify super admin status
  const { data: superAdmin } = await supabase
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!superAdmin) {
    redirect('/crm')
  }

  // Get user profile for display
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  // Check for impersonation
  const { isImpersonating, tenantId } = await getImpersonationContext()
  
  let tenantName = null
  if (isImpersonating && tenantId) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single()
    tenantName = tenant?.name
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-gray-50 flex">
        <SuperAdminSidebar user={{ ...user, ...profile }} />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {isImpersonating && tenantName && (
              <ImpersonationBanner 
                tenantName={tenantName} 
                tenantId={tenantId!} 
              />
            )}
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}