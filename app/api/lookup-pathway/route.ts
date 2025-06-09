import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get("phone")

    if (!phone || phone === "undefined" || phone === "null") {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 })
    }

    // Get user with better error handling
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error in lookup-pathway:", authError)
      return NextResponse.json({ error: "Authentication failed", details: authError.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "No authenticated user found" }, { status: 401 })
    }

    const normalizePhone = (num: string) => num.replace(/\D/g, "")

    const { data: phones, error: dbError } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "purchased"])
      .order("created_at", { ascending: false })

    if (dbError) {
      console.error("Database error in lookup-pathway:", dbError)
      return NextResponse.json({ error: "Database query failed", details: dbError.message }, { status: 500 })
    }

    const target = normalizePhone(phone)
    const match = phones?.find((p) => {
      const stored = normalizePhone(p.number)
      return p.number === phone || stored === target || `1${target}` === stored || `1${stored}` === target
    })

    if (!match) {
      return NextResponse.json(
        {
          message: "No matching phone number found",
          available_numbers: phones?.map((p) => p.number) || [],
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      pathway_id: match.pathway_id || null,
      pathway_name: match.pathway_name || null,
      pathway_description: match.pathway_description || null,
      phone_record: match,
      success: true,
    })
  } catch (error) {
    console.error("Unexpected error in lookup-pathway:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
