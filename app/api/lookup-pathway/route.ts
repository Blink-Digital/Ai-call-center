import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function GET(req: Request) {
  console.log("[LOOKUP-PATHWAY] 🚀 Starting pathway lookup...")

  try {
    // Get the phone parameter
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get("phone")

    console.log("[LOOKUP-PATHWAY] 📞 Phone parameter:", phone)

    if (!phone) {
      console.log("[LOOKUP-PATHWAY] ❌ Missing phone number parameter")
      return NextResponse.json(
        {
          error: "Phone number is required",
          message: "Please provide 'phone' parameter",
        },
        { status: 400 },
      )
    }

    // ✅ CRITICAL: Proper Supabase client setup with cookies
    console.log("[LOOKUP-PATHWAY] 🔧 Creating Supabase client with cookies...")
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // ✅ Get the authenticated user
    console.log("[LOOKUP-PATHWAY] 👤 Getting authenticated user...")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.log("[LOOKUP-PATHWAY] ❌ Auth error:", authError.message)
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: authError.message,
        },
        { status: 401 },
      )
    }

    if (!user) {
      console.log("[LOOKUP-PATHWAY] ❌ No user found in session")
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: "No authenticated user found. Please log in again.",
        },
        { status: 401 },
      )
    }

    console.log("[LOOKUP-PATHWAY] ✅ User authenticated:", {
      id: user.id,
      email: user.email,
    })

    // Helper function for phone number normalization
    const normalizePhone = (num: string) => {
      if (!num) return ""
      return num.replace(/\D/g, "")
    }

    // ✅ Query database for matching phone number
    console.log("[LOOKUP-PATHWAY] 🔍 Querying database for user's phone numbers...")
    const { data: phoneNumbers, error: queryError } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "purchased"])
      .order("created_at", { ascending: false })

    if (queryError) {
      console.error("[LOOKUP-PATHWAY] ❌ Database error:", queryError)
      return NextResponse.json(
        {
          error: "Database query failed",
          details: queryError.message,
        },
        { status: 500 },
      )
    }

    if (!phoneNumbers || phoneNumbers.length === 0) {
      console.log("[LOOKUP-PATHWAY] ❌ No phone numbers found for user:", user.id)
      return NextResponse.json({
        pathway_id: null,
        phone_record: null,
        message: "No phone numbers found for this user",
        success: false,
      })
    }

    console.log("[LOOKUP-PATHWAY] 📋 Found", phoneNumbers.length, "phone numbers for user")

    // ✅ Enhanced phone number matching logic
    const targetNormalized = normalizePhone(phone)
    let matchingPhone = null

    for (const phoneRecord of phoneNumbers) {
      console.log(`[LOOKUP-PATHWAY] 🔍 Checking: "${phoneRecord.number}"`)

      // 1. Exact match
      if (phoneRecord.number === phone) {
        console.log("[LOOKUP-PATHWAY] ✅ EXACT MATCH FOUND!")
        matchingPhone = phoneRecord
        break
      }

      // 2. Normalized match (remove all non-digits and compare)
      const storedNormalized = normalizePhone(phoneRecord.number)
      if (targetNormalized === storedNormalized) {
        console.log("[LOOKUP-PATHWAY] ✅ NORMALIZED MATCH FOUND!")
        matchingPhone = phoneRecord
        break
      }

      // 3. Country code variations
      if (targetNormalized.length === 10 && storedNormalized === `1${targetNormalized}`) {
        console.log("[LOOKUP-PATHWAY] ✅ MATCH FOUND (added country code)!")
        matchingPhone = phoneRecord
        break
      }

      if (storedNormalized.length === 10 && targetNormalized === `1${storedNormalized}`) {
        console.log("[LOOKUP-PATHWAY] ✅ MATCH FOUND (removed country code)!")
        matchingPhone = phoneRecord
        break
      }
    }

    if (matchingPhone) {
      console.log("[LOOKUP-PATHWAY] 🎯 MATCHING PHONE FOUND:", {
        storedNumber: matchingPhone.number,
        inputNumber: phone,
        pathwayId: matchingPhone.pathway_id,
        pathwayName: matchingPhone.pathway_name,
      })

      return NextResponse.json({
        pathway_id: matchingPhone.pathway_id || null,
        pathway_name: matchingPhone.pathway_name || null,
        pathway_description: matchingPhone.pathway_description || null,
        phone_record: matchingPhone,
        message: "Phone number found",
        success: true,
      })
    } else {
      console.log("[LOOKUP-PATHWAY] ❌ NO MATCHING PHONE NUMBER FOUND")
      console.log("[LOOKUP-PATHWAY] Available numbers:")
      phoneNumbers.forEach((p, i) => {
        console.log(`[LOOKUP-PATHWAY] ${i + 1}. "${p.number}" (normalized: "${normalizePhone(p.number)}")`)
      })
      console.log("[LOOKUP-PATHWAY] Target number:", phone)
      console.log("[LOOKUP-PATHWAY] Target normalized:", targetNormalized)

      return NextResponse.json({
        pathway_id: null,
        phone_record: null,
        message: "No matching phone number found",
        available_numbers: phoneNumbers.map((p) => p.number),
        success: false,
      })
    }
  } catch (error) {
    console.error("[LOOKUP-PATHWAY] ❌ Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
