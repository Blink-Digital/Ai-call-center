import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const toNumber = searchParams.get("to_number")
    const fromNumber = searchParams.get("from_number")
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "100"

    console.log("🔍 Bland.ai proxy calls - Request params:", { toNumber, fromNumber, page, limit })

    if (!process.env.BLAND_AI_API_KEY) {
      console.error("❌ BLAND_AI_API_KEY not found")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Build the Bland.ai API URL
    const blandUrl = new URL("https://api.bland.ai/v1/calls")

    // Support both to_number and from_number filtering
    if (toNumber) {
      blandUrl.searchParams.set("to_number", toNumber)
    }
    if (fromNumber) {
      blandUrl.searchParams.set("from_number", fromNumber)
    }

    blandUrl.searchParams.set("limit", limit)
    // Note: Bland.ai uses 'from' and 'to' for pagination, not 'page'
    // We'll handle pagination differently if needed

    console.log("🌐 Making request to Bland.ai:", blandUrl.toString())

    const response = await fetch(blandUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.BLAND_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 Bland.ai response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Bland.ai API error:", response.status, errorText)
      return NextResponse.json(
        { error: `Bland.ai API error: ${response.status} ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("✅ Bland.ai raw response:", {
      count: data.count,
      totalCalls: data.calls?.length || 0,
      hasData: !!data.calls,
      sampleCall: data.calls?.[0]
        ? {
            call_id: data.calls[0].call_id,
            created_at: data.calls[0].created_at,
            call_length: data.calls[0].call_length,
            to: data.calls[0].to,
            from: data.calls[0].from,
            queue_status: data.calls[0].queue_status,
            completed: data.calls[0].completed,
          }
        : null,
    })

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

    return NextResponse.json({
      calls: transformedCalls,
      count: data.count || transformedCalls.length,
      total: data.count || transformedCalls.length,
    })
  } catch (error) {
    console.error("💥 Bland.ai proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch calls from Bland.ai" }, { status: 500 })
  }
}
