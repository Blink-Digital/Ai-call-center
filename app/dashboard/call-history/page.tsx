"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Phone, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUserCallData } from "@/hooks/use-user-call-data"
import { useState } from "react"

export default function CallHistoryPage() {
  const { calls, totalCalls, userPhoneNumber, loading, error, lastUpdated, refetch } = useUserCallData()
  const [pageSize, setPageSize] = useState("20")

  // Pagination logic
  const currentPageSize = Number.parseInt(pageSize)
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(totalCalls / currentPageSize)
  const startIndex = (currentPage - 1) * currentPageSize
  const endIndex = startIndex + currentPageSize
  const paginatedCalls = calls.slice(startIndex, endIndex)

  const formatDuration = (duration: number) => {
    if (!duration || isNaN(duration)) {
      return "0:00"
    }
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid Date"
      }
      return date.toLocaleString()
    } catch (error) {
      return "Invalid Date"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700"
      case "failed":
        return "bg-red-100 text-red-700"
      case "busy":
        return "bg-yellow-100 text-yellow-700"
      case "no-answer":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-blue-100 text-blue-700"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call History</h1>
          <p className="text-gray-600">View real-time call logs from Bland.ai</p>
          {userPhoneNumber && <p className="text-sm text-gray-500 mt-1">Showing calls from: {userPhoneNumber}</p>}
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">Error loading call history: {error}</p>
        </div>
      )}

      {/* No Phone Number State */}
      {!loading && !userPhoneNumber && (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-yellow-800 font-medium mb-2">No Phone Number Found</h3>
          <p className="text-yellow-700 text-sm mb-4">
            You need to purchase a phone number to start making calls and see call history.
          </p>
          <Button asChild size="sm">
            <a href="/dashboard/phone-numbers/purchase">Purchase Phone Number</a>
          </Button>
        </div>
      )}

      {/* Call History Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {userPhoneNumber ? `Calls for ${userPhoneNumber}` : "Call History"}
                </CardTitle>
                <CardDescription>
                  {totalCalls} total calls • Page {currentPage} of {totalPages}
                  {lastUpdated && ` • Updated ${new Date(lastUpdated).toLocaleTimeString()}`}
                </CardDescription>
              </div>
            </div>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="w-32">
                <SelectValue />
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading call history...</span>
            </div>
          ) : paginatedCalls.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No calls found</h3>
              <p className="text-gray-600">
                {userPhoneNumber
                  ? "No calls have been made from this number yet."
                  : "Purchase a phone number to start making calls."}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">From</TableHead>
                      <TableHead className="font-semibold">To</TableHead>
                      <TableHead className="font-semibold">Date & Time</TableHead>
                      <TableHead className="font-semibold">Duration</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Pathway</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCalls.map((call) => (
                      <TableRow key={call.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{call.from_number || "—"}</TableCell>
                        <TableCell>{call.to_number || "—"}</TableCell>
                        <TableCell className="text-gray-600">{formatDate(call.start_time)}</TableCell>
                        <TableCell className="font-mono text-sm">{formatDuration(call.duration)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(call.status)}>
                            {call.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{call.pathway_name || call.pathway_id || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalCalls)} of {totalCalls} calls
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
