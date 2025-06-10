import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function GET() {
  console.log("[TEST-AUTH] 🧪 Testing authentication...")

  try {
    // Create Supabase client with cookies
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.log("[TEST-AUTH] ❌ Auth error:", authError.message)
      return NextResponse.json(
        {
          authenticated: false,
          error: authError.message,
        },
        { status: 401 },
      )
    }

    if (!user) {
      console.log("[TEST-AUTH] ❌ No user found")
      return NextResponse.json(
        {
          authenticated: false,
          error: "No user found in session",
        },
        { status: 401 },
      )
    }

    console.log("[TEST-AUTH] ✅ User authenticated:", user.email)

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error("[TEST-AUTH] ❌ Unexpected error:", error)
    return NextResponse.json(
      {
        authenticated: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
