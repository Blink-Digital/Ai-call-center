"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, User, Users, Database, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface UserData {
  id: string
  email: string
  name: string | null
  company: string | null
  phone_number: string | null
  role: string
  created_at: string
  updated_at: string
  last_login: string | null
}

interface DebugData {
  currentUser: UserData | null
  currentUserError: string | null
  recentUsers: UserData[]
  totalUsers: number
  authUserId: string
  authUserEmail: string
  publicUsersCount: number
  syncStatus: string
}

export default function UsersDebugPage() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/debug/users")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data")
      }

      setData(result.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case "synced":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Synced
          </Badge>
        )
      case "missing":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Missing Profile
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Error Loading User Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Debug Dashboard</h1>
          <p className="text-muted-foreground">Monitor user creation and database synchronization</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Sync Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.publicUsersCount || 0}</div>
            <p className="text-xs text-muted-foreground">In public.users table</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">{getSyncStatusBadge(data?.syncStatus || "unknown")}</div>
            <p className="text-xs text-muted-foreground mt-1">Profile synchronization</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.recentUsers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Recent signups</p>
          </CardContent>
        </Card>
      </div>

      {/* Current User Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User Status
          </CardTitle>
          <CardDescription>Your authentication and profile status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Auth User</h4>
              <p className="text-sm text-muted-foreground">ID: {data?.authUserId}</p>
              <p className="text-sm text-muted-foreground">Email: {data?.authUserEmail}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                Profile Status
                {getSyncStatusBadge(data?.syncStatus || "unknown")}
              </h4>
              {data?.currentUser ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name: {data.currentUser.name || "Not set"}</p>
                  <p className="text-sm text-muted-foreground">Company: {data.currentUser.company || "Not set"}</p>
                  <p className="text-sm text-muted-foreground">Role: {data.currentUser.role}</p>
                  <p className="text-sm text-muted-foreground">Created: {formatDate(data.currentUser.created_at)}</p>
                  {data.currentUser.last_login && (
                    <p className="text-sm text-muted-foreground">
                      Last login: {formatDate(data.currentUser.last_login)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-600">{data?.currentUserError || "Profile not found in database"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Users ({data?.totalUsers || 0})
          </CardTitle>
          <CardDescription>Latest user registrations in the database</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentUsers && data.recentUsers.length > 0 ? (
            <div className="space-y-4">
              {data.recentUsers.map((user, index) => (
                <div key={user.id}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{user.name || user.email}</h4>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.company && <p className="text-sm text-muted-foreground">Company: {user.company}</p>}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Created: {formatDate(user.created_at)}</p>
                      {user.last_login && <p>Last login: {formatDate(user.last_login)}</p>}
                    </div>
                  </div>
                  {index < data.recentUsers.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found in public.users table</p>
              <p className="text-sm text-muted-foreground mt-2">
                This might indicate the trigger isn't working or no new users have signed up since setup
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
