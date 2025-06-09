import { supabase } from "./supabase"
import { v4 as uuidv4 } from "uuid"

// Team functions
export async function createTeam(name: string, description: string | null, ownerId: string) {
  const teamId = uuidv4()

  // Create the team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      id: teamId,
      name,
      description,
      owner_id: ownerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (teamError) {
    console.error("Error creating team:", teamError)
    throw new Error("Failed to create team")
  }

  // Add the owner as a team member with admin role
  const { error: memberError } = await supabase.from("team_members").insert({
    id: uuidv4(),
    team_id: teamId,
    user_id: ownerId,
    role: "admin",
    joined_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (memberError) {
    console.error("Error adding team member:", memberError)
    throw new Error("Failed to add team owner as member")
  }

  return team
}

export async function getTeamsByUserId(userId: string) {
  // Get teams where user is owner
  const { data: ownedTeams, error: ownedError } = await supabase
    .from("teams")
    .select(`
      *,
      owner:owner_id(id, name, email),
      members:team_members(
        id, role,
        user:user_id(id, name, email)
      )
    `)
    .eq("owner_id", userId)

  if (ownedError) {
    console.error("Error fetching owned teams:", ownedError)
    return []
  }

  // Get teams where user is a member
  const { data: memberTeams, error: memberError } = await supabase
    .from("team_members")
    .select(`
      team:team_id(
        *,
        owner:owner_id(id, name, email),
        members:team_members(
          id, role,
          user:user_id(id, name, email)
        )
      )
    `)
    .eq("user_id", userId)

  if (memberError) {
    console.error("Error fetching member teams:", memberError)
    return ownedTeams || []
  }

  // Combine and deduplicate teams
  const memberTeamsData = memberTeams?.map((item) => item.team) || []
  const allTeams = [...(ownedTeams || []), ...(memberTeamsData || [])]

  // Remove duplicates by team ID
  const uniqueTeams = allTeams.filter((team, index, self) => index === self.findIndex((t) => t.id === team.id))

  return uniqueTeams
}

export async function getTeamById(teamId: string) {
  const { data: team, error } = await supabase
    .from("teams")
    .select(`
      *,
      owner:owner_id(id, name, email),
      members:team_members(
        id, role,
        user:user_id(id, name, email)
      ),
      pathways(
        id, name, description, created_at, updated_at,
        creator:creator_id(id, name),
        updater:updater_id(id, name)
      )
    `)
    .eq("id", teamId)
    .single()

  if (error) {
    console.error("Error fetching team:", error)
    return null
  }

  return team
}

export async function updateTeam(teamId: string, data: { name?: string; description?: string }) {
  const { error } = await supabase
    .from("teams")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", teamId)

  if (error) {
    console.error("Error updating team:", error)
    throw new Error("Failed to update team")
  }

  return true
}

export async function deleteTeam(teamId: string) {
  const { error } = await supabase.from("teams").delete().eq("id", teamId)

  if (error) {
    console.error("Error deleting team:", error)
    throw new Error("Failed to delete team")
  }

  return true
}

// Team members functions
export async function addTeamMember(teamId: string, userId: string, role = "editor") {
  const { error } = await supabase.from("team_members").insert({
    id: uuidv4(),
    team_id: teamId,
    user_id: userId,
    role,
    joined_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error adding team member:", error)
    throw new Error("Failed to add team member")
  }

  return true
}

export async function updateTeamMemberRole(teamId: string, userId: string, role: string) {
  const { error } = await supabase
    .from("team_members")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("team_id", teamId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error updating team member role:", error)
    throw new Error("Failed to update team member role")
  }

  return true
}

export async function removeTeamMember(teamId: string, userId: string) {
  const { error } = await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", userId)

  if (error) {
    console.error("Error removing team member:", error)
    throw new Error("Failed to remove team member")
  }

  return true
}

// Invitation functions
export async function createInvitation(teamId: string, email: string, role = "editor") {
  const token = uuidv4()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

  const { error } = await supabase.from("invitations").insert({
    id: uuidv4(),
    team_id: teamId,
    email: email.toLowerCase(),
    role,
    token,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
    accepted: false,
  })

  if (error) {
    console.error("Error creating invitation:", error)
    throw new Error("Failed to create invitation")
  }

  return { token }
}

export async function getInvitationByToken(token: string) {
  const { data, error } = await supabase
    .from("invitations")
    .select(`
      *,
      team:team_id(
        id, name, description,
        owner:owner_id(id, name, email)
      )
    `)
    .eq("token", token)
    .single()

  if (error) {
    console.error("Error fetching invitation:", error)
    return null
  }

  return data
}

export async function acceptInvitation(token: string, userId: string) {
  // Get the invitation
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single()

  if (invitationError || !invitation) {
    console.error("Error fetching invitation:", invitationError)
    throw new Error("Invitation not found")
  }

  // Check if invitation has expired
  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error("Invitation has expired")
  }

  // Check if invitation has already been accepted
  if (invitation.accepted) {
    throw new Error("Invitation has already been accepted")
  }

  // Add user to team
  const { error: memberError } = await supabase.from("team_members").insert({
    id: uuidv4(),
    team_id: invitation.team_id,
    user_id: userId,
    role: invitation.role,
    joined_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (memberError) {
    console.error("Error adding team member:", memberError)
    throw new Error("Failed to add user to team")
  }

  // Mark invitation as accepted
  const { error: updateError } = await supabase.from("invitations").update({ accepted: true }).eq("id", invitation.id)

  if (updateError) {
    console.error("Error updating invitation:", updateError)
    // Continue anyway since the user was added to the team
  }

  return true
}

// Pathway functions
export async function createPathway(data: {
  name: string
  description?: string
  teamId?: string
  creatorId: string
  data?: any
}) {
  const { name, description, teamId, creatorId, data: pathwayData } = data

  const { data: pathway, error } = await supabase
    .from("pathways")
    .insert({
      id: uuidv4(),
      name,
      description,
      team_id: teamId,
      creator_id: creatorId,
      updater_id: creatorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      data: pathwayData || {},
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating pathway:", error)
    throw new Error("Failed to create pathway")
  }

  // Log activity
  await logActivity(pathway.id, creatorId, "created")

  return pathway
}

export async function getPathwaysByUserId(userId: string) {
  // Get pathways created by user
  const { data: ownedPathways, error: ownedError } = await supabase
    .from("pathways")
    .select(`
      *,
      team:team_id(*),
      creator:creator_id(id, name),
      updater:updater_id(id, name)
    `)
    .eq("creator_id", userId)

  if (ownedError) {
    console.error("Error fetching owned pathways:", ownedError)
    return []
  }

  // Get pathways from teams user belongs to
  const { data: teamIds, error: teamError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)

  if (teamError) {
    console.error("Error fetching team IDs:", teamError)
    return ownedPathways || []
  }

  if (!teamIds || teamIds.length === 0) {
    return ownedPathways || []
  }

  const teamIdArray = teamIds.map((item) => item.team_id)

  const { data: teamPathways, error: pathwayError } = await supabase
    .from("pathways")
    .select(`
      *,
      team:team_id(*),
      creator:creator_id(id, name),
      updater:updater_id(id, name)
    `)
    .in("team_id", teamIdArray)

  if (pathwayError) {
    console.error("Error fetching team pathways:", pathwayError)
    return ownedPathways || []
  }

  // Combine and deduplicate pathways
  const allPathways = [...(ownedPathways || []), ...(teamPathways || [])]

  // Remove duplicates by pathway ID
  const uniquePathways = allPathways.filter(
    (pathway, index, self) => index === self.findIndex((p) => p.id === pathway.id),
  )

  return uniquePathways
}

export async function getPathwayById(pathwayId: string) {
  const { data, error } = await supabase
    .from("pathways")
    .select(`
      *,
      team:team_id(*),
      creator:creator_id(id, name),
      updater:updater_id(id, name)
    `)
    .eq("id", pathwayId)
    .single()

  if (error) {
    console.error("Error fetching pathway:", error)
    return null
  }

  return data
}

export async function updatePathway(
  pathwayId: string,
  updaterId: string,
  data: { name?: string; description?: string; teamId?: string; data?: any },
) {
  const updateData: any = {
    updater_id: updaterId,
    updated_at: new Date().toISOString(),
  }

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.teamId !== undefined) updateData.team_id = data.teamId
  if (data.data !== undefined) updateData.data = data.data

  const { error } = await supabase.from("pathways").update(updateData).eq("id", pathwayId)

  if (error) {
    console.error("Error updating pathway:", error)
    throw new Error("Failed to update pathway")
  }

  // Log activity
  await logActivity(pathwayId, updaterId, "updated", {
    nameChanged: data.name !== undefined,
    descriptionChanged: data.description !== undefined,
    teamChanged: data.teamId !== undefined,
    dataChanged: data.data !== undefined,
  })

  return true
}

export async function deletePathway(pathwayId: string) {
  const { error } = await supabase.from("pathways").delete().eq("id", pathwayId)

  if (error) {
    console.error("Error deleting pathway:", error)
    throw new Error("Failed to delete pathway")
  }

  return true
}

// Activity logging
export async function logActivity(pathwayId: string, userId: string, action: string, details?: any) {
  const { error } = await supabase.from("activities").insert({
    id: uuidv4(),
    pathway_id: pathwayId,
    user_id: userId,
    action,
    details: details || null,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error logging activity:", error)
    // Don't throw error for activity logging failures
  }
}

export async function getActivitiesByPathwayId(pathwayId: string, limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from("activities")
    .select(`
      *,
      user:user_id(id, name, email)
    `)
    .eq("pathway_id", pathwayId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching activities:", error)
    return []
  }

  return data
}

// Permission checking
export async function checkTeamPermission(teamId: string, userId: string, allowedRoles: string[]): Promise<boolean> {
  // Check if user is team owner
  const { data: team, error: teamError } = await supabase.from("teams").select("owner_id").eq("id", teamId).single()

  if (teamError) {
    console.error("Error checking team ownership:", teamError)
    return false
  }

  if (team.owner_id === userId) {
    return true // Team owner has all permissions
  }

  // Check if user is a member with allowed role
  const { data: membership, error: memberError } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single()

  if (memberError) {
    console.error("Error checking team membership:", memberError)
    return false
  }

  return membership && allowedRoles.includes(membership.role)
}

export async function canViewPathway(pathwayId: string, userId: string): Promise<boolean> {
  // Get the pathway
  const { data: pathway, error: pathwayError } = await supabase
    .from("pathways")
    .select("creator_id, team_id")
    .eq("id", pathwayId)
    .single()

  if (pathwayError) {
    console.error("Error checking pathway access:", pathwayError)
    return false
  }

  // If user is the creator, they can view it
  if (pathway.creator_id === userId) {
    return true
  }

  // If pathway doesn't belong to a team, only the creator can view it
  if (!pathway.team_id) {
    return false
  }

  // Check if user is a member of the team
  const { data: membership, error: memberError } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", pathway.team_id)
    .eq("user_id", userId)
    .single()

  if (memberError) {
    console.error("Error checking team membership:", memberError)
    return false
  }

  return !!membership // User can view if they are a member of the team
}

export async function canEditPathway(pathwayId: string, userId: string): Promise<boolean> {
  // Get the pathway
  const { data: pathway, error: pathwayError } = await supabase
    .from("pathways")
    .select("creator_id, team_id")
    .eq("id", pathwayId)
    .single()

  if (pathwayError) {
    console.error("Error checking pathway access:", pathwayError)
    return false
  }

  // If user is the creator, they can edit it
  if (pathway.creator_id === userId) {
    return true
  }

  // If pathway doesn't belong to a team, only the creator can edit it
  if (!pathway.team_id) {
    return false
  }

  // Check if user is a team owner
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", pathway.team_id)
    .single()

  if (teamError) {
    console.error("Error checking team ownership:", teamError)
    return false
  }

  if (team.owner_id === userId) {
    return true // Team owner can edit all team pathways
  }

  // Check if user is a member with edit permissions
  const { data: membership, error: memberError } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", pathway.team_id)
    .eq("user_id", userId)
    .single()

  if (memberError) {
    console.error("Error checking team membership:", memberError)
    return false
  }

  return membership && ["admin", "editor"].includes(membership.role)
}
