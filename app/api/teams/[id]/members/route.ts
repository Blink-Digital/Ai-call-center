import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-utils"
import { checkTeamPermission, addTeamMember, createInvitation } from "@/lib/db-utils"
import { supabase } from "@/lib/supabase"

// Get all members of a team
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

    // Get team members
    const { data: members, error } = await supabase
      .from("team_members")
      .select(`
        *,
        user:user_id(id, name, email)
      `)
      .eq("team_id", teamId)

    if (error) {
      console.error("Error fetching team members:", error)
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
    }

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
  }
}

// Add a member to a team
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = params.id
    const { email, role } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user is the owner or admin
    const hasAccess = await checkTeamPermission(teamId, user.id, ["admin"])
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have permission to add members to this team" }, { status: 403 })
    }

    // Check if the user exists
    const { data: userToAdd, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single()

    if (userError || !userToAdd) {
      // Create an invitation instead
      const { token } = await createInvitation(teamId, email, role || "editor")

      // TODO: Send invitation email

      return NextResponse.json(
        { message: "Invitation sent to " + email, invitation: { email, token } },
        { status: 201 },
      )
    }

    // Check if the user is already a member
    const { data: existingMember, error: memberError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userToAdd.id)
      .single()

    if (!memberError && existingMember) {
      return NextResponse.json({ error: "User is already a member of this team" }, { status: 400 })
    }

    // Add the user to the team
    await addTeamMember(teamId, userToAdd.id, role || "editor")

    // Get the member with user details
    const { data: member, error } = await supabase
      .from("team_members")
      .select(`
        *,
        user:user_id(id, name, email)
      `)
      .eq("team_id", teamId)
      .eq("user_id", userToAdd.id)
      .single()

    if (error) {
      console.error("Error fetching team member:", error)
      return NextResponse.json({ error: "Failed to fetch team member" }, { status: 500 })
    }

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error("Error adding team member:", error)
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 })
  }
}
