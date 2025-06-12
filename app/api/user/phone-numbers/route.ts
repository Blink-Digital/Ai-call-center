import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return true
  }

  if (userLimit.count >= 10) {
    // 10 requests per minute
    return false
  }

  userLimit.count++
  return true
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [PHONE-NUMBERS] Starting request...")

    // Create route handler client with proper cookie handling for RLS
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    console.log("🔍 [PHONE-NUMBERS] Getting user session...")

    // Get user session (required for RLS)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("🚨 [PHONE-NUMBERS] Session error:", sessionError)
      return NextResponse.json({ error: "Authentication failed", details: sessionError.message }, { status: 401 })
    }

    if (!session?.user) {
      console.error("🚨 [PHONE-NUMBERS] No authenticated user session")
      return NextResponse.json({ error: "No authenticated user session" }, { status: 401 })
    }

    const userId = session.user.id
    console.log("✅ [PHONE-NUMBERS] User authenticated:", userId)

    // Check rate limiting
    if (!checkRateLimit(userId)) {
      console.warn("⚠️ [PHONE-NUMBERS] Rate limit exceeded for user:", userId)
      return NextResponse.json(
        { error: "Too many requests", details: "Please wait before making another request" },
        { status: 429 },
      )
    }

    // Add delay to prevent rapid successive calls
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Fetch user's phone numbers from database (RLS will automatically filter by user)
    const { data: phoneNumbers, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("*")
      .order("created_at", { ascending: false })

    if (phoneError) {
      console.error("🚨 [PHONE-NUMBERS] Database error:", phoneError)
      return NextResponse.json({ error: "Failed to fetch phone numbers", details: phoneError.message }, { status: 500 })
    }

    console.log("📱 [PHONE-NUMBERS] Found:", {
      count: phoneNumbers?.length || 0,
      userId,
      phoneNumbers: phoneNumbers?.map((p) => ({ id: p.id, number: p.number, status: p.status })),
    })

    return NextResponse.json({
      phoneNumbers: phoneNumbers || [],
      count: phoneNumbers?.length || 0,
    })
  } catch (error: any) {
    console.error("🚨 [PHONE-NUMBERS] API error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
