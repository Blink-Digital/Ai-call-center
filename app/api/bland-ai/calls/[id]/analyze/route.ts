import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const callId = params.id

    // Get the API key from environment variables
    const apiKey = process.env.BLAND_AI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Call the Bland.ai API to analyze the call
    const response = await fetch(`https://api.bland.ai/v1/calls/${callId}/analyze`, {
      method: "POST", // Note: This is a POST request as per Bland.ai API docs
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to analyze call from Bland.ai" }, { status: response.status })
    }

    const data = await response.json()

    // Return the analysis data
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error analyzing call:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
