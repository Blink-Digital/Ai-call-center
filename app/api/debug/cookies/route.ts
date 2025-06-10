import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function GET(req: Request) {
  try {
    console.log("[DEBUG-COOKIES] 🔍 Starting cookie debug...")

    // Get all cookies
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    console.log("[DEBUG-COOKIES] 📋 All cookies:", allCookies.length)
    allCookies.forEach((cookie, index) => {
      console.log(`[DEBUG-COOKIES] ${index + 1}. ${cookie.name} = ${cookie.value.substring(0, 50)}...`)
    })

    // Filter Supabase-related cookies
    const supabaseCookies = allCookies.filter(
      (cookie) => cookie.name.includes("supabase") || cookie.name.startsWith("sb-") || cookie.name.includes("auth"),
    )

    console.log("[DEBUG-COOKIES] 🔐 Supabase cookies found:", supabaseCookies.length)
    supabaseCookies.forEach((cookie, index) => {
      console.log(`[DEBUG-COOKIES] Supabase ${index + 1}. ${cookie.name}`)
    })

    // Try to create Supabase client
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    // Test session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log("[DEBUG-COOKIES] 📊 Session check:", {
      hasSession: !!sessionData.session,
      sessionError: sessionError?.message,
      userId: sessionData.session?.user?.id,
      userEmail: sessionData.session?.user?.email,
    })

    // Test user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log("[DEBUG-COOKIES] 👤 User check:", {
      hasUser: !!userData.user,
      userError: userError?.message,
      userId: userData.user?.id,
      userEmail: userData.user?.email,
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cookies: {
        total: allCookies.length,
        supabase: supabaseCookies.length,
        names: allCookies.map((c) => c.name),
        supabaseNames: supabaseCookies.map((c) => c.name),
      },
      session: {
        exists: !!sessionData.session,
        error: sessionError?.message,
        userId: sessionData.session?.user?.id,
        email: sessionData.session?.user?.email,
      },
      user: {
        exists: !!userData.user,
        error: userError?.message,
        userId: userData.user?.id,
        email: userData.user?.email,
      },
      headers: {
        host: req.headers.get("host"),
        origin: req.headers.get("origin"),
        referer: req.headers.get("referer"),
        cookie: req.headers.get("cookie")?.substring(0, 100) + "...",
      },
    })
  } catch (error) {
    console.error("[DEBUG-COOKIES] ❌ Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
