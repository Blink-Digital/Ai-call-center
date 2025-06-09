import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function GET(request: Request) {
  try {
    console.log("[LOOKUP-PATHWAY-API] 🔍 Starting pathway lookup...")

    // Create Supabase client with cookies - this handles session automatically
    const supabase = createRouteHandlerClient<Database>({ cookies })

    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      console.log("[LOOKUP-PATHWAY-API] ❌ Missing phone number parameter")
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    console.log("[LOOKUP-PATHWAY-API] 📞 Looking up phone:", phone)

    // Get authenticated user - this uses the session from cookies automatically
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("[LOOKUP-PATHWAY-API] ❌ Auth error:", userError.message)
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: userError.message,
        },
        { status: 401 },
      )
    }

    if (!user) {
      console.log("[LOOKUP-PATHWAY-API] ❌ No authenticated user")
      return NextResponse.json(
        {
          error: "No authenticated user found. Please log in again.",
        },
        { status: 401 },
      )
    }

    console.log("[LOOKUP-PATHWAY-API] ✅ Authenticated user:", {
      id: user.id,
      email: user.email,
    })

    // Helper function for phone number normalization
    const normalizePhone = (num: string) => {
      if (!num) return ""
      return num.replace(/\D/g, "")
    }

    // Query database for user's phone numbers
    const { data, error } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "purchased"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[LOOKUP-PATHWAY-API] ❌ Database error:", error)
      return NextResponse.json(
        {
          error: "Database query failed",
          details: error.message,
        },
        { status: 500 },
      )
    }

    if (!data || data.length === 0) {
      console.log("[LOOKUP-PATHWAY-API] ❌ No phone numbers found")
      return NextResponse.json({
        pathway_id: null,
        phone_record: null,
        message: "No phone numbers found for this user",
        success: false,
      })
    }

    console.log("[LOOKUP-PATHWAY-API] 📋 Found", data.length, "phone numbers")

    // Find matching phone number
    const targetNormalized = normalizePhone(phone)
    let matchingPhone = null

    for (const phoneRecord of data) {
      // Exact match
      if (phoneRecord.number === phone) {
        matchingPhone = phoneRecord
        break
      }

      // Normalized match
      const storedNormalized = normalizePhone(phoneRecord.number)
      if (targetNormalized === storedNormalized) {
        matchingPhone = phoneRecord
        break
      }

      // Country code variations
      if (targetNormalized.length === 10 && storedNormalized === `1${targetNormalized}`) {
        matchingPhone = phoneRecord
        break
      }

      if (storedNormalized.length === 10 && targetNormalized === `1${storedNormalized}`) {
        matchingPhone = phoneRecord
        break
      }
    }

    if (matchingPhone) {
      console.log("[LOOKUP-PATHWAY-API] 🎯 Match found:", {
        number: matchingPhone.number,
        pathway_id: matchingPhone.pathway_id,
      })

      return NextResponse.json({
        pathway_id: matchingPhone.pathway_id || null,
        pathway_name: matchingPhone.pathway_name || null,
        pathway_description: matchingPhone.pathway_description || null,
        phone_record: matchingPhone,
        success: true,
      })
    } else {
      console.log("[LOOKUP-PATHWAY-API] ❌ No matching phone found")
      return NextResponse.json({
        pathway_id: null,
        phone_record: null,
        message: "No matching phone number found",
        success: false,
      })
    }
  } catch (error) {
    console.error("[LOOKUP-PATHWAY-API] ❌ Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}
