import { supabase } from "./supabase"

// Test database connection
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from("users").select("count").limit(1)

    if (error) {
      console.error("Database connection error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Database connection test failed:", error)
    return false
  }
}

// User functions
export async function getUserById(id: string) {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching user:", error)
    return null
  }

  return data
}

// Team functions
export async function getTeamsByUserId(userId: string) {
  // Get teams where user is owner
  const { data: ownedTeams, error: ownedError } = await supabase
    .from("teams")
    .select(`
      *,
      owner:users!teams_owner_id_fkey(id, name, email),
      members:team_members(
        id, role,
        user:users(id, name, email)
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
      teams(
        *,
        owner:users!teams_owner_id_fkey(id, name, email),
        members:team_members(
          id, role,
          user:users(id, name, email)
        )
      )
    `)
    .eq("user_id", userId)

  if (memberError) {
    console.error("Error fetching member teams:", memberError)
    return ownedTeams || []
  }

  // Combine and deduplicate teams
  const memberTeamsData = memberTeams?.map((item) => item.teams) || []
  const allTeams = [...(ownedTeams || []), ...(memberTeamsData || [])]

  // Remove duplicates by team ID
  const uniqueTeams = allTeams.filter((team, index, self) => index === self.findIndex((t) => t.id === team.id))

  return uniqueTeams
}

// Pathway functions
export async function getPathwaysByUserId(userId: string) {
  // Get pathways created by user
  const { data: ownedPathways, error: ownedError } = await supabase
    .from("pathways")
    .select(`
      *,
      team:teams(*),
      creator:users!pathways_creator_id_fkey(id, name),
      updater:users!pathways_updater_id_fkey(id, name)
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
      team:teams(*),
      creator:users!pathways_creator_id_fkey(id, name),
      updater:users!pathways_updater_id_fkey(id, name)
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

// Activity logging
export async function logActivity(pathwayId: string, userId: string, action: string, details?: any) {
  const { error } = await supabase.from("activities").insert({
    pathway_id: pathwayId,
    user_id: userId,
    action,
    details: details || null,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error logging activity:", error)
  }
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
