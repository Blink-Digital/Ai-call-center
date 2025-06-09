"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Settings, Trash2, UserPlus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context" // ✅ Use modern auth context
import { toast } from "@/components/ui/use-toast"
import { CreateTeamDialog } from "./create-team-dialog"
import { InviteMemberDialog } from "./invite-member-dialog"
import { useRouter } from "next/navigation"

interface Team {
  id: string
  name: string
  description: string | null
  created_at: string
  member_count: number
  role: "owner" | "admin" | "member"
}

interface TeamsClientProps {
  initialTeams?: Team[]
}

export function TeamsClient({ initialTeams = [] }: TeamsClientProps) {
  // ✅ Use modern auth context instead of manual Supabase client
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  // ✅ Fetch teams when component mounts and user is authenticated
  useEffect(() => {
    if (user && !authLoading && initialTeams.length === 0) {
      fetchTeams()
    }
  }, [user, authLoading])

  // ✅ Show loading state while auth is loading
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

  // ✅ Show auth required state
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

  const fetchTeams = async () => {
    setLoading(true)
    setError(null)

    try {
      // ✅ Use secure API route with automatic cookie-based auth
      const response = await fetch("/api/teams", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ Include cookies for authentication
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.")
        }
        throw new Error(`Failed to fetch teams: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.teams)) {
        setTeams(data.teams)
      } else {
        throw new Error(data.error || "Invalid response format")
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch teams")
      toast({
        title: "Error loading teams",
        description: error instanceof Error ? error.message : "Failed to fetch teams",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (teamData: { name: string; description: string }) => {
    try {
      // ✅ Use secure API route with automatic cookie-based auth
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData),
        credentials: "include", // ✅ Include cookies for authentication
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.")
        }
        throw new Error(`Failed to create team: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setTeams((prev) => [...prev, data.team])
        setCreateDialogOpen(false)
        toast({
          title: "Team created",
          description: `Team "${teamData.name}" has been created successfully.`,
        })
      } else {
        throw new Error(data.error || "Failed to create team")
      }
    } catch (error) {
      console.error("Error creating team:", error)
      toast({
        title: "Error creating team",
        description: error instanceof Error ? error.message : "Failed to create team",
        variant: "destructive",
      })
    }
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
    setSelectedTeamId(teamId)
    setInviteDialogOpen(true)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teams</h2>
          <p className="text-gray-600">Manage your teams and collaborate with others</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTeams} disabled={loading} variant="outline">
            {loading ? "Loading..." : "Refresh"}
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Teams Grid */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No teams yet</h3>
                  <p className="mb-4">Create your first team to start collaborating.</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            teams.map((team) => (
              <Card key={team.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {team.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(team.role)}
                        <span className="text-sm text-gray-500">
                          {team.member_count} member{team.member_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
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
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {team.description && <CardDescription className="mb-3">{team.description}</CardDescription>}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Created {new Date(team.created_at).toLocaleDateString()}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/teams/${team.id}`)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateTeamDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onCreateTeam={handleCreateTeam} />

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        teamId={selectedTeamId}
        onInviteSent={() => {
          setInviteDialogOpen(false)
          setSelectedTeamId(null)
        }}
      />
    </div>
  )
}
