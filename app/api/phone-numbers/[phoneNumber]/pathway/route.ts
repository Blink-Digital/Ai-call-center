import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest, { params }: { params: { phoneNumber: string } }) {
  try {
    const { phoneNumber } = params
    const { pathwayId, pathwayName, pathwayDescription, userId, updateTimestamp } = await request.json()

    if (!phoneNumber || !pathwayId || !userId) {
      return NextResponse.json({ error: "Missing required fields: phoneNumber, pathwayId, or userId" }, { status: 400 })
    }

    console.log("🔗 [PATHWAY-LINK] Processing pathway operation:", {
      phoneNumber,
      pathwayId,
      userId,
      updateTimestamp: !!updateTimestamp,
    })

    // Prepare update data
    const updateData: any = {
      pathway_id: pathwayId,
    }

    // Only update these fields if not just updating timestamp
    if (!updateTimestamp) {
      updateData.pathway_name = pathwayName || null
      updateData.pathway_description = pathwayDescription || null
    }

    // Always update deployment timestamp
    updateData.last_deployed_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("phone_numbers")
      .update(updateData)
      .eq("number", phoneNumber)
      .eq("user_id", userId) // Ensure user can only update their own numbers
      .select()

    if (error) {
      console.error("❌ [PATHWAY-LINK] Database error:", error)
      return NextResponse.json({ error: "Failed to update phone number with pathway information" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ [PATHWAY-LINK] Phone number not found or not owned by user")
      return NextResponse.json({ error: "Phone number not found or not owned by user" }, { status: 404 })
    }

    const message = updateTimestamp
      ? "Deployment timestamp updated successfully"
      : "Pathway linked to phone number successfully"

    console.log("✅ [PATHWAY-LINK]", message)

    return NextResponse.json({
      success: true,
      message,
      data: data[0],
    })
  } catch (error) {
    console.error("❌ [PATHWAY-LINK] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { phoneNumber: string } }) {
  try {
    const { phoneNumber } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!phoneNumber || !userId) {
      return NextResponse.json({ error: "Missing required parameters: phoneNumber or userId" }, { status: 400 })
    }

    // Get pathway information for the phone number
    const { data, error } = await supabase
      .from("phone_numbers")
      .select("pathway_id, pathway_name, pathway_description, last_deployed_at")
      .eq("number", phoneNumber)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching pathway info:", error)
      return NextResponse.json({ error: "Failed to fetch pathway information" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error in pathway fetch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
