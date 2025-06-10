import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function POST(req: Request, { params }: { params: { phoneNumber: string } }) {
  try {
    // ✅ FIXED: Create Supabase client with proper cookie context
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    const { phoneNumber } = params
    const body = await req.json()
    const { pathwayId, pathwayName, pathwayDescription, userId, updateTimestamp } = body

    console.log("[PHONE-PATHWAY] 📞 Processing request for phone:", phoneNumber)
    console.log("[PHONE-PATHWAY] 📋 Body:", { pathwayId, pathwayName, pathwayDescription, userId, updateTimestamp })

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // ✅ FIXED: Get authenticated user from server-side session using cookies
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[PHONE-PATHWAY] ❌ Auth error:", userError?.message || "No user found")
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: userError?.message || "No authenticated user found",
        },
        { status: 401 },
      )
    }

    console.log("[PHONE-PATHWAY] ✅ Authenticated user:", user.email)

    // Helper function for phone number normalization
    const normalizePhone = (num: string) => {
      if (!num) return ""
      return num.replace(/\D/g, "")
    }

    // Find the matching phone number record
    const { data: phoneRecords, error: fetchError } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "purchased"])

    if (fetchError) {
      console.error("[PHONE-PATHWAY] ❌ Database fetch error:", fetchError)
      return NextResponse.json(
        {
          error: "Database query failed",
          details: fetchError.message,
        },
        { status: 500 },
      )
    }

    if (!phoneRecords || phoneRecords.length === 0) {
      console.log("[PHONE-PATHWAY] ❌ No phone numbers found for user")
      return NextResponse.json({
        error: "No phone numbers found for this user",
        success: false,
      })
    }

    // Find matching phone number with enhanced matching logic
    const targetNormalized = normalizePhone(phoneNumber)
    let matchingPhone = null

    for (const phoneRecord of phoneRecords) {
      // 1. Exact match
      if (phoneRecord.number === phoneNumber) {
        matchingPhone = phoneRecord
        break
      }

      // 2. Normalized match
      const storedNormalized = normalizePhone(phoneRecord.number)
      if (targetNormalized === storedNormalized) {
        matchingPhone = phoneRecord
        break
      }

      // 3. Country code variations
      if (targetNormalized.length === 10 && storedNormalized === `1${targetNormalized}`) {
        matchingPhone = phoneRecord
        break
      }

      if (storedNormalized.length === 10 && targetNormalized === `1${storedNormalized}`) {
        matchingPhone = phoneRecord
        break
      }
    }

    if (!matchingPhone) {
      console.log("[PHONE-PATHWAY] ❌ No matching phone number found")
      return NextResponse.json({
        error: "No matching phone number found",
        available_numbers: phoneRecords.map((p) => p.number),
        success: false,
      })
    }

    console.log("[PHONE-PATHWAY] 🎯 Found matching phone:", matchingPhone.number)

    // Update the phone number record with pathway information
    const updateData: any = {}

    if (pathwayId) updateData.pathway_id = pathwayId
    if (pathwayName) updateData.pathway_name = pathwayName
    if (pathwayDescription) updateData.pathway_description = pathwayDescription
    if (updateTimestamp) updateData.last_deployed_at = new Date().toISOString()

    const { data: updateResult, error: updateError } = await supabase
      .from("phone_numbers")
      .update(updateData)
      .eq("id", matchingPhone.id)
      .eq("user_id", user.id)
      .select()

    if (updateError) {
      console.error("[PHONE-PATHWAY] ❌ Update error:", updateError)
      return NextResponse.json(
        {
          error: "Failed to update phone number record",
          details: updateError.message,
        },
        { status: 500 },
      )
    }

    console.log("[PHONE-PATHWAY] ✅ Successfully updated phone number record")

    return NextResponse.json({
      success: true,
      message: "Phone number pathway updated successfully",
      data: updateResult?.[0] || null,
    })
  } catch (error) {
    console.error("[PHONE-PATHWAY] ❌ Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
