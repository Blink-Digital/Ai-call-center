"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart, Phone, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUserPhoneNumbers, getCurrentUser, type UserPhoneNumber } from "@/lib/user-phone-numbers"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"

// Define types for our data
interface Call {
  id: string
  to?: string
  from_number?: string
  to_number?: string
  duration: number
  status: string
  start_time: string
  pathway_name?: string
}

interface CallAnalysis {
  transcript: string
  summary: string
  sentiment: string
  keywords: string[]
  intent: string
  duration: string
  callerId: string
  date: string
}

export default function AnalyticsPage() {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [selectedTimeframe, setSelectedTimeframe] = useState("week")
  const [selectedCall, setSelectedCall] = useState<string | null>(null)
  const [callAnalytics, setCallAnalytics] = useState<CallAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [calls, setCalls] = useState<Call[]>([])
  const [userPhoneNumbers, setUserPhoneNumbers] = useState<UserPhoneNumber[]>([])
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>("")
  const [isLoadingCalls, setIsLoadingCalls] = useState(false)
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Get current user and their phone numbers
  useEffect(() => {
    async function loadUserData() {
      try {
        setIsLoadingNumbers(true)
        const user = await getCurrentUser()

        if (!user) {
          setError("Please log in to view analytics")
          return
        }

        setCurrentUser(user)
        const phoneNumbers = await getUserPhoneNumbers(user.id)
        setUserPhoneNumbers(phoneNumbers)

        // Auto-select the first phone number if available
        if (phoneNumbers.length > 0) {
          setSelectedPhoneNumber(phoneNumbers[0].number)
        }
      } catch (err) {
        console.error("Error loading user data:", err)
        setError("Failed to load user data")
      } finally {
        setIsLoadingNumbers(false)
      }
    }

    loadUserData()
  }, [])

  // Fetch calls for the selected phone number
  useEffect(() => {
    if (!selectedPhoneNumber) {
      setCalls([])
      return
    }

    async function fetchCalls() {
      setIsLoadingCalls(true)
      setError(null)

      try {
        const response = await fetch(`/api/bland-ai/calls?phoneNumber=${encodeURIComponent(selectedPhoneNumber)}`)

        if (!response.ok) {
          throw new Error("Failed to fetch calls")
        }

        const data = await response.json()
        setCalls(data)
      } catch (err) {
        console.error("Error fetching calls:", err)
        setError("Failed to load calls. Please try again.")
      } finally {
        setIsLoadingCalls(false)
      }
    }

    fetchCalls()
  }, [selectedPhoneNumber])

  // Fetch call analytics when a call is selected
  useEffect(() => {
    if (selectedCall) {
      setIsLoading(true)
      setCallAnalytics(null)

      async function fetchCallAnalytics() {
        try {
          const response = await fetch(`/api/bland-ai/calls/${selectedCall}/analyze`, {
            method: "POST",
          })

          if (!response.ok) {
            throw new Error("Failed to analyze call")
          }

          const data = await response.json()
          setCallAnalytics(data)
        } catch (err) {
          console.error("Error analyzing call:", err)
          setError("Failed to analyze call. Please try again.")
        } finally {
          setIsLoading(false)
        }
      }

      fetchCallAnalytics()
    }
  }, [selectedCall])

  // Calculate metrics for the overview tab
  const totalCalls = calls.length
  const successfulCalls = calls.filter((call) => call.status === "completed").length
  const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0

  // Calculate average call duration
  const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0)
  const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Group calls by pathway
  const pathwayCalls = calls.reduce((acc: Record<string, number>, call) => {
    const pathwayName = call.pathway_name || "Unknown"
    acc[pathwayName] = (acc[pathwayName] || 0) + 1
    return acc
  }, {})

  // Calculate pathway success rates
  const pathwaySuccessRates = Object.entries(
    calls.reduce((acc: Record<string, { total: number; success: number }>, call) => {
      const pathwayName = call.pathway_name || "Unknown"
      if (!acc[pathwayName]) {
        acc[pathwayName] = { total: 0, success: 0 }
      }
      acc[pathwayName].total += 1
      if (call.status === "completed") {
        acc[pathwayName].success += 1
      }
      return acc
    }, {}),
  ).map(([name, data]) => ({
    name,
    total: data.total,
    success: data.success,
    rate: data.total > 0 ? (data.success / data.total) * 100 : 0,
  }))

  // Show loading state while fetching user's phone numbers
  if (isLoadingNumbers) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </PageContainer>
    )
  }

  // Show empty state if user has no phone numbers
  if (userPhoneNumbers.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Analytics" description="View detailed analytics and call history for your phone numbers" />

        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Phone Numbers Found</h3>
            <p className="text-gray-600 mb-8 max-w-md text-center">
              You need to purchase a phone number before you can view analytics and call data.
            </p>
            <Link href="/dashboard/phone-numbers/purchase">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Purchase a Phone Number
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader title="Analytics" description="View detailed analytics and call history for your phone numbers">
        <div className="flex items-center gap-3">
          <Select value={selectedPhoneNumber} onValueChange={setSelectedPhoneNumber}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select phone number" />
            </SelectTrigger>
            <SelectContent>
              {userPhoneNumbers.map((phoneNumber) => (
                <SelectItem key={phoneNumber.id} value={phoneNumber.number}>
                  {phoneNumber.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export Data</Button>
        </div>
      </PageHeader>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Call Analytics
          </TabsTrigger>
          <TabsTrigger value="pathways" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Pathway Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{totalCalls}</div>
                <p className="text-xs text-gray-500 mt-1">For {selectedPhoneNumber}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{successRate.toFixed(1)}%</div>
                <p className="text-xs text-gray-500 mt-1">Completed calls</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Avg. Call Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{formatDuration(avgDuration)}</div>
                <p className="text-xs text-gray-500 mt-1">Minutes:Seconds</p>
              </CardContent>
            </Card>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-red-800">{error}</div>
              </CardContent>
            </Card>
          )}

          {isLoadingCalls ? (
            <Card className="border-0 shadow-md">
              <CardContent className="flex items-center justify-center h-[300px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </CardContent>
            </Card>
          ) : calls.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No call data available</h3>
                <p className="text-gray-600 text-center">There are no calls recorded for {selectedPhoneNumber} yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Call Volume</CardTitle>
                <CardDescription>Number of calls over time for {selectedPhoneNumber}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <p className="text-gray-600 font-medium">
                      Call volume chart will be displayed here based on real data.
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Connect to a charting library to visualize the {calls.length} calls.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rest of tabs content with similar styling updates... */}
        <TabsContent value="calls" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Calls</CardTitle>
              <CardDescription>Select a call to view detailed analytics for {selectedPhoneNumber}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-4">{error}</div>}

              {isLoadingCalls ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : calls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No call data available</h3>
                  <p className="text-gray-600 text-center">
                    There are no calls recorded for {selectedPhoneNumber} yet.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Call ID</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">From</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">To</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Duration</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Status</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Date</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Pathway</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calls.map((call) => (
                        <tr
                          key={call.id}
                          className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${selectedCall === call.id ? "bg-blue-50" : ""}`}
                          onClick={() => setSelectedCall(call.id)}
                        >
                          <td className="py-3 px-4 font-mono text-xs">{call.id}</td>
                          <td className="py-3 px-4">{call.from_number || "-"}</td>
                          <td className="py-3 px-4">{call.to || call.to_number || "-"}</td>
                          <td className="py-3 px-4">{formatDuration(call.duration || 0)}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                call.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {call.status ? call.status.charAt(0).toUpperCase() + call.status.slice(1) : "Unknown"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {call.start_time ? new Date(call.start_time).toLocaleDateString() : "-"}
                          </td>
                          <td className="py-3 px-4">{call.pathway_name || "Unknown"}</td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedCall && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Call Analysis</CardTitle>
                <CardDescription>Detailed analysis for call {selectedCall}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : callAnalytics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border border-gray-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Call Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium">{callAnalytics.duration || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Caller:</span>
                            <span className="font-medium">{callAnalytics.callerId || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{callAnalytics.date || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Intent:</span>
                            <span className="font-medium">{callAnalytics.intent || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sentiment:</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                callAnalytics.sentiment === "Positive"
                                  ? "bg-green-100 text-green-800"
                                  : callAnalytics.sentiment === "Negative"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {callAnalytics.sentiment || "Unknown"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-gray-200 md:col-span-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700">{callAnalytics.summary || "No summary available"}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Keywords</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {callAnalytics.keywords && callAnalytics.keywords.length > 0 ? (
                            callAnalytics.keywords.map((keyword, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                              >
                                {keyword}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No keywords available</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Transcript</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border">
                          {callAnalytics.transcript || "No transcript available"}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[100px]">
                    <p className="text-gray-500">Select a call to view analytics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pathways" className="space-y-6">
          {isLoadingCalls ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : calls.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pathway data available</h3>
                <p className="text-gray-600 text-center">There are no calls recorded for {selectedPhoneNumber} yet.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Pathway Performance</CardTitle>
                    <CardDescription>Success rate by pathway for {selectedPhoneNumber}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pathwaySuccessRates.map((pathway, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{pathway.name}</span>
                            <span className="text-sm font-semibold text-gray-900">{pathway.rate.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${pathway.rate}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                      {pathwaySuccessRates.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No pathway data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Call Distribution</CardTitle>
                    <CardDescription>Calls by pathway for {selectedPhoneNumber}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-xl">
                      <div className="text-center">
                        <p className="text-gray-600 font-medium">
                          Call distribution chart will be displayed here based on real data.
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                          Connect to a charting library to visualize the pathway distribution.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center mt-4">
                      {Object.entries(pathwayCalls).map(([name, count], index) => {
                        const percentage = (count / totalCalls) * 100
                        return (
                          <div key={index} className="flex items-center">
                            <div
                              className={`w-3 h-3 bg-blue-600 rounded-full mr-2`}
                              style={{ opacity: 0.5 + index * 0.1 }}
                            ></div>
                            <span className="text-sm font-medium">
                              {name} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Pathway Metrics</CardTitle>
                  <CardDescription>Detailed metrics for each pathway on {selectedPhoneNumber}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="py-3 px-4 text-left font-medium text-gray-700">Pathway</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-700">Total Calls</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-700">Success Rate</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-700">Avg. Duration</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pathwaySuccessRates.map((pathway, index) => {
                          // Calculate average duration for this pathway
                          const pathwayCalls = calls.filter((call) => (call.pathway_name || "Unknown") === pathway.name)
                          const totalDuration = pathwayCalls.reduce((sum, call) => sum + (call.duration || 0), 0)
                          const avgDuration = pathwayCalls.length > 0 ? totalDuration / pathwayCalls.length : 0

                          return (
                            <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 font-medium">{pathway.name}</td>
                              <td className="py-3 px-4">{pathway.total}</td>
                              <td className="py-3 px-4">{pathway.rate.toFixed(1)}%</td>
                              <td className="py-3 px-4">{formatDuration(avgDuration)}</td>
                              <td className="py-3 px-4">
                                <Button variant="ghost" size="sm">
                                  Details
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                        {pathwaySuccessRates.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              No pathway data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
