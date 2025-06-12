"use client"

import { useState, useEffect } from "react"
import { useSupabaseBrowser } from "@/lib/supabase-browser" // ✅ Import singleton
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { TeamMembersList } from "@/components/teams/team-members-list"
import { TeamPathwaysList } from "@/components/teams/team-pathways-list"
import { InviteMemberDialog } from "@/components/teams/invite-member-dialog"
import { ArrowLeft, UserPlus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TeamDetailClient({ teamId }: { teamId: string }) {
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [pathways, setPathways] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useSupabaseBrowser() // ✅ Use singleton instead of creating new instance

  useEffect(() => {
    async function loadTeamData() {
      try {
        setLoading(true)
        setError(null)

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error("Error getting user:", userError)
          setError("Authentication error. Please try logging in again.")
          return
        }

        if (!user) {
          console.error("No user found")
          setError("No authenticated user found. Please log in.")
          return
        }

        // Fetch team details
        const { data: teamData, error: teamError } = await supabase.from("teams").select("*").eq("id", teamId).single()

        if (teamError) {
          console.error("Error fetching team:", teamError)
          setError("Failed to load team details. Please try again later.")
          return
        }

        setTeam(teamData)

        // Fetch team members with user profiles
        const { data: membersData, error: membersError } = await supabase
          .from("team_members")
          .select(`
            id, 
            role, 
            created_at,
            user_id,
            users:user_id (
              email,
              id
            )
          `)
          .eq("team_id", teamId)

        if (membersError) {
          console.error("Error fetching team members:", membersError)
          setError("Failed to load team members. Please try again later.")
          return
        }

        setMembers(membersData || [])

        // Find current user's role in the team
        const currentMember = membersData?.find((m) => m.user_id === user.id)
        setCurrentUserRole(currentMember?.role || null)

        // If user is not a member of this team, redirect to teams page
        if (!currentMember) {
          console.error("User is not a member of this team")
          setError("You do not have access to this team.")
          router.push("/dashboard/teams")
          return
        }

        // Fetch team pathways
        const { data: pathwaysData, error: pathwaysError } = await supabase
          .from("pathways")
          .select("*")
          .eq("team_id", teamId)

        if (pathwaysError) {
          console.error("Error fetching team pathways:", pathwaysError)
          setError("Failed to load team pathways. Please try again later.")
          return
        }

        setPathways(pathwaysData || [])
      } catch (error) {
        console.error("Error loading team data:", error)
        setError("An unexpected error occurred. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (teamId) {
      loadTeamData()
    }
  }, [teamId, supabase, router])

  const handleInviteMember = async (email: string, role: string) => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("No user found")
        return
      }

      // Check if user has admin permissions
      if (currentUserRole !== "admin") {
        console.error("User does not have admin permissions")
        return
      }

      // Find user by email
      const { data: userData, error: userError } = await supabase.from("users").select("id").eq("email", email).single()

      if (userError) {
        console.error("Error finding user by email:", userError)
        return
      }

      // Check if user is already a member
      const existingMember = members.find((m) => m.user_id === userData.id)
      if (existingMember) {
        console.error("User is already a member of this team")
        return
      }

      // Add user to team
      const { error: memberError } = await supabase.from("team_members").insert({
        team_id: teamId,
        user_id: userData.id,
        role,
      })

      if (memberError) {
        console.error("Error adding team member:", memberError)
        return
      }

      // Update local state
      const { data: newMember, error: fetchError } = await supabase
        .from("team_members")
        .select(`
          id, 
          role, 
          created_at,
          user_id,
          users:user_id (
            email,
            id
          )
        `)
        .eq("team_id", teamId)
        .eq("user_id", userData.id)
        .single()

      if (fetchError) {
        console.error("Error fetching new member:", fetchError)
      } else {
        setMembers([...members, newMember])
      }

      setIsInviteDialogOpen(false)
    } catch (error) {
      console.error("Error in handleInviteMember:", error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      // Check if user has admin permissions
      if (currentUserRole !== "admin") {
        console.error("User does not have admin permissions")
        return
      }

      // Remove member from team
      const { error } = await supabase.from("team_members").delete().eq("id", memberId)

      if (error) {
        console.error("Error removing team member:", error)
        return
      }

      // Update local state
      setMembers(members.filter((m) => m.id !== memberId))
    } catch (error) {
      console.error("Error in handleRemoveMember:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <Skeleton className="h-6 w-[300px] mb-4" />
        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="pathways">Pathways</TabsTrigger>
          </TabsList>
          <TabsContent value="members" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-[150px]" />
                  <Skeleton className="h-10 w-[150px]" />
                </div>
              </CardHeader>
              <CardContent>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b">
                    <div>
                      <Skeleton className="h-5 w-[200px] mb-1" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                    <Skeleton className="h-9 w-[100px]" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/teams")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Team Error</h2>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Team</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/teams")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">{team.name}</h2>
      </div>
      <p className="text-muted-foreground">{team.description || "No description provided"}</p>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="pathways">Pathways</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Team Members</CardTitle>
                {currentUserRole === "admin" && (
                  <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                  </Button>
                )}
              </div>
              <CardDescription>Manage team members and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMembersList
                members={members}
                currentUserRole={currentUserRole}
                onRemoveMember={handleRemoveMember}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pathways" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Pathways</CardTitle>
              <CardDescription>Call flows shared with this team</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamPathwaysList pathways={pathways} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInviteMember={handleInviteMember}
      />
    </div>
  )
}
