"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Phone, Clock, User, CheckCircle, XCircle } from "lucide-react"
import { useUserPhoneNumbers, useCallHistory } from "@/hooks/use-user-data"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface CallHistoryClientProps {
  phoneNumber?: string
}

export default function CallHistoryClient({ phoneNumber: initialPhoneNumber }: CallHistoryClientProps) {
  const { phoneNumbers, loading: phoneLoading, error: phoneError } = useUserPhoneNumbers()
  const [selectedNumber, setSelectedNumber] = useState<string>(initialPhoneNumber || "")

  const {
    calls,
    loading: callsLoading,
    error: callsError,
    pagination,
    changePage,
    changePageSize,
    refetch,
  } = useCallHistory(selectedNumber)

  // Auto-select first phone number when available
  if (phoneNumbers.length > 0 && !selectedNumber) {
    setSelectedNumber(phoneNumbers[0].number)
  }

  const loading = phoneLoading || callsLoading
  const error = phoneError || callsError

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      changePage(newPage)
    }
  }

  const handlePageSizeChange = (newSize: string) => {
    changePageSize(Number.parseInt(newSize, 10))
  }

  if (loading && phoneNumbers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Call History</h1>
            <p className="text-gray-600 mt-2">View real-time call logs from Bland.ai</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading call history...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Call History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Call History</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <Button onClick={refetch} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (phoneNumbers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-white shadow-sm border-0">
            <CardContent>
              <div className="text-center py-16">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Phone className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Phone Numbers Found</h3>
                <p className="text-gray-600 mb-8">Purchase a phone number to view call history</p>
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <a href="/dashboard/phone-numbers/purchase">Purchase Number</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Call History</h1>
              <p className="text-gray-600 mt-2">View real-time call logs from Bland.ai</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {phoneNumbers.length > 1 && (
                <Select value={selectedNumber} onValueChange={setSelectedNumber}>
                  <SelectTrigger className="w-full sm:w-64 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select phone number" />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneNumbers.map((number) => (
                      <SelectItem key={number.id} value={number.number}>
                        {number.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={refetch}
                variant="outline"
                size="default"
                disabled={loading}
                className="border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Call History Card */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Calls for {selectedNumber}</CardTitle>
                  {pagination.totalCalls > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {pagination.totalCalls} total calls • Page {pagination.page} of {pagination.totalPages}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <Select value={pagination.pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Rows per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading call history...</p>
              </div>
            ) : calls.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Phone className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No call history found</h3>
                <p className="text-gray-600 mb-6">No calls have been made to or from {selectedNumber}</p>
                <Button onClick={refetch} variant="outline" className="border-gray-200 hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-b border-gray-100">
                      <TableHead className="font-medium text-gray-700">From</TableHead>
                      <TableHead className="font-medium text-gray-700">To</TableHead>
                      <TableHead className="font-medium text-gray-700">Date & Time</TableHead>
                      <TableHead className="font-medium text-gray-700">Duration</TableHead>
                      <TableHead className="font-medium text-gray-700">Status</TableHead>
                      <TableHead className="font-medium text-gray-700">Answered By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calls.map((call, index) => (
                      <TableRow
                        key={call.call_id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                      >
                        <TableCell className="font-medium text-gray-900">{call.from}</TableCell>
                        <TableCell className="text-gray-600">{call.to}</TableCell>
                        <TableCell className="text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{new Date(call.created_at).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          <span className="font-mono text-sm">
                            {Math.floor((call.call_length || 0) / 60)}:
                            {((call.call_length || 0) % 60).toString().padStart(2, "0")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {call.completed ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                call.completed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {call.queue_status || (call.completed ? "Completed" : "Failed")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-3 w-3 text-gray-400" />
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                call.answered_by === "human"
                                  ? "bg-blue-100 text-blue-800"
                                  : call.answered_by === "voicemail"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {call.answered_by || "Unknown"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          {pagination.totalPages > 1 && (
            <CardFooter className="flex justify-between items-center border-t border-gray-100 px-4 py-2">
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                {Math.min(pagination.page * pagination.pageSize, pagination.totalCalls)} of {pagination.totalCalls}{" "}
                calls
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className={pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {/* First page */}
                  {pagination.page > 2 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Ellipsis if needed */}
                  {pagination.page > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Previous page if not first */}
                  {pagination.page > 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(pagination.page - 1)}>
                        {pagination.page - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Current page */}
                  <PaginationItem>
                    <PaginationLink isActive>{pagination.page}</PaginationLink>
                  </PaginationItem>

                  {/* Next page if not last */}
                  {pagination.page < pagination.totalPages && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(pagination.page + 1)}>
                        {pagination.page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Ellipsis if needed */}
                  {pagination.page < pagination.totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Last page if not current or next */}
                  {pagination.page < pagination.totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(pagination.totalPages)}>
                        {pagination.totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className={
                        pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
