import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "20")

    console.log("📞 [CALL-HISTORY-API] Request params:", { phone, page, pageSize })

    // Create Supabase client for authentication
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ [CALL-HISTORY-API] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    if (!process.env.BLAND_AI_API_KEY) {
      console.error("❌ [CALL-HISTORY-API] Missing BLAND_AI_API_KEY")
      return NextResponse.json({ error: "Bland AI API key not configured" }, { status: 500 })
    }

    // Clean phone number (remove +1 prefix if present for Bland.ai API)
    const cleanPhone = phone.replace(/^\+?1?/, "").replace(/\D/g, "")
    console.log("📞 [CALL-HISTORY-API] Clean phone:", cleanPhone)

    // Fetch calls from Bland.ai API
    const blandResponse = await fetch("https://api.bland.ai/v1/calls", {
      method: "GET",
      headers: {
        Authorization: process.env.BLAND_AI_API_KEY,
        "Content-Type": "application/json",
      },
    })

    if (!blandResponse.ok) {
      const errorText = await blandResponse.text()
      console.error("❌ [CALL-HISTORY-API] Bland.ai API error:", blandResponse.status, errorText)
      return NextResponse.json(
        {
          error: `Bland.ai API error: ${blandResponse.status}`,
          details: errorText,
        },
        { status: blandResponse.status },
      )
    }

    const blandData = await blandResponse.json()
    console.log("✅ [CALL-HISTORY-API] Bland.ai response:", {
      totalCalls: blandData.calls?.length || 0,
      sampleCall: blandData.calls?.[0]
        ? {
            id: blandData.calls[0].c_id,
            to: blandData.calls[0].to,
            from: blandData.calls[0].from,
            status: blandData.calls[0].status,
            created_at: blandData.calls[0].created_at,
          }
        : null,
    })

    // Filter calls for the specific phone number
    const allCalls = blandData.calls || []
    const filteredCalls = allCalls.filter((call: any) => {
      const callTo = call.to?.replace(/^\+?1?/, "").replace(/\D/g, "")
      const callFrom = call.from?.replace(/^\+?1?/, "").replace(/\D/g, "")
      return callTo === cleanPhone || callFrom === cleanPhone
    })

    console.log("📞 [CALL-HISTORY-API] Filtered calls:", {
      total: allCalls.length,
      filtered: filteredCalls.length,
      phone: cleanPhone,
    })

    // Transform calls to match our expected format
    const transformedCalls = filteredCalls.map((call: any) => ({
      id: call.c_id || call.call_id || call.id,
      to_number: call.to || "",
      from_number: call.from || "",
      status: call.status || "unknown",
      duration: call.call_length || call.duration || 0,
      start_time: call.created_at || call.start_time || new Date().toISOString(),
      pathway_id: call.pathway_id || null,
      pathway_name: call.pathway_name || null,
      ended_reason: call.ended_reason || null,
      recording_url: call.recording_url || null,
      transcript: call.transcript || null,
      summary: call.summary || null,
      variables: call.variables || null,
    }))

    // Sort by start_time (newest first)
    transformedCalls.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

    // Apply pagination
    const totalCalls = transformedCalls.length
    const totalPages = Math.ceil(totalCalls / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedCalls = transformedCalls.slice(startIndex, endIndex)

    console.log("✅ [CALL-HISTORY-API] Response:", {
      totalCalls,
      totalPages,
      currentPage: page,
      pageSize,
      returnedCalls: paginatedCalls.length,
    })

    return NextResponse.json({
      success: true,
      calls: paginatedCalls,
      count: totalCalls,
      page,
      pageSize,
      totalPages,
      debug_info: {
        phone_searched: cleanPhone,
        total_bland_calls: allCalls.length,
        filtered_calls: filteredCalls.length,
        sample_call_fields: allCalls[0] ? Object.keys(allCalls[0]) : [],
      },
    })
  } catch (error) {
    console.error("💥 [CALL-HISTORY-API] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
