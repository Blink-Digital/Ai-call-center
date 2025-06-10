import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-utils"
import { createServiceClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Test data
    const testFlowchart = {
      nodes: [
        {
          id: "test-node-1",
          type: "greetingNode",
          position: { x: 100, y: 100 },
          data: { text: "Hello! This is a test greeting." },
        },
      ],
      edges: [],
    }

    const testPhoneNumber = "+1234567890"

    // Try to save a test flowchart
    const { data: existing } = await supabase
      .from("pathways")
      .select("id")
      .eq("phone_number", testPhoneNumber)
      .eq("creator_id", user.id)
      .maybeSingle()

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("pathways")
        .update({
          name: "Test Flowchart (Updated)",
          description: "Test description updated",
          data: testFlowchart,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: "Test flowchart updated successfully",
        action: "updated",
        pathway: data,
      })
    } else {
      // Insert new
      const { data, error } = await supabase
        .from("pathways")
        .insert({
          name: "Test Flowchart",
          description: "Test description",
          phone_number: testPhoneNumber,
          creator_id: user.id,
          updater_id: user.id,
          data: testFlowchart,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: "Test flowchart created successfully",
        action: "created",
        pathway: data,
      })
    }
  } catch (error) {
    console.error("Test save error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Test failed" }, { status: 500 })
  }
}
