"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Settings, Trash2, UserPlus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context" // ✅ Use modern auth context
import { toast } from "@/components/ui/use-toast"
import { CreateTeamDialog } from "./create-team-dialog"
import { useRouter } from "next/navigation"
import { useSupabaseBrowser } from "@/lib/supabase-browser" // ✅ Import singleton
import { Skeleton } from "@/components/ui/skeleton"

interface Team {
  id: string
  name: string
  description: string | null
  created_at: string
  member_count: number
  role: "owner" | "admin" | "member"
}

export function TeamsClient() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = useSupabaseBrowser() // ✅ Use singleton instead of creating new instance
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    async function loadTeams() {
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

        // Fetch teams where user is a member
        const { data: memberTeams, error: memberError } = await supabase
          .from("team_members")
          .select("team_id, teams(*)")
          .eq("user_id", user.id)

        if (memberError) {
          console.error("Error fetching team memberships:", memberError)
          setError("Failed to load your teams. Please try again later.")
          return
        }

        // Fetch teams created by the user
        const { data: ownerTeams, error: ownerError } = await supabase
          .from("teams")
          .select("*")
          .eq("creator_id", user.id)

        if (ownerError) {
          console.error("Error fetching owned teams:", ownerError)
          setError("Failed to load your teams. Please try again later.")
          return
        }

        // Combine and deduplicate teams
        const memberTeamsData = memberTeams ? memberTeams.map((membership) => membership.teams) : []
        const allTeams = [...(ownerTeams || []), ...memberTeamsData]

        // Remove duplicates by team ID
        const uniqueTeams = Array.from(new Map(allTeams.map((team) => [team.id, team])).values())

        setTeams(uniqueTeams)
      } catch (error) {
        console.error("Error loading teams:", error)
        setError("An unexpected error occurred. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (user && !authLoading) {
      loadTeams()
    }
  }, [supabase, user, authLoading])

  const handleCreateTeam = async (newTeam: any) => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("No user found")
        return
      }

      // Insert new team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: newTeam.name,
          description: newTeam.description,
          creator_id: user.id,
        })
        .select()
        .single()

      if (teamError) {
        console.error("Error creating team:", teamError)
        return
      }

      // Add creator as a member with admin role
      const { error: memberError } = await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        role: "admin",
      })

      if (memberError) {
        console.error("Error adding team member:", memberError)
        return
      }

      // Update local state
      setTeams([...teams, team])
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error in handleCreateTeam:", error)
    }
  }

  const handleViewTeam = (teamId: string) => {
    router.push(`/dashboard/teams/${teamId}`)
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return
    }

    try {
      // ✅ Use secure API route with automatic cookie-based auth
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ Include cookies for authentication
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.")
        }
        throw new Error(`Failed to delete team: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setTeams((prev) => prev.filter((team) => team.id !== teamId))
        toast({
          title: "Team deleted",
          description: "Team has been deleted successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to delete team")
      }
    } catch (error) {
      console.error("Error deleting team:", error)
      toast({
        title: "Error deleting team",
        description: error instanceof Error ? error.message : "Failed to delete team",
        variant: "destructive",
      })
    }
  }

  const handleInviteMember = (teamId: string) => {
    // Logic for handling invite member
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge variant="default" className="bg-purple-100 text-purple-800">
            Owner
          </Badge>
        )
      case "admin":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Admin
          </Badge>
        )
      case "member":
        return <Badge variant="secondary">Member</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to view teams.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Teams</h2>
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-[150px] mb-2" />
                <Skeleton className="h-4 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
                <div className="mt-4">
                  <Skeleton className="h-9 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Teams</h2>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Team
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
        <CreateTeamDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreateTeam={handleCreateTeam}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Teams</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Teams Yet</CardTitle>
            <CardDescription>Create a team to collaborate with others on call flows and phone numbers</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground mb-4">
              Teams allow you to collaborate with others on call flows and share phone numbers
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
                <CardDescription>Created {new Date(team.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{team.description || "No description provided"}</p>
                <Button variant="outline" className="w-full" onClick={() => handleViewTeam(team.id)}>
                  View Team
                </Button>
                {(team.role === "owner" || team.role === "admin") && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handleInviteMember(team.id)}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/teams/${team.id}`)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {team.role === "owner" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTeam(team.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTeam={handleCreateTeam}
      />
    </div>
  )
}
