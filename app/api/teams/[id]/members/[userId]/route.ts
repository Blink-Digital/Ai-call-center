import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-utils"
import { checkTeamPermission, updateTeamMemberRole, removeTeamMember } from "@/lib/db-utils"
import { supabase } from "@/lib/supabase"

// Update a team member's role
export async function PUT(req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = params.id
    const memberId = params.userId
    const { role } = await req.json()

    // Check if user is the owner or admin
    const hasAccess = await checkTeamPermission(teamId, user.id, ["admin"])
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have permission to update member roles" }, { status: 403 })
    }

    // Get the team to check if the user being updated is the owner
    const { data: team, error: teamError } = await supabase.from("teams").select("owner_id").eq("id", teamId).single()

    if (teamError) {
      console.error("Error fetching team:", teamError)
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Cannot change the role of the team owner
    if (team.owner_id === memberId) {
      return NextResponse.json({ error: "Cannot change the role of the team owner" }, { status: 400 })
    }

    await updateTeamMemberRole(teamId, memberId, role)

    // Get the updated member
    const { data: member, error } = await supabase
      .from("team_members")
      .select(`
        *,
        user:user_id(id, name, email)
      `)
      .eq("team_id", teamId)
      .eq("user_id", memberId)
      .single()

    if (error) {
      console.error("Error fetching updated member:", error)
      return NextResponse.json({ error: "Failed to fetch updated member" }, { status: 500 })
    }

    return NextResponse.json({ member })
  } catch (error) {
    console.error("Error updating team member:", error)
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 })
  }
}

// Remove a member from a team
export async function DELETE(req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = params.id
    const memberId = params.userId

    // Check if user is the owner or admin
    const hasAccess = await checkTeamPermission(teamId, user.id, ["admin"])
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have permission to remove members" }, { status: 403 })
    }

    // Get the team to check if the user being removed is the owner
    const { data: team, error: teamError } = await supabase.from("teams").select("owner_id").eq("id", teamId).single()

    if (teamError) {
      console.error("Error fetching team:", teamError)
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Cannot remove the team owner
    if (team.owner_id === memberId) {
      return NextResponse.json({ error: "Cannot remove the team owner" }, { status: 400 })
    }

    await removeTeamMember(teamId, memberId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 })
  }
}
