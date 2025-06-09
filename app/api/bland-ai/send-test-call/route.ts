import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { phoneNumber, pathwayId } = await request.json()

    // Validate inputs
    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    if (!pathwayId) {
      return NextResponse.json({ error: "Pathway ID is required" }, { status: 400 })
    }

    // Format phone number to E.164 format if needed
    const formattedPhoneNumber = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber.replace(/\D/g, "")}`

    // Get the API key from environment variables
    const apiKey = process.env.BLAND_AI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Call the Bland.ai API to initiate the call
    const response = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: formattedPhoneNumber,
        pathway_id: pathwayId,
        task: "Test call from pathway editor",
        wait_for_greeting: true,
        record: true,
        voice_id: "default", // Can be customized if needed
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        {
          error: "Failed to initiate call with Bland.ai",
          details: errorData,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      callId: data.call_id,
      message: "Test call initiated successfully",
    })
  } catch (error) {
    console.error("Error sending test call:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
