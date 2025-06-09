import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("[AUTH/ME] Error getting user:", error.message)
      return NextResponse.json({ user: null, error: error.message }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error("[AUTH/ME] Unexpected error:", error)
    return NextResponse.json({ user: null, error: "Internal server error" }, { status: 500 })
  }
}
