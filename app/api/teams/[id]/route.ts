import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-utils"
import { getTeamById, updateTeam, deleteTeam, checkTeamPermission } from "@/lib/db-utils"

// Get a specific team
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = params.id

    // Check if user has access to this team
    const hasAccess = await checkTeamPermission(teamId, user.id, ["admin", "editor", "viewer"])
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have access to this team" }, { status: 403 })
    }

    const team = await getTeamById(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json({ team })
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 })
  }
}

// Update a team
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = params.id
    const { name, description } = await req.json()

    // Check if user is the owner or admin
    const hasAccess = await checkTeamPermission(teamId, user.id, ["admin"])
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have permission to update this team" }, { status: 403 })
    }

    await updateTeam(teamId, { name, description })
    const updatedTeam = await getTeamById(teamId)

    return NextResponse.json({ team: updatedTeam })
  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
  }
}

// Delete a team
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = params.id

    // Check if user is the owner
    const team = await getTeamById(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    if (team.owner.id !== user.id) {
      return NextResponse.json({ error: "Only the team owner can delete the team" }, { status: 403 })
    }

    await deleteTeam(teamId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 })
  }
}
