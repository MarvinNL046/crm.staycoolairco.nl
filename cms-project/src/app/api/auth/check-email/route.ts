import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Check if email exists in profiles table (registered users)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected if user doesn't exist
      console.error("Database error:", profileError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    if (profile) {
      // Email exists - user is already registered
      return NextResponse.json({
        exists: true,
        message: "Dit e-mailadres is al geregistreerd",
        suggestions: [
          {
            action: "login",
            text: "Log in met dit account",
            url: "/auth/login"
          },
          {
            action: "reset",
            text: "Wachtwoord vergeten?",
            url: "/auth/reset-password"
          }
        ]
      });
    }

    // Email doesn't exist - safe to register
    return NextResponse.json({
      exists: false,
      message: "E-mailadres beschikbaar voor registratie"
    });

  } catch (error) {
    console.error("Email check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}