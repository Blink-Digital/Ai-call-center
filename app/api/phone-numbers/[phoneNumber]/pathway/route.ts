import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export async function GET(request: NextRequest, { params }: { params: { phoneNumber: string } }) {
  try {
    const { phoneNumber } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    console.log("[PHONE-PATHWAY] 🔍 Looking up pathway for phone:", phoneNumber)

    // Create Supabase client for this request
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[PHONE-PATHWAY] ❌ Auth error:", userError?.message || "No user found")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify user ID matches if provided
    if (userId && user.id !== userId) {
      console.error("[PHONE-PATHWAY] ❌ User ID mismatch")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log("[PHONE-PATHWAY] ✅ User authenticated:", user.email)

    // Query for the specific phone number
    const { data: phoneRecord, error: dbError } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", user.id)
      .eq("number", phoneNumber)
      .single()

    if (dbError) {
      if (dbError.code === "PGRST116") {
        // No rows returned
        return NextResponse.json({ error: "Phone number not found" }, { status: 404 })
      }
      console.error("[PHONE-PATHWAY] ❌ Database error:", dbError)
      return NextResponse.json({ error: "Database error: " + dbError.message }, { status: 500 })
    }

    console.log("[PHONE-PATHWAY] ✅ Phone record found:", phoneRecord.number)

    return NextResponse.json({
      success: true,
      data: {
        pathway_id: phoneRecord.pathway_id,
        pathway_name: phoneRecord.pathway_name,
        pathway_description: phoneRecord.pathway_description,
        last_deployed_at: phoneRecord.updated_at,
      },
    })
  } catch (error) {
    console.error("[PHONE-PATHWAY] ❌ Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
