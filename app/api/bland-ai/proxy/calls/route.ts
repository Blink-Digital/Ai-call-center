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

    blandUrl.searchParams.set("page", page)
    blandUrl.searchParams.set("limit", limit)

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
    console.log("✅ Bland.ai response data:", {
      totalCalls: data.calls?.length || 0,
      hasData: !!data.calls,
      firstCall: data.calls?.[0]
        ? {
            id: data.calls[0].id,
            to_number: data.calls[0].to_number,
            from_number: data.calls[0].from_number,
            status: data.calls[0].status,
            start_time: data.calls[0].start_time,
          }
        : null,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("💥 Bland.ai proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch calls from Bland.ai" }, { status: 500 })
  }
}
