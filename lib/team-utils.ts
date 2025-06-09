import { supabase } from "./supabase"

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
