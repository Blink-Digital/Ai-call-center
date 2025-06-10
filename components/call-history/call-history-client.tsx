"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Phone, Clock, User, MessageSquare, ExternalLink, Search, Calendar } from "lucide-react"
import { useAuth } from "@/contexts/auth-context" // ✅ Use modern auth context
import { toast } from "@/components/ui/use-toast"

interface CallRecord {
  call_id: string
  to: string
  from: string
  call_length: number
  call_successful: boolean
  created_at: string
  ended_reason: string
  summary?: string
  transcript?: string
  recording_url?: string
  pathway_id?: string
  corrected_duration?: number
  variables?: Record<string, any>
}

interface CallHistoryClientProps {
  initialCalls?: CallRecord[]
}

function CallHistoryClient({ initialCalls = [] }: CallHistoryClientProps) {
  // ✅ Use modern auth context instead of manual Supabase client
  const { user, loading: authLoading } = useAuth()

  const [calls, setCalls] = useState<CallRecord[]>(initialCalls)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null)

  const fetchCalls = async () => {
    setLoading(true)
    setError(null)

    try {
      // ✅ Use secure API route with automatic cookie-based auth
      const response = await fetch("/api/bland-ai/call-history", {
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
        throw new Error(`Failed to fetch calls: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.calls)) {
        setCalls(data.calls)
      } else {
        throw new Error(data.error || "Invalid response format")
      }
    } catch (error) {
      console.error("Error fetching calls:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch calls")
      toast({
        title: "Error loading calls",
        description: error instanceof Error ? error.message : "Failed to fetch calls",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const analyzeCall = async (callId: string) => {
    setIsAnalyzing(callId)

    try {
      // ✅ Use secure API route with automatic cookie-based auth
      const response = await fetch(`/api/bland-ai/calls/${callId}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ Include cookies for authentication
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.")
        }
        throw new Error(`Failed to analyze call: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Update the call in the list with the new analysis
        setCalls((prevCalls) =>
          prevCalls.map((call) =>
            call.call_id === callId ? { ...call, summary: data.summary, variables: data.variables } : call,
          ),
        )

        toast({
          title: "Analysis complete",
          description: "Call has been analyzed successfully.",
        })
      } else {
        throw new Error(data.error || "Analysis failed")
      }
    } catch (error) {
      console.error("Error analyzing call:", error)
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze call",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(null)
    }
  }

  const filteredCalls = calls.filter(
    (call) =>
      call.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.call_id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (call: CallRecord) => {
    if (call.call_successful) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Completed
        </Badge>
      )
    } else {
      return <Badge variant="destructive">Failed</Badge>
    }
  }

  // ✅ Fetch calls when component mounts and user is authenticated
  useEffect(() => {
    if (user && !authLoading && initialCalls.length === 0) {
      fetchCalls()
    }
  }, [user, authLoading])

  return (
    <div className="space-y-6">
      {/* Header with Search and Refresh */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Call History</h2>
          <p className="text-gray-600">View and analyze your recent calls</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search calls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={fetchCalls} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Calls List */}
      {!loading && (
        <div className="grid gap-4">
          {filteredCalls.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  {searchTerm ? "No calls found matching your search." : "No calls found."}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCalls.map((call) => (
              <Card key={call.call_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {call.to}
                        {getStatusBadge(call)}
                      </CardTitle>
                      <CardDescription>Call ID: {call.call_id}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {!call.summary && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => analyzeCall(call.call_id)}
                          disabled={isAnalyzing === call.call_id}
                        >
                          {isAnalyzing === call.call_id ? "Analyzing..." : "Analyze"}
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedCall(call)}>
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Call Details</DialogTitle>
                            <DialogDescription>Detailed information for call {call.call_id}</DialogDescription>
                          </DialogHeader>
                          {selectedCall && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">To</Label>
                                  <p className="text-sm">{selectedCall.to}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">From</Label>
                                  <p className="text-sm">{selectedCall.from}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Duration</Label>
                                  <p className="text-sm">{formatDuration(selectedCall.call_length)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <p className="text-sm">{selectedCall.call_successful ? "Successful" : "Failed"}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Date</Label>
                                  <p className="text-sm">{formatDate(selectedCall.created_at)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">End Reason</Label>
                                  <p className="text-sm">{selectedCall.ended_reason}</p>
                                </div>
                              </div>

                              {selectedCall.summary && (
                                <div>
                                  <Label className="text-sm font-medium">Summary</Label>
                                  <Textarea value={selectedCall.summary} readOnly className="mt-1" rows={3} />
                                </div>
                              )}

                              {selectedCall.transcript && (
                                <div>
                                  <Label className="text-sm font-medium">Transcript</Label>
                                  <Textarea value={selectedCall.transcript} readOnly className="mt-1" rows={6} />
                                </div>
                              )}

                              {selectedCall.variables && Object.keys(selectedCall.variables).length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium">Variables</Label>
                                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                                    {JSON.stringify(selectedCall.variables, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {selectedCall.recording_url && (
                                <div>
                                  <Label className="text-sm font-medium">Recording</Label>
                                  <div className="mt-1">
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={selectedCall.recording_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Listen to Recording
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(call.call_length)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(call.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      From: {call.from}
                    </div>
                  </div>

                  {call.summary && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-medium text-sm">Summary</span>
                      </div>
                      <p className="text-sm text-gray-700">{call.summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Auth Required State */}
      {!user && !authLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to view call history.</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {authLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading call history...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CallHistoryClient
