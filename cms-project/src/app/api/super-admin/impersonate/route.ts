import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await request.json();
    
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is super admin
    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!superAdmin) {
      return NextResponse.json(
        { error: "Access denied - Super admin required" },
        { status: 403 }
      );
    }

    // Verify tenant exists
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name")
      .eq("id", tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Set impersonation cookies
    const cookieStore = await cookies();
    
    // Store original user info for switching back
    cookieStore.set("impersonating_tenant_id", tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/"
    });
    
    cookieStore.set("original_super_admin_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/"
    });

    // Log the impersonation for audit
    await supabase
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action: "tenant_impersonation_start",
        table_name: "tenants",
        record_id: tenantId,
        changes: {
          tenant_name: tenant.name,
          impersonated_at: new Date().toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      tenant: tenant,
      message: `Now impersonating ${tenant.name}`
    });

  } catch (error) {
    console.error("Impersonation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Stop impersonation
export async function DELETE() {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    
    const originalAdminId = cookieStore.get("original_super_admin_id")?.value;
    const impersonatingTenantId = cookieStore.get("impersonating_tenant_id")?.value;

    if (originalAdminId && impersonatingTenantId) {
      // Log end of impersonation
      await supabase
        .from("audit_logs")
        .insert({
          user_id: originalAdminId,
          action: "tenant_impersonation_end", 
          table_name: "tenants",
          record_id: impersonatingTenantId,
          changes: {
            ended_at: new Date().toISOString()
          }
        });
    }

    // Clear impersonation cookies
    cookieStore.delete("impersonating_tenant_id");
    cookieStore.delete("original_super_admin_id");

    return NextResponse.json({
      success: true,
      message: "Stopped impersonating tenant"
    });

  } catch (error) {
    console.error("Stop impersonation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}