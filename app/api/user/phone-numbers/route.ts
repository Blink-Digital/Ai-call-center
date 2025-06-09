import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [PHONE-NUMBERS] Starting request...")

    // Create server client with request/response pattern
    const supabaseResponse = NextResponse.next()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    console.log("🔍 [PHONE-NUMBERS] Getting user...")

    // Get user directly (this works better in API routes)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("🚨 [PHONE-NUMBERS] User error:", userError)
      return NextResponse.json({ error: "Authentication failed", details: userError.message }, { status: 401 })
    }

    if (!user) {
      console.error("🚨 [PHONE-NUMBERS] No user found")
      return NextResponse.json({ error: "No authenticated user" }, { status: 401 })
    }

    console.log("✅ [PHONE-NUMBERS] User authenticated:", user.id)

    // Fetch user's phone numbers from database
    const { data: phoneNumbers, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "purchased"])
      .order("created_at", { ascending: false })

    if (phoneError) {
      console.error("🚨 [PHONE-NUMBERS] Database error:", phoneError)
      return NextResponse.json({ error: "Failed to fetch phone numbers", details: phoneError.message }, { status: 500 })
    }

    console.log("📱 [PHONE-NUMBERS] Found:", { count: phoneNumbers?.length || 0, phoneNumbers })

    const response = NextResponse.json({
      phoneNumbers: phoneNumbers || [],
      count: phoneNumbers?.length || 0,
    })

    // Copy any cookies that were set
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })

    return response
  } catch (error: any) {
    console.error("🚨 [PHONE-NUMBERS] API error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
