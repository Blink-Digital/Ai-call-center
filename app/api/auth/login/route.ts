import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { email, password } = requestData

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    console.log("[SERVER] Login attempt for:", email)

    // ✅ Create Supabase client with cookies for server-side auth
    const supabase = createRouteHandlerClient({ cookies })

    // ✅ Sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[SERVER] Login error:", error.message)
      return NextResponse.json({ success: false, message: error.message }, { status: 401 })
    }

    if (!data.user || !data.session) {
      console.error("[SERVER] No user or session found")
      return NextResponse.json({ success: false, message: "No user or session found" }, { status: 404 })
    }

    console.log("[SERVER] Login successful for user:", data.user.id)

    // ✅ CRITICAL FIX #1: Ensure setSession() is called to set server-side cookies
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    // ✅ Update last login time (non-blocking)
    try {
      await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", data.user.id)
    } catch (updateError) {
      console.warn("[SERVER] Failed to update last login time:", updateError)
      // Don't fail the login for this
    }

    // ✅ Return success - cookies are set by setSession()
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error: any) {
    console.error("[SERVER] Unexpected login error:", error)
    return NextResponse.json({ success: false, message: "An unexpected error occurred" }, { status: 500 })
  }
}
