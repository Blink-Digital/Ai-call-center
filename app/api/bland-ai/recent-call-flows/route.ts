import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "3", 10)

    // Get the API key from environment variables
    const apiKey = process.env.BLAND_AI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // In a real implementation, you would fetch this from Bland.ai API
    // For now, we'll return some sample data based on the calls API
    const response = await fetch("https://api.bland.ai/v1/calls", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch calls from Bland.ai" }, { status: response.status })
    }

    const data = await response.json()
    const calls = Array.isArray(data.calls) ? data.calls : []

    // Extract unique pathway names and their last modified date
    const pathwayMap = new Map()

    calls.forEach((call: any) => {
      if (call.pathway_name && call.start_time) {
        const pathwayName = call.pathway_name
        const callDate = new Date(call.start_time)

        if (!pathwayMap.has(pathwayName) || callDate > pathwayMap.get(pathwayName).lastModified) {
          pathwayMap.set(pathwayName, {
            name: pathwayName,
            lastModified: callDate,
            id: call.id || Math.random().toString(36).substring(7),
          })
        }
      }
    })

    // Convert to array and sort by last modified date (most recent first)
    const recentFlows = Array.from(pathwayMap.values())
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      .slice(0, limit)
      .map((flow) => ({
        id: flow.id,
        name: flow.name,
        lastModified: flow.lastModified,
        daysAgo: Math.floor((Date.now() - flow.lastModified.getTime()) / (1000 * 60 * 60 * 24)),
      }))

    return NextResponse.json(recentFlows)
  } catch (error) {
    console.error("Error fetching recent call flows:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
