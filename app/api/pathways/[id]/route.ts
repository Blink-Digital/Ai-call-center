import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-utils"
import { getPathwayById, updatePathway, deletePathway, canEditPathway, canViewPathway } from "@/lib/db-utils"

// Get a specific pathway
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pathwayId = params.id

    // Check if user has access to this pathway
    const hasAccess = await canViewPathway(pathwayId, user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have access to this pathway" }, { status: 403 })
    }

    const pathway = await getPathwayById(pathwayId)
    if (!pathway) {
      return NextResponse.json({ error: "Pathway not found" }, { status: 404 })
    }

    return NextResponse.json({ pathway })
  } catch (error) {
    console.error("Error fetching pathway:", error)
    return NextResponse.json({ error: "Failed to fetch pathway" }, { status: 500 })
  }
}

// Update a pathway
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pathwayId = params.id
    const { name, description, teamId, data } = await req.json()

    // Check if user has permission to edit this pathway
    const hasAccess = await canEditPathway(pathwayId, user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have permission to update this pathway" }, { status: 403 })
    }

    await updatePathway(pathwayId, user.id, { name, description, teamId, data })
    const updatedPathway = await getPathwayById(pathwayId)

    return NextResponse.json({ pathway: updatedPathway })
  } catch (error) {
    console.error("Error updating pathway:", error)
    return NextResponse.json({ error: "Failed to update pathway" }, { status: 500 })
  }
}

// Delete a pathway
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pathwayId = params.id

    // Check if user has permission to delete this pathway
    const hasAccess = await canEditPathway(pathwayId, user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have permission to delete this pathway" }, { status: 403 })
    }

    await deletePathway(pathwayId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting pathway:", error)
    return NextResponse.json({ error: "Failed to delete pathway" }, { status: 500 })
  }
}
