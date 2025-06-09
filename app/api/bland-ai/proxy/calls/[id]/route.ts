import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Create Supabase client with cookies for authentication
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const callId = params.id

    // Make the request to Bland.ai API
    const response = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
      headers: {
        Authorization: `Bearer ${process.env.BLAND_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Bland.ai API error for call ${callId}:`, errorText)
      return NextResponse.json({ error: `Bland.ai API error: ${response.statusText}` }, { status: response.status })
    }

    // Return the response from Bland.ai
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in call proxy:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
