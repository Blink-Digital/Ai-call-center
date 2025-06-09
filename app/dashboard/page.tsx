"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, BarChart3, Settings, TrendingUp, Activity, Zap, RefreshCw } from "lucide-react"
import Link from "next/link"
import { RecentFlows } from "@/components/recent-flows"
import { useUserCallData } from "@/hooks/use-user-call-data"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const {
    calls,
    totalCalls,
    userPhoneNumber,
    loading: callDataLoading,
    error,
    lastUpdated,
    refetch,
  } = useUserCallData()

  // Calculate metrics from call data
  const calculateMetrics = () => {
    if (!calls || calls.length === 0) {
      return {
        successRate: 0,
        callsThisMonth: 0,
        activeFlows: 0,
      }
    }

    // Calculate success rate (calls with duration > 30 seconds or completed status)
    const successfulCalls = calls.filter(
      (call) => call.status === "completed" && (call.duration > 30 || call.outcome === "successful"),
    ).length
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0

    // Calculate calls this month
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const callsThisMonth = calls.filter((call) => new Date(call.start_time) >= currentMonthStart).length

    // Calculate active flows (unique pathway IDs)
    const uniquePathways = new Set(calls.filter((call) => call.pathway_id).map((call) => call.pathway_id))
    const activeFlows = uniquePathways.size

    return { successRate, callsThisMonth, activeFlows }
  }

  const metrics = calculateMetrics()

  // Format relative time for "last updated"
  const formatRelativeTime = (date: Date | null) => {
    if (!date) return ""

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "just now"
    if (diffMins === 1) return "1 minute ago"
    if (diffMins < 60) return `${diffMins} minutes ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return "1 hour ago"
    return `${diffHours} hours ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h2>
          <p className="text-gray-600 mb-6">You need to be authenticated to access the dashboard.</p>
          <Button asChild size="lg">
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name || user.email?.split("@")[0] || "User"}! 👋
            </h1>
            <p className="text-gray-600 text-lg">Here's what's happening with your call flows today.</p>
            {userPhoneNumber && <p className="text-sm text-gray-500 mt-1">Phone Number: {userPhoneNumber}</p>}
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">Last updated: {formatRelativeTime(lastUpdated)}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={callDataLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${callDataLoading ? "animate-spin" : ""}`} />
            {callDataLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">Error loading call data: {error}</p>
          </div>
        )}

        {/* No Phone Number State */}
        {!callDataLoading && !userPhoneNumber && (
          <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-yellow-800 font-medium mb-2">No Phone Number Found</h3>
            <p className="text-yellow-700 text-sm mb-4">
              You need to purchase a phone number to start making calls and see analytics.
            </p>
            <Button asChild size="sm">
              <Link href="/dashboard/phone-numbers/purchase">Purchase Phone Number</Link>
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Calls</CardTitle>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {callDataLoading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-900">{totalCalls.toLocaleString()}</div>
                  {metrics.callsThisMonth > 0 && (
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600 font-medium">{metrics.callsThisMonth} this month</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Flows</CardTitle>
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              {callDataLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold text-gray-900">{metrics.activeFlows}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Unique pathways used</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              {callDataLoading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold text-gray-900">{metrics.successRate.toFixed(1)}%</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Completed calls</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Phone Numbers</CardTitle>
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Settings className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              {callDataLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold text-gray-900">{userPhoneNumber ? "1" : "0"}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">{userPhoneNumber ? "1 active" : "No numbers yet"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Create New Flow</CardTitle>
              </div>
              <CardDescription className="text-gray-600">
                Build a new call flow from scratch or use a template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/dashboard/call-flows/new">Create Flow</Link>
              </Button>
              <Button variant="outline" asChild className="w-full border-gray-200 hover:bg-gray-50">
                <Link href="/dashboard/call-flows/generate">Generate with AI</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Phone Numbers</CardTitle>
              </div>
              <CardDescription className="text-gray-600">
                Manage your phone numbers and purchase new ones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href="/dashboard/phone-numbers">View Numbers</Link>
              </Button>
              <Button variant="outline" asChild className="w-full border-gray-200 hover:bg-gray-50">
                <Link href="/dashboard/phone-numbers/purchase">Purchase Number</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Analytics</CardTitle>
              </div>
              <CardDescription className="text-gray-600">View detailed analytics and call history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                <Link href="/dashboard/analytics">View Analytics</Link>
              </Button>
              <Button variant="outline" asChild className="w-full border-gray-200 hover:bg-gray-50">
                <Link href="/dashboard/call-history">Call History</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Flows Section */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Call Flows</CardTitle>
                <CardDescription className="text-gray-600">
                  Your recently created and modified call flows
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <RecentFlows />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
