import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function GET(req: Request) {
  try {
    // Create Supabase client with proper cookie context
    const supabase = createRouteHandlerClient<Database>({ cookies })

    const { searchParams } = new URL(req.url)
    const phone = searchParams.get("phone")

    console.log("[PATHWAY-API] 🔍 Looking up pathway for phone:", phone)
    console.log("[PATHWAY-API] 🍪 Checking cookies...")

    // Debug: Log available cookies
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    console.log(
      "[PATHWAY-API] 🍪 Available cookies:",
      allCookies.map((c) => c.name),
    )

    if (!phone) {
      console.log("[PATHWAY-API] ❌ Missing phone number parameter")
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Get authenticated user from server-side session
    console.log("[PATHWAY-API] 🔐 Attempting to get user from session...")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.log("[PATHWAY-API] ❌ Auth error:", userError.message)
      console.log("[PATHWAY-API] ❌ Auth error details:", userError)
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: userError.message,
        },
        { status: 401 },
      )
    }

    if (!user) {
      console.log("[PATHWAY-API] ❌ No user found in session")
      return NextResponse.json(
        {
          error: "No authenticated user found. Please log in again.",
        },
        { status: 401 },
      )
    }

    console.log("[PATHWAY-API] ✅ Authenticated user:", {
      id: user.id,
      email: user.email,
      aud: user.aud,
    })

    // Helper function for phone number normalization
    const normalizePhone = (num: string) => {
      if (!num) return ""
      return num.replace(/\D/g, "")
    }

    // Query database for matching phone number
    console.log("[PATHWAY-API] 🔍 Querying database for user's phone numbers...")
    const { data, error } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "purchased"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[PATHWAY-API] ❌ Database error:", error)
      return NextResponse.json(
        {
          error: "Database query failed",
          details: error.message,
        },
        { status: 500 },
      )
    }

    if (!data || data.length === 0) {
      console.log("[PATHWAY-API] ❌ No phone numbers found for user:", user.id)
      return NextResponse.json({
        pathway_id: null,
        phone_record: null,
        message: "No phone numbers found for this user",
      })
    }

    console.log("[PATHWAY-API] 📋 Found", data.length, "phone numbers for user")

    // Find matching phone number with enhanced matching logic
    const targetNormalized = normalizePhone(phone)
    let matchingPhone = null

    for (const phoneRecord of data) {
      console.log(`[PATHWAY-API] 🔍 Checking: "${phoneRecord.number}"`)

      // 1. Exact match
      if (phoneRecord.number === phone) {
        console.log("[PATHWAY-API] ✅ EXACT MATCH FOUND!")
        matchingPhone = phoneRecord
        break
      }

      // 2. Normalized match
      const storedNormalized = normalizePhone(phoneRecord.number)
      if (targetNormalized === storedNormalized) {
        console.log("[PATHWAY-API] ✅ NORMALIZED MATCH FOUND!")
        matchingPhone = phoneRecord
        break
      }

      // 3. Country code variations
      if (targetNormalized.length === 10 && storedNormalized === `1${targetNormalized}`) {
        console.log("[PATHWAY-API] ✅ MATCH FOUND (added country code)!")
        matchingPhone = phoneRecord
        break
      }

      if (storedNormalized.length === 10 && targetNormalized === `1${storedNormalized}`) {
        console.log("[PATHWAY-API] ✅ MATCH FOUND (removed country code)!")
        matchingPhone = phoneRecord
        break
      }
    }

    if (matchingPhone) {
      console.log("[PATHWAY-API] 🎯 MATCHING PHONE FOUND:", {
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
      })
    } else {
      console.log("[PATHWAY-API] ❌ NO MATCHING PHONE NUMBER FOUND")
      console.log("[PATHWAY-API] Available numbers:")
      data.forEach((p, i) => {
        console.log(`[PATHWAY-API] ${i + 1}. "${p.number}" (normalized: "${normalizePhone(p.number)}")`)
      })
      console.log("[PATHWAY-API] Target number:", phone)
      console.log("[PATHWAY-API] Target normalized:", targetNormalized)

      return NextResponse.json({
        pathway_id: null,
        phone_record: null,
        message: "No matching phone number found",
        available_numbers: data.map((p) => p.number),
      })
    }
  } catch (error) {
    console.error("[PATHWAY-API] ❌ Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
