import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { key, type } = await req.json()

    if (!key || !type) {
      return NextResponse.json({ error: "Missing key or type" }, { status: 400 })
    }

    // Validate OpenRouter API key
    if (type === "openrouter") {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://bland-flowchart-builder.vercel.app/",
          "X-Title": "Bland.ai Flowchart Builder",
        },
      })

      if (!response.ok) {
        return NextResponse.json(
          {
            valid: false,
            error: "Invalid OpenRouter API key",
          },
          { status: 400 },
        )
      }

      return NextResponse.json({ valid: true })
    }

    // For other key types, just return success (implement validation as needed)
    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Error validating API key:", error)
    return NextResponse.json(
      {
        valid: false,
        error: error.message || "Failed to validate API key",
      },
      { status: 500 },
    )
  }
}
