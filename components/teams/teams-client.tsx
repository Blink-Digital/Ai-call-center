"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Users, Trash2 } from "lucide-react"
import { CreateTeamDialog } from "./create-team-dialog"
import { useToast } from "@/components/ui/use-toast"

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
  _count: {
    pathways: number
  }
}

export function TeamsClient() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/teams")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Server response:", response.status, errorData)
        throw new Error(`Failed to fetch teams: ${response.status} ${errorData.error || ""}`)
      }

      const data = await response.json()
      setTeams(data.teams || [])
    } catch (error) {
      console.error("Error fetching teams:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load teams. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (name: string, description: string) => {
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      })

      if (!response.ok) {
        throw new Error("Failed to create team")
      }

      const data = await response.json()
      setTeams([...teams, data.team])

      toast({
        title: "Team Created",
        description: `Team "${name}" has been created successfully.`,
      })

      setCreateDialogOpen(false)
    } catch (error) {
      console.error("Error creating team:", error)
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
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

      setTeams(teams.filter((team) => team.id !== teamId))

      toast({
        title: "Team Deleted",
        description: "The team has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting team:", error)
      toast({
        title: "Error",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Teams</h2>
          <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Teams</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Teams Yet</h3>
            <p className="text-gray-500 mb-4">Create a team to collaborate with others on your pathways.</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{team.name}</CardTitle>
                <CardDescription>
                  {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 line-clamp-2">{team.description || "No description provided."}</p>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <span className="font-medium">{team._count.pathways}</span>
                  <span className="ml-1">pathway{team._count.pathways !== 1 ? "s" : ""}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-gray-50 px-6 py-3">
                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/teams/${team.id}`)}>
                  <Users className="mr-2 h-4 w-4" />
                  View Team
                </Button>
                {team.owner.id === team.members.find((m) => m.role === "admin")?.user.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onCreateTeam={handleCreateTeam} />
    </div>
  )
}
