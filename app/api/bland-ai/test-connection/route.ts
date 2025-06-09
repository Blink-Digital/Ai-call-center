import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ status: "error", message: "API key is required" }, { status: 400 })
    }

    // Test the connection by fetching pathways - using a valid endpoint
    const response = await fetch("https://api.bland.ai/v1/pathway/list", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    })

    // Check content type before trying to parse as JSON
    const contentType = response.headers.get("content-type")

    if (!contentType || !contentType.includes("application/json")) {
      // Not JSON, get the raw text
      const rawResponse = await response.text()
      return NextResponse.json(
        {
          status: "error",
          message: "Non-JSON response received from API",
          responseStatus: response.status,
          responseStatusText: response.statusText,
          rawResponse: rawResponse.substring(0, 1000), // First 1000 chars for debugging
          requestDetails: {
            url: "https://api.bland.ai/v1/pathway/list", // Updated URL
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer API_KEY_REDACTED",
            },
          },
        },
        { status: response.status },
      )
    }

    // Now it's safe to parse as JSON
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to connect to Bland.ai API",
          responseStatus: response.status,
          responseStatusText: response.statusText,
          responseData: data,
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      status: "success",
      message: "Successfully connected to Bland.ai API",
      data,
    })
  } catch (error) {
    console.error("Error testing connection:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
