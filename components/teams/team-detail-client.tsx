"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Users, UserPlus, Edit, Save, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context" // ✅ Use modern auth context
import { toast } from "@/components/ui/use-toast"
import { TeamMembersList } from "./team-members-list"
import { TeamPathwaysList } from "./team-pathways-list"
import { InviteMemberDialog } from "./invite-member-dialog"
import { useRouter } from "next/navigation"

interface TeamMember {
  id: string
  email: string
  role: "owner" | "admin" | "member"
  joined_at: string
  user_id: string
}

interface TeamPathway {
  id: string
  name: string
  description: string | null
  phone_number: string
  created_at: string
  last_deployed_at: string | null
}

interface TeamDetailClientProps {
  teamId: string
  initialTeam?: {
    id: string
    name: string
    description: string | null
    created_at: string
    role: "owner" | "admin" | "member"
  }
  initialMembers?: TeamMember[]
  initialPathways?: TeamPathway[]
}

export function TeamDetailClient({
  teamId,
  initialTeam,
  initialMembers = [],
  initialPathways = [],
}: TeamDetailClientProps) {
  // ✅ Use modern auth context instead of manual Supabase client
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [team, setTeam] = useState(initialTeam)
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [pathways, setPathways] = useState<TeamPathway[]>(initialPathways)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: initialTeam?.name || "",
    description: initialTeam?.description || "",
  })
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  const canEdit = team?.role === "owner" || team?.role === "admin"
  const canManageMembers = team?.role === "owner" || team?.role === "admin"

  // ✅ Fetch team data when component mounts and user is authenticated
  useEffect(() => {
    if (user && !authLoading && !initialTeam) {
      fetchTeamData()
    }
  }, [user, authLoading, teamId])

  const fetchTeamData = async () => {
    setLoading(true)
    setError(null)

    try {
      // ✅ Use secure API route with automatic cookie-based auth
      const response = await fetch(`/api/teams/${teamId}`, {
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
        if (response.status === 404) {
          throw new Error("Team not found.")
        }
        throw new Error(`Failed to fetch team data: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setTeam(data.team)
        setMembers(data.members || [])
        setPathways(data.pathways || [])
        setEditForm({
          name: data.team.name,
          description: data.team.description || "",
        })
      } else {
        throw new Error(data.error || "Failed to fetch team data")
      }
    } catch (error) {
      console.error("Error fetching team data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch team data")
      toast({
        title: "Error loading team",
        description: error instanceof Error ? error.message : "Failed to fetch team data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTeam = async () => {
    try {
      // ✅ Use secure API route with automatic cookie-based auth
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
        credentials: "include", // ✅ Include cookies for authentication
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.")
        }
        throw new Error(`Failed to update team: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setTeam(data.team)
        setIsEditing(false)
        toast({
          title: "Team updated",
          description: "Team information has been updated successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to update team")
      }
    } catch (error) {
      console.error("Error updating team:", error)
      toast({
        title: "Error updating team",
        description: error instanceof Error ? error.message : "Failed to update team",
        variant: "destructive",
      })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the team?")) {
      return
    }

    try {
      // ✅ Use secure API route with automatic cookie-based auth
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
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
        throw new Error(`Failed to remove member: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setMembers((prev) => prev.filter((member) => member.id !== memberId))
        toast({
          title: "Member removed",
          description: "Member has been removed from the team.",
        })
      } else {
        throw new Error(data.error || "Failed to remove member")
      }
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        title: "Error removing member",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      // ✅ Use secure API route with automatic cookie-based auth
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
        credentials: "include", // ✅ Include cookies for authentication
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.")
        }
        throw new Error(`Failed to update member role: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setMembers((prev) =>
          prev.map((member) =>
            member.id === memberId ? { ...member, role: newRole as "owner" | "admin" | "member" } : member,
          ),
        )
        toast({
          title: "Role updated",
          description: "Member role has been updated successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to update member role")
      }
    } catch (error) {
      console.error("Error updating member role:", error)
      toast({
        title: "Error updating role",
        description: error instanceof Error ? error.message : "Failed to update member role",
        variant: "destructive",
      })
    }
  }

  // ✅ Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team details...</p>
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
          <p className="text-gray-600">Please log in to view team details.</p>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Team Not Found</h2>
          <p className="text-gray-600 mb-4">
            The team you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/dashboard/teams")}>Back to Teams</Button>
        </div>
      </div>
    )
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
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <div className="flex items-center gap-2">
              {getRoleBadge(team.role)}
              <span className="text-sm text-gray-500">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canManageMembers && (
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Team
            </Button>
          )}
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

      {/* Team Info */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>Created on {new Date(team.created_at).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateTeam}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setEditForm({
                      name: team.name,
                      description: team.description || "",
                    })
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-medium mb-2">{team.name}</h3>
              {team.description ? (
                <p className="text-gray-600">{team.description}</p>
              ) : (
                <p className="text-gray-400 italic">No description provided</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <TeamMembersList
        members={members}
        currentUserRole={team.role}
        onRemoveMember={handleRemoveMember}
        onUpdateRole={handleUpdateMemberRole}
      />

      {/* Pathways */}
      <TeamPathwaysList pathways={pathways} teamRole={team.role} />

      {/* Invite Dialog */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        teamId={teamId}
        onInviteSent={() => {
          setInviteDialogOpen(false)
          // Refresh team data to get updated member list
          fetchTeamData()
        }}
      />
    </div>
  )
}
