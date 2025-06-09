"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface Team {
  id: string
  name: string
}

export default function NewCallFlowPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [teamId, setTeamId] = useState<string | null>("personal") // Updated default value
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if teamId is provided in the URL
    const urlTeamId = searchParams.get("teamId")
    if (urlTeamId) {
      setTeamId(urlTeamId)
    }

    fetchTeams()
  }, [searchParams])

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true)
      const response = await fetch("/api/teams")

      if (!response.ok) {
        throw new Error("Failed to fetch teams")
      }

      const data = await response.json()
      setTeams(data.teams)
    } catch (error) {
      console.error("Error fetching teams:", error)
      toast({
        title: "Error",
        description: "Failed to load teams. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingTeams(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your call flow.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create a new pathway
      const response = await fetch("/api/pathways", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          teamId: teamId || undefined,
          data: {}, // Empty data for now, will be populated in the editor
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create pathway")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: "Call flow created successfully.",
      })

      // Redirect to the editor with the new pathway ID
      router.push(`/dashboard/call-flows/editor?id=${data.pathway.id}`)
    } catch (error) {
      console.error("Error creating call flow:", error)
      toast({
        title: "Error",
        description: "Failed to create call flow. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Call Flow</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your call flow"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this call flow"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Team (Optional)</Label>
            <Select value={teamId || ""} onValueChange={(value) => setTeamId(value || null)}>
              <SelectTrigger id="team" disabled={loadingTeams}>
                <SelectValue placeholder={loadingTeams ? "Loading teams..." : "Select a team"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal (No Team)</SelectItem> {/* Updated value prop */}
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              {teamId === "personal"
                ? "This call flow will be private to you."
                : "This call flow will be shared with your team members."}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Call Flow"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
