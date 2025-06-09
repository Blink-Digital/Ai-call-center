"use client"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, ExternalLink, Calendar, User } from "lucide-react"

interface Pathway {
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
}

interface TeamPathwaysListProps {
  teamId: string
  pathways: Pathway[]
  isAdmin: boolean
}

export function TeamPathwaysList({ teamId, pathways, isAdmin }: TeamPathwaysListProps) {
  const router = useRouter()

  const handleCreatePathway = () => {
    // Navigate to the new pathway page with team ID
    router.push(`/dashboard/call-flows/new?teamId=${teamId}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Team Pathways</h3>
        {isAdmin && (
          <Button onClick={handleCreatePathway} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Pathway
          </Button>
        )}
      </div>

      {pathways.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-gray-500 mb-4">No pathways in this team yet.</p>
            {isAdmin && (
              <Button onClick={handleCreatePathway}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create First Pathway
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pathways.map((pathway) => (
            <Card key={pathway.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{pathway.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {pathway.description || "No description provided."}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Updated {new Date(pathway.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span>By {pathway.updater.name}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4"
                    onClick={() => router.push(`/dashboard/call-flows/editor?id=${pathway.id}`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
