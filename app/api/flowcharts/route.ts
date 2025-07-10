import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-utils"
import { createClient } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phoneNumber, flowchartData, name, description } = await req.json()

    if (!phoneNumber || !flowchartData) {
      return NextResponse.json({ error: "Phone number and flowchart data are required" }, { status: 400 })
    }

    const supabase = createClient()

    const { data: existing, error: selectError } = await supabase
      .from("pathways")
      .select("id, name, description, created_at")
      .eq("phone_number", phoneNumber)
      .eq("creator_id", user.id)
      .maybeSingle()

    if (selectError) {
      console.error("Error checking existing flowchart:", selectError)
      return NextResponse.json(
        { error: "Failed to check existing flowchart", details: selectError.message },
        { status: 500 },
      )
    }

    const flowchartPayload = {
      name: name || "Bland.ai Pathway",
      description: description || `Flowchart for ${phoneNumber}`,
      phone_number: phoneNumber,
      creator_id: user.id,
      updater_id: user.id,
      data: flowchartData,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from("pathways")
        .update(flowchartPayload)
        .eq("id", existing.id)
        .select("id, name, description, phone_number, created_at, updated_at")
        .single()

      if (updateError) {
        console.error("Error updating flowchart:", updateError)
        return NextResponse.json({ error: "Failed to update flowchart", details: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        action: "updated",
        pathway: updated,
        message: `Flowchart for ${phoneNumber} updated successfully`,
      })
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("pathways")
        .insert({
          ...flowchartPayload,
          created_at: new Date().toISOString(),
        })
        .select("id, name, description, phone_number, created_at, updated_at")
        .single()

      if (insertError) {
        console.error("Error inserting flowchart:", insertError)

        if (insertError.code === "23505") {
          return NextResponse.json({ error: "A flowchart for this phone number already exists" }, { status: 409 })
        }

        return NextResponse.json({ error: "Failed to save flowchart", details: insertError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        action: "created",
        pathway: inserted,
        message: `Flowchart for ${phoneNumber} created successfully`,
      })
    }
  } catch (error) {
    console.error("Error in flowchart save:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const phoneNumber = searchParams.get("phoneNumber")

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const supabase = createClient()

    const { data: pathway, error } = await supabase
      .from("pathways")
      .select("id, name, description, phone_number, data, created_at, updated_at")
      .eq("phone_number", phoneNumber)
      .eq("creator_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("Error fetching flowchart:", error)
      return NextResponse.json({ error: "Failed to fetch flowchart", details: error.message }, { status: 500 })
    }

    if (!pathway) {
      return NextResponse.json({ error: "No flowchart found for this phone number" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      pathway,
    })
  } catch (error) {
    console.error("Error in flowchart fetch:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
