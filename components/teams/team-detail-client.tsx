"use client"

import { CardDescription } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Trash2, UserPlus, Edit, Save, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TeamMembersList } from "./team-members-list"
import { InviteMemberDialog } from "./invite-member-dialog"
import { TeamPathwaysList } from "./team-pathways-list"
import { useAuth } from "@/contexts/auth-context"

interface Team {
  id: string
  name: string
  description: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string
    email: string
  }
  members: {
    id: string
    role: string
    user: {
      id: string
      name: string
      email: string
    }
  }[]
  pathways: {
    id: string
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
    creator: {
      id: string
      name: string
    }
    updater: {
      id: string
      name: string
    }
  }[]
}

interface TeamDetailClientProps {
  teamId: string
}

export function TeamDetailClient({ teamId }: TeamDetailClientProps) {
  const [team, setTeam] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    fetchTeam()
  }, [teamId])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teams/${teamId}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Team not found",
            description: "The team you're looking for doesn't exist or you don't have access to it.",
            variant: "destructive",
          })
          router.push("/dashboard/teams")
          return
        }
        throw new Error("Failed to fetch team")
      }

      const data = await response.json()
      setTeam(data.team)
      setName(data.team.name)
      setDescription(data.team.description || "")
    } catch (error) {
      console.error("Error fetching team:", error)
      toast({
        title: "Error",
        description: "Failed to load team details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      })

      if (!response.ok) {
        throw new Error("Failed to update team")
      }

      const data = await response.json()
      setTeam({ ...team!, ...data.team })

      toast({
        title: "Team Updated",
        description: "Team details have been updated successfully.",
      })

      setEditing(false)
    } catch (error) {
      console.error("Error updating team:", error)
      toast({
        title: "Error",
        description: "Failed to update team. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete team")
      }

      toast({
        title: "Team Deleted",
        description: "The team has been deleted successfully.",
      })

      router.push("/dashboard/teams")
    } catch (error) {
      console.error("Error deleting team:", error)
      toast({
        title: "Error",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleInviteMember = async (email: string, role: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      })

      if (!response.ok) {
        throw new Error("Failed to invite member")
      }

      const data = await response.json()

      if (data.invitation) {
        toast({
          title: "Invitation Sent",
          description: `An invitation has been sent to ${email}.`,
        })
      } else if (data.member) {
        // Refresh team data to show the new member
        fetchTeam()
        toast({
          title: "Member Added",
          description: `${email} has been added to the team.`,
        })
      }

      setInviteDialogOpen(false)
    } catch (error) {
      console.error("Error inviting member:", error)
      toast({
        title: "Error",
        description: "Failed to invite member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const isOwner = team && user ? team.ownerId === user.id : false
  const isAdmin =
    team && user ? isOwner || team.members.some((m) => m.user.id === user.id && m.role === "admin") : false

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200"></div>
              </CardHeader>
              <CardContent>
                <div className="h-24 animate-pulse rounded bg-gray-200"></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded bg-gray-200"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded bg-gray-200"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
        <p className="text-gray-500 mb-6">The team you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => router.push("/dashboard/teams")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teams
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/teams")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Button>
          <h1 className="text-2xl font-bold">{team.name}</h1>
        </div>
        {isAdmin && (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDeleteTeam}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Details</CardTitle>
                <CardDescription>Basic information about your team</CardDescription>
              </div>
              {isAdmin && !editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              {editing && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(false)
                      setName(team.name)
                      setDescription(team.description || "")
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleUpdateTeam}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Team Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1">{team.description || "No description provided."}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                    <p className="mt-1">
                      {team.owner.name} ({team.owner.email})
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created On</h3>
                    <p className="mt-1">{new Date(team.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="pathways">
            <TabsList>
              <TabsTrigger value="pathways">Pathways</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>
            <TabsContent value="pathways" className="mt-4">
              <TeamPathwaysList teamId={teamId} pathways={team.pathways} isAdmin={isAdmin} />
            </TabsContent>
            <TabsContent value="members" className="mt-4">
              <TeamMembersList
                teamId={teamId}
                members={team.members}
                ownerId={team.ownerId}
                currentUserId={user?.id || ""}
                onMemberUpdated={fetchTeam}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Team Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Total Members</span>
                  <span className="text-lg font-semibold">{team.members.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Total Pathways</span>
                  <span className="text-lg font-semibold">{team.pathways.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Created</span>
                  <span className="text-sm">{new Date(team.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Last Updated</span>
                  <span className="text-sm">{new Date(team.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <InviteMemberDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} onInvite={handleInviteMember} />
    </div>
  )
}
