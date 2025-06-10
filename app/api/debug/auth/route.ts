import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function GET(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    // Get session info
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Get user info
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    // Get all cookies for debugging
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies.filter(
      (cookie) => cookie.name.includes("supabase") || cookie.name.includes("auth") || cookie.name.includes("sb-"),
    )

    const debugInfo = {
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        user_id: session?.user?.id || null,
        email: session?.user?.email || null,
        expires_at: session?.expires_at || null,
        error: sessionError?.message || null,
      },
      user: {
        exists: !!user,
        user_id: user?.id || null,
        email: user?.email || null,
        error: userError?.message || null,
      },
      cookies: {
        total_cookies: allCookies.length,
        auth_cookies: authCookies.length,
        auth_cookie_names: authCookies.map((c) => c.name),
      },
      headers: {
        host: req.headers.get("host"),
        origin: req.headers.get("origin"),
        referer: req.headers.get("referer"),
        user_agent: req.headers.get("user-agent"),
      },
    }

    console.log("[DEBUG-AUTH] 🔍 Authentication debug info:", debugInfo)

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("[DEBUG-AUTH] ❌ Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
