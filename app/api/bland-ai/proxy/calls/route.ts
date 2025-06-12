import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export const dynamic = "force-dynamic"

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 1000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRequests = requestCounts.get(userId)

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(userId, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (userRequests.count >= RATE_LIMIT) {
    return false
  }

  userRequests.count++
  return true
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [BLAND-PROXY] Starting user-specific call fetch...")

    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Authenticate user
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error("🚨 [BLAND-PROXY] Authentication failed")
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    const userId = session.user.id
    console.log("✅ [BLAND-PROXY] User authenticated:", userId)

    // Check rate limit
    if (!checkRateLimit(userId)) {
      console.warn("🚨 [BLAND-PROXY] Rate limit exceeded for user:", userId)
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    // Get ALL user's phone numbers and pathways
    const { data: userPhoneNumbers, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("number")
      .eq("user_id", userId)
      .in("status", ["active", "purchased"])

    if (phoneError) {
      console.error("❌ [BLAND-PROXY] Error fetching phone numbers:", phoneError)
      return NextResponse.json({ error: "Failed to fetch phone numbers" }, { status: 500 })
    }

    if (!userPhoneNumbers || userPhoneNumbers.length === 0) {
      console.log("📱 [BLAND-PROXY] No phone numbers found for user")
      return NextResponse.json({
        calls: [],
        count: 0,
        total: 0,
        has_more: false,
        page,
        limit,
      })
    }

    const phoneNumbers = userPhoneNumbers.map((p) => p.number)
    console.log("📞 [BLAND-PROXY] User phone numbers:", phoneNumbers)

    // Get user's pathways for additional filtering
    const { data: userPathways, error: pathwayError } = await supabase
      .from("pathways")
      .select("id, phone_number")
      .eq("user_id", userId)

    const pathwayIds = userPathways?.map((p) => p.id) || []
    console.log("🛤️ [BLAND-PROXY] User pathway IDs:", pathwayIds)

    // Get Bland.ai API key
    const blandApiKey = process.env.BLAND_AI_API_KEY
    if (!blandApiKey) {
      console.error("🚨 [BLAND-PROXY] Bland.ai API key not configured")
      return NextResponse.json({ error: "Bland.ai API key not configured" }, { status: 500 })
    }

    // Fetch calls from Bland.ai (we'll filter client-side since Bland.ai doesn't support multiple phone number filtering)
    const blandApiUrl = new URL("https://api.bland.ai/v1/calls")
    blandApiUrl.searchParams.set("limit", "1000") // Get more calls to filter properly
    blandApiUrl.searchParams.set("offset", "0")

    console.log("🌐 [BLAND-PROXY] Calling Bland.ai API:", blandApiUrl.toString())

    const response = await fetch(blandApiUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: blandApiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [BLAND-PROXY] Bland.ai API error:", response.status, errorText)
      return NextResponse.json({ error: `Bland.ai API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log("📊 [BLAND-PROXY] Raw Bland.ai response:", {
      totalCalls: data.calls?.length || 0,
      hasMore: data.has_more,
    })

    // Filter calls for this specific user
    const userCalls = (data.calls || []).filter((call: any) => {
      const callToNumber = call.to || call.to_number
      const callFromNumber = call.from || call.from_number
      const callPathwayId = call.pathway_id

      // Check if call involves any of user's phone numbers (to or from)
      const matchesPhoneNumber = phoneNumbers.some((userPhone) => {
        const normalizedUserPhone = userPhone.replace(/\D/g, "")
        const normalizedCallTo = callToNumber?.replace(/\D/g, "") || ""
        const normalizedCallFrom = callFromNumber?.replace(/\D/g, "") || ""

        return normalizedCallTo.includes(normalizedUserPhone) || normalizedCallFrom.includes(normalizedUserPhone)
      })

      // Check if call belongs to user's pathway
      const matchesPathway = callPathwayId && pathwayIds.includes(callPathwayId)

      return matchesPhoneNumber || matchesPathway
    })

    console.log("🎯 [BLAND-PROXY] Filtered calls for user:", {
      totalBlandCalls: data.calls?.length || 0,
      userSpecificCalls: userCalls.length,
      userPhoneNumbers: phoneNumbers,
      userPathways: pathwayIds.length,
    })

    // Apply pagination to filtered results
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedCalls = userCalls.slice(startIndex, endIndex)

    // Transform calls to our format
    const transformedCalls = paginatedCalls.map((call: any) => ({
      call_id: call.call_id || call.id,
      to: call.to || call.to_number,
      from: call.from || call.from_number,
      call_length: call.call_length || call.duration || 0,
      created_at: call.created_at || call.start_time,
      queue_status: call.status || call.queue_status || "unknown",
      call_successful: call.completed || call.call_successful || false,
      ended_reason: call.ended_reason || "unknown",
      recording_url: call.recording_url,
      transcript: call.transcript,
      summary: call.summary,
      pathway_id: call.pathway_id,
      corrected_duration: call.corrected_duration,
      variables: call.variables || {},
    }))

    return NextResponse.json({
      calls: transformedCalls,
      count: transformedCalls.length,
      total: userCalls.length,
      has_more: endIndex < userCalls.length,
      page,
      limit,
      debug_info: {
        user_id: userId,
        user_phone_numbers: phoneNumbers,
        user_pathways: pathwayIds.length,
        total_bland_calls: data.calls?.length || 0,
        filtered_user_calls: userCalls.length,
      },
    })
  } catch (error: any) {
    console.error("🚨 [BLAND-PROXY] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
