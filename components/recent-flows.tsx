"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { useSupabaseBrowser } from "@/lib/supabase-browser" // ✅ Import singleton

export function RecentFlows() {
  const [flows, setFlows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useSupabaseBrowser() // ✅ Use singleton instead of creating new instance

  useEffect(() => {
    async function loadFlows() {
      try {
        setLoading(true)
        setError(null)

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.log("User not authenticated yet, skipping flow fetch")
          setLoading(false)
          return
        }

        if (!user) {
          console.log("No user found, skipping flow fetch")
          setLoading(false)
          return
        }

        // Fetch user's pathways directly from Supabase instead of using an API route
        const { data: pathways, error: pathwaysError } = await supabase
          .from("pathways")
          .select("*")
          .eq("creator_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(5)

        if (pathwaysError) {
          console.error("Error fetching pathways:", pathwaysError)
          setError("Failed to load your call flows. Please try again later.")
          return
        }

        setFlows(pathways || [])
      } catch (error) {
        console.error("Error loading recent flows:", error)
        setError("An unexpected error occurred. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    // Only load flows if we're not on the login page
    if (window.location.pathname !== "/login") {
      loadFlows()
    } else {
      setLoading(false)
    }
  }, [supabase])

  const handleEditFlow = (id: string) => {
    router.push(`/dashboard/call-flows/editor?id=${id}`)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Call Flows</CardTitle>
          <CardDescription>Your recently created or updated call flows</CardDescription>
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4 flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-[200px] mb-2" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
              <Skeleton className="h-8 w-[80px]" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Call Flows</CardTitle>
          <CardDescription>Unable to load your call flows</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <p className="text-center text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  if (flows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Call Flows</CardTitle>
          <CardDescription>You haven't created any call flows yet</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <p className="text-center text-muted-foreground mb-4">
            Create your first call flow to start making automated calls
          </p>
          <Button onClick={() => router.push("/dashboard/call-flows/new")}>Create Call Flow</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Call Flows</CardTitle>
        <CardDescription>Your recently created or updated call flows</CardDescription>
      </CardHeader>
      <CardContent>
        {flows.map((flow) => (
          <div key={flow.id} className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium">{flow.name || "Untitled Flow"}</h4>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(flow.updated_at).toLocaleDateString()}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleEditFlow(flow.id)}>
              Edit
            </Button>
          </div>
        ))}
        <div className="mt-4 text-center">
          <Button variant="link" onClick={() => router.push("/dashboard/call-flows")}>
            View All Call Flows
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
