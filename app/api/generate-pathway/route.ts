import { type NextRequest, NextResponse } from "next/server"
import { createMedicareQualificationFlow } from "@/utils/medicare-qualification-template"

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = "openai/gpt-4o-mini", debug = false } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log(`Generating pathway with prompt: ${prompt}`)

    // Check if this is a Medicare qualification prompt
    const isMedicarePrompt =
      prompt.toLowerCase().includes("medicare") &&
      (prompt.toLowerCase().includes("qualify") || prompt.toLowerCase().includes("qualification"))

    if (isMedicarePrompt) {
      console.log("Using Medicare qualification template")
      // Use the Medicare qualification template
      const medicareFlow = createMedicareQualificationFlow()

      // If debug mode is enabled, include debug info
      if (debug) {
        return NextResponse.json({
          ...medicareFlow,
          _debug: {
            source: "medicare-template",
            prompt,
          },
        })
      }

      return NextResponse.json(medicareFlow)
    }

    // For all other prompts, use the OpenRouter API
    // Fix: Use the correct URL with origin for the API route
    const url = new URL("/api/generate-pathway-openrouter", req.nextUrl.origin).toString()
    console.log("Calling OpenRouter API route at:", url)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        model,
        debug,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error from OpenRouter API route:", errorData)
      return NextResponse.json(
        {
          error: "Failed to generate pathway with OpenRouter",
          details: errorData,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error generating pathway:", error)
    return NextResponse.json(
      {
        error: "Failed to generate pathway",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
