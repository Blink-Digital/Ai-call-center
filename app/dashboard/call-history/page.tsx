"use client"
import { Button } from "@/components/ui/button"
import { RefreshCw, Phone, Download, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useUserCallData } from "@/hooks/use-user-call-data"
import { useState } from "react"

export default function CallHistoryPage() {
  const { calls, totalCalls, userPhoneNumber, loading, error, lastUpdated, refetch } = useUserCallData()
  const [pageSize, setPageSize] = useState("20")
  const [searchTerm, setSearchTerm] = useState("")

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
      if (isNaN(date.getTime())) {
        return "Invalid Date"
      }
      return date.toLocaleDateString() + " " + date.toLocaleTimeString()
    } catch (error) {
      return "Invalid Date"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "complete":
        return "bg-green-500 text-white"
      case "failed":
        return "bg-red-500 text-white"
      case "busy":
        return "bg-yellow-500 text-white"
      case "no-answer":
        return "bg-gray-500 text-white"
      default:
        return "bg-blue-500 text-white"
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* Page Header - matching phone numbers page exactly */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Call History</h1>
          <p className="text-gray-400">
            {userPhoneNumber
              ? `You have ${totalCalls} calls in your history`
              : "View real-time call logs from Bland.ai"}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Search Input - dark theme like phone numbers page */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search calls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-gray-600 focus:ring-0"
            />
          </div>
          {/* Refresh Button - dark theme */}
          <Button
            variant="outline"
            onClick={refetch}
            disabled={loading}
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {/* Export Button - blue like Purchase Number */}
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-800 rounded-lg">
          <p className="text-red-300 text-sm">Error loading call history: {error}</p>
        </div>
      )}

      {/* No Phone Number State */}
      {!loading && !userPhoneNumber && (
        <div className="p-6 bg-yellow-900/50 border border-yellow-800 rounded-lg">
          <h3 className="text-yellow-300 font-medium mb-2">No Phone Number Found</h3>
          <p className="text-yellow-400 text-sm mb-4">
            You need to purchase a phone number to start making calls and see call history.
          </p>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
            <a href="/dashboard/phone-numbers/purchase">Purchase Phone Number</a>
          </Button>
        </div>
      )}

      {/* Main Card - Gray theme like phone numbers page */}
      <div className="bg-gray-700 rounded-lg overflow-hidden">
        {/* Card Header - Gray background like phone numbers */}
        <div className="bg-gray-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Call History</h2>
            {totalCalls > 0 && (
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="10" className="text-white hover:bg-gray-700">
                    10 per page
                  </SelectItem>
                  <SelectItem value="20" className="text-white hover:bg-gray-700">
                    20 per page
                  </SelectItem>
                  <SelectItem value="50" className="text-white hover:bg-gray-700">
                    50 per page
                  </SelectItem>
                  <SelectItem value="100" className="text-white hover:bg-gray-700">
                    100 per page
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-gray-800">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-400">Loading call history...</span>
            </div>
          ) : paginatedCalls.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4">
                <Phone className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No calls found</h3>
              <p className="text-gray-400 max-w-sm mx-auto">
                {userPhoneNumber
                  ? "No calls have been made from this number yet."
                  : "Purchase a phone number to start making calls."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-700 hover:bg-transparent">
                    <TableHead className="font-semibold text-gray-300 px-6 py-4">From</TableHead>
                    <TableHead className="font-semibold text-gray-300 px-6 py-4">To</TableHead>
                    <TableHead className="font-semibold text-gray-300 px-6 py-4">Date & Time</TableHead>
                    <TableHead className="font-semibold text-gray-300 px-6 py-4">Duration</TableHead>
                    <TableHead className="font-semibold text-gray-300 px-6 py-4">Status</TableHead>
                    <TableHead className="font-semibold text-gray-300 px-6 py-4">Pathway</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCalls.map((call, index) => (
                    <TableRow
                      key={call.id}
                      className={`border-b border-gray-700 hover:bg-gray-750 ${
                        index % 2 === 0 ? "bg-gray-800" : "bg-gray-750"
                      }`}
                    >
                      <TableCell className="text-blue-400 px-6 py-4 flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        {call.from_number || "—"}
                      </TableCell>
                      <TableCell className="text-gray-300 px-6 py-4">{call.to_number || "—"}</TableCell>
                      <TableCell className="text-gray-400 px-6 py-4">{formatDate(call.start_time)}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-300 px-6 py-4">
                        {formatDuration(call.duration)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge className={`${getStatusColor(call.status)} text-xs px-3 py-1 rounded-full`}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 px-6 py-4">
                        {call.pathway_name || call.pathway_id || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Footer - matching phone numbers page exactly */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing {Math.min(startIndex + 1, totalCalls)} of {totalCalls} calls
                </div>
                <div className="flex items-center space-x-2">
                  {totalPages > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-400 px-3">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      >
                        Next
                      </Button>
                    </>
                  )}
                  <Button className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600" size="sm">
                    Export List
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
