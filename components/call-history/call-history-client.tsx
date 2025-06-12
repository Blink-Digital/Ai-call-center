"use client"

import { useState, useEffect } from "react"
import { useSupabaseBrowser } from "@/lib/supabase-browser" // ✅ Import singleton
import { useUserCallData } from "@/hooks/use-user-call-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Phone, RefreshCcw, Download, Clock, Calendar } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CallHistoryClient({ phoneNumber }: { phoneNumber?: string }) {
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | undefined>(phoneNumber)
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([])
  const [loadingPhoneNumbers, setLoadingPhoneNumbers] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const supabase = useSupabaseBrowser() // ✅ Use singleton instead of creating new instance

  // Fetch call data using the hook
  const { calls, loading, error, total, refetch } = useUserCallData({
    phoneNumber: selectedPhoneNumber,
    page,
    pageSize,
  })

  // Fetch user's phone numbers
  useEffect(() => {
    async function fetchPhoneNumbers() {
      try {
        setLoadingPhoneNumbers(true)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.error("No authenticated user found")
          return
        }

        // Fetch phone numbers from database
        const { data, error } = await supabase
          .from("phone_numbers")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["active", "purchased"])
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching phone numbers:", error)
          return
        }

        setPhoneNumbers(data || [])

        // If no phone number is selected and we have numbers, select the first one
        if (!selectedPhoneNumber && data && data.length > 0) {
          setSelectedPhoneNumber(data[0].number)
        }
      } catch (err) {
        console.error("Error in fetchPhoneNumbers:", err)
      } finally {
        setLoadingPhoneNumbers(false)
      }
    }

    fetchPhoneNumbers()
  }, [supabase, selectedPhoneNumber])

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number) => {
    if (!seconds) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Format date to local date and time
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Handle phone number change
  const handlePhoneNumberChange = (value: string) => {
    setSelectedPhoneNumber(value)
    setPage(1) // Reset to first page when changing phone number
  }

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number.parseInt(value))
    setPage(1) // Reset to first page when changing page size
  }

  // Calculate total pages
  const totalPages = Math.ceil(total / pageSize)

  // Handle pagination
  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "complete":
      case "completed":
        return "bg-green-500"
      case "failed":
      case "error":
        return "bg-red-500"
      case "in-progress":
      case "in_progress":
      case "inprogress":
        return "bg-blue-500"
      case "queued":
      case "waiting":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  // If no phone numbers are available
  if (!loadingPhoneNumbers && phoneNumbers.length === 0) {
    return (
      <div className="space-y-4">
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <AlertTitle className="text-yellow-800">No Phone Number Found</AlertTitle>
          <AlertDescription className="text-yellow-700">
            You need to purchase a phone number to start making calls and see call history.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={() => (window.location.href = "/dashboard/phone-numbers/purchase")}>
            Purchase Phone Number
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {selectedPhoneNumber ? `Showing calls from: ${selectedPhoneNumber}` : "Select a phone number"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {phoneNumbers.length > 1 && (
            <Select value={selectedPhoneNumber} onValueChange={handlePhoneNumberChange} disabled={loadingPhoneNumbers}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select phone number" />
              </SelectTrigger>
              <SelectContent>
                {phoneNumbers.map((phone) => (
                  <SelectItem key={phone.id} value={phone.number}>
                    {phone.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={loading}>
              <RefreshCcw className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                // Export call history as CSV
                if (!calls.length) return

                const headers = ["ID", "Date", "Time", "From", "To", "Duration", "Status"]
                const csvContent = [
                  headers.join(","),
                  ...calls.map((call) =>
                    [
                      call.id,
                      new Date(call.start_time).toLocaleDateString(),
                      new Date(call.start_time).toLocaleTimeString(),
                      call.from_number,
                      call.to_number,
                      formatDuration(call.duration),
                      call.status,
                    ].join(","),
                  ),
                ].join("\n")

                const blob = new Blob([csvContent], { type: "text/csv" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `call-history-${new Date().toISOString().split("T")[0]}.csv`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
              disabled={!calls.length}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error loading call history</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Call History</CardTitle>
            <CardDescription>Loading your call history...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-3 w-[200px]" />
                  </div>
                  <Skeleton className="h-6 w-[80px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Call History
                  </CardTitle>
                  <CardDescription>
                    {total} total calls • Page {page} of {totalPages || 1} • Updated {new Date().toLocaleTimeString()}
                  </CardDescription>
                </div>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {calls.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Phone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No calls found</h3>
                  <p className="text-muted-foreground mt-2">No calls have been made from this number yet.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Date & Time</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead className="w-[100px]">Duration</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calls.map((call) => (
                          <TableRow key={call.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span>{new Date(call.start_time).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(call.start_time).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{call.from_number || "Unknown"}</TableCell>
                            <TableCell>{call.to_number || "Unknown"}</TableCell>
                            <TableCell>{formatDuration(call.duration)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(call.status)}>{call.status || "Unknown"}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <Button variant="outline" onClick={goToPrevPage} disabled={page <= 1}>
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages || 1}
                    </span>
                    <Button variant="outline" onClick={goToNextPage} disabled={page >= totalPages}>
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default CallHistoryClient
