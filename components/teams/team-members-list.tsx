"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { UserX, Shield, User, UserCog } from "lucide-react"

interface TeamMember {
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface TeamMembersListProps {
  teamId: string
  members: TeamMember[]
  ownerId: string
  currentUserId: string
  onMemberUpdated: () => void
}

export function TeamMembersList({ teamId, members, ownerId, currentUserId, onMemberUpdated }: TeamMembersListProps) {
  const [updatingMember, setUpdatingMember] = useState<string | null>(null)
  const { toast } = useToast()

  const handleRoleChange = async (memberId: string, role: string) => {
    setUpdatingMember(memberId)

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        throw new Error("Failed to update member role")
      }

      toast({
        title: "Role Updated",
        description: "The member's role has been updated successfully.",
      })

      onMemberUpdated()
    } catch (error) {
      console.error("Error updating member role:", error)
      toast({
        title: "Error",
        description: "Failed to update member role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the team?")) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove member")
      }

      toast({
        title: "Member Removed",
        description: "The member has been removed from the team.",
      })

      onMemberUpdated()
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const isOwnerOrAdmin =
    ownerId === currentUserId || members.some((m) => m.user.id === currentUserId && m.role === "admin")

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />
      case "editor":
        return <UserCog className="h-4 w-4 text-green-500" />
      case "viewer":
        return <User className="h-4 w-4 text-gray-500" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin"
      case "editor":
        return "Editor"
      case "viewer":
        return "Viewer"
      default:
        return role
    }
  }

  return (
    <div className="space-y-4">
      {members.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-gray-500">No members in this team yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback>
                        {member.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user.name}</p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-sm">
                      {getRoleIcon(member.role)}
                      <span>{getRoleName(member.role)}</span>
                      {member.user.id === ownerId && (
                        <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Owner</span>
                      )}
                    </div>

                    {isOwnerOrAdmin && member.user.id !== ownerId && member.user.id !== currentUserId && (
                      <div className="flex space-x-2">
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleRoleChange(member.user.id, value)}
                          disabled={updatingMember === member.user.id}
                        >
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                          onClick={() => handleRemoveMember(member.user.id)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
