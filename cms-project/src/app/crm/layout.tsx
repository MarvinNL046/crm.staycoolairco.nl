import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { CRMSidebar } from "@/components/crm/crm-sidebar"
import { SidebarStatsProvider } from "@/contexts/SidebarStatsContext"
import { GlobalSearchDialog } from "@/components/ui/command-dialog"
import { GlobalSearchButton } from "@/components/ui/global-search-button"
import { getImpersonationContext } from "@/lib/supabase/impersonation"
import { ImpersonationBanner } from "@/components/super-admin/ImpersonationBanner"
import { createClient } from "@/lib/supabase/server"

export default async function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check for impersonation
  const { isImpersonating, tenantId } = await getImpersonationContext()
  
  let tenantName = null
  if (isImpersonating && tenantId) {
    const supabase = await createClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single()
    tenantName = tenant?.name
  }

  return (
    <SidebarStatsProvider>
      <SidebarProvider defaultOpen={true}>
        <CRMSidebar />
        <SidebarInset>
          <div className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger className="-ml-2 lg:hidden" />
            <div className="flex-1 flex items-center justify-end gap-4">
              <GlobalSearchButton />
            </div>
          </div>
          <div className="flex-1 space-y-4 p-8 pt-6">
            {isImpersonating && tenantName && (
              <ImpersonationBanner 
                tenantName={tenantName} 
                tenantId={tenantId!} 
              />
            )}
            {children}
          </div>
          <GlobalSearchDialog />
        </SidebarInset>
      </SidebarProvider>
    </SidebarStatsProvider>
  )
}