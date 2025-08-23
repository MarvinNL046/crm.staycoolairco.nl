import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionClient } from "@/components/subscription/SubscriptionClient";
import { getEffectiveTenantId } from "@/lib/supabase/impersonation";

export default async function SubscriptionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get effective tenant ID (handles impersonation)
  const tenantId = await getEffectiveTenantId();

  if (!tenantId) {
    redirect("/crm");
  }

  // Get tenant subscription data
  const { data: tenant } = await supabase
    .from("tenants")
    .select(`
      id,
      name,
      subscription_plan,
      subscription_status,
      monthly_price,
      max_users,
      max_leads,
      subscription_started_at,
      subscription_ends_at,
      updated_at
    `)
    .eq("id", tenantId)
    .single();

  if (!tenant) {
    redirect("/crm");
  }

  // Get current usage
  const [
    { count: currentUsers },
    { count: currentLeads }
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
  ]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">
          Beheer je abonnement en bekijk je gebruik
        </p>
      </div>

      <SubscriptionClient 
        tenant={tenant}
        currentUsers={currentUsers || 0}
        currentLeads={currentLeads || 0}
      />
    </div>
  );
}