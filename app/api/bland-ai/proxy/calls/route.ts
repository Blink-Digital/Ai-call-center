import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("🔄 [PROXY-CALLS] Processing GET request")

  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const toNumber = searchParams.get("to_number")
    const fromNumber = searchParams.get("from_number")
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "10"

    console.log(`📞 [PROXY-CALLS] Filtering by to_number: ${toNumber || "none"}`)
    console.log(`📞 [PROXY-CALLS] Filtering by from_number: ${fromNumber || "none"}`)
    console.log(`📄 [PROXY-CALLS] Page: ${page}, Limit: ${limit}`)

    // Validate API key
    const apiKey = process.env.BLAND_AI_API_KEY
    if (!apiKey) {
      console.error("❌ [PROXY-CALLS] Missing BLAND_AI_API_KEY")
      return NextResponse.json({ error: "Server configuration error: Missing API key" }, { status: 500 })
    }

    // Build URL with pagination and filtering
    const blandUrl = new URL("https://api.bland.ai/v1/calls")
    blandUrl.searchParams.set("page", page)
    blandUrl.searchParams.set("limit", limit)
    if (toNumber) {
      blandUrl.searchParams.set("to_number", toNumber)
    }
    if (fromNumber) {
      blandUrl.searchParams.set("from_number", fromNumber)
    }

    console.log(`🔗 [PROXY-CALLS] Requesting: ${blandUrl.toString()}`)

    // Make request to Bland AI
    const response = await fetch(blandUrl.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [PROXY-CALLS] Bland API error: ${response.status} - ${errorText}`)
      return NextResponse.json({ error: `Bland API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log(`✅ [PROXY-CALLS] Received ${data.calls?.length || 0} calls`)

    // Transform the response to match our expected format
    const transformedCalls =
      data.calls?.map((call: any) => ({
        // Map Bland.ai fields to our expected format
        id: call.call_id || call.id,
        to_number: call.to,
        from_number: call.from,
        status: call.queue_status || (call.completed ? "completed" : "pending"),
        duration: call.call_length ? Math.round(call.call_length * 60) : 0, // Convert minutes to seconds
        start_time: call.created_at,
        pathway_id: call.batch_id,
        recording_url: call.recording_url,
        transcript: call.transcript,
        answered_by: call.answered_by,
        error_message: call.error_message,
        completed: call.completed,
      })) || []

    console.log("✅ Transformed response:", {
      totalCalls: transformedCalls.length,
      sampleTransformed: transformedCalls[0]
        ? {
            id: transformedCalls[0].id,
            to_number: transformedCalls[0].to_number,
            from_number: transformedCalls[0].from_number,
            status: transformedCalls[0].status,
            duration: transformedCalls[0].duration,
            start_time: transformedCalls[0].start_time,
          }
        : null,
    })

    // Get the authenticated user
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id

    console.log(`👤 [PROXY-CALLS] User ID: ${userId || "not authenticated"}`)

    return NextResponse.json({
      calls: transformedCalls,
      pagination: data.pagination,
      user_id: userId || null,
    })
  } catch (error: any) {
    console.error("❌ [PROXY-CALLS] Error:", error.message)
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}
