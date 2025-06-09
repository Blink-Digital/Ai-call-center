"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Phone, Search, Plus, RefreshCw, AlertCircle, Copy, MoreVertical } from "lucide-react"
import { formatPhoneNumber } from "@/utils/phone-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useUserPhoneNumbers } from "@/hooks/use-user-data"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"

export default function PhoneNumbersPage() {
  const { phoneNumbers, loading, error, refetch } = useUserPhoneNumbers()

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Your Phone Numbers" description="Manage your purchased phone numbers" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your phone numbers...</p>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Your Phone Numbers"
        description={`You have ${phoneNumbers.length} phone number${phoneNumbers.length !== 1 ? "s" : ""} in your account`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search numbers..."
              className="pl-10 w-64 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Button onClick={refetch} variant="outline" disabled={loading} className="border-gray-200 hover:bg-gray-50">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/dashboard/phone-numbers/purchase">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Purchase Number
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="ml-4 border-red-200 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!error && phoneNumbers.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Phone Numbers</h3>
            <p className="text-gray-600 text-center mb-8 max-w-md">
              Purchase your first phone number to start creating call flows and pathways.
            </p>
            <Link href="/dashboard/phone-numbers/purchase">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Purchase Your First Number
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Phone Numbers Table */
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <CardTitle className="text-lg font-semibold text-gray-900">Phone Numbers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700 text-sm">Phone Number</th>
                    <th className="text-left p-4 font-medium text-gray-700 text-sm">Location</th>
                    <th className="text-left p-4 font-medium text-gray-700 text-sm">Type</th>
                    <th className="text-left p-4 font-medium text-gray-700 text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-gray-700 text-sm">Purchase Date</th>
                    <th className="text-left p-4 font-medium text-gray-700 text-sm">Monthly Fee</th>
                    <th className="text-left p-4 font-medium text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {phoneNumbers.map((number, index) => (
                    <tr
                      key={number.id}
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Phone className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{formatPhoneNumber(number.number)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{number.location || "Unknown"}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {number.type || "Voice"}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            number.status?.toLowerCase() === "active" || number.status?.toLowerCase() === "purchased"
                              ? "default"
                              : "outline"
                          }
                          className={
                            number.status?.toLowerCase() === "active" || number.status?.toLowerCase() === "purchased"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        >
                          {number.status || "Available"}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-600">
                        {number.created_at ? new Date(number.created_at).toLocaleDateString() : "Unknown"}
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-gray-900">$5</span>
                        <span className="text-gray-500 text-sm">/month</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(number.number)}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/pathway/${encodeURIComponent(number.number.replace(/\D/g, ""))}`}
                                >
                                  Manage Pathway
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/call-history?number=${encodeURIComponent(number.number)}`}>
                                  View Call History
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {phoneNumbers.length} of {phoneNumbers.length} phone number
                {phoneNumbers.length !== 1 ? "s" : ""}
              </div>
              <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
                Export List
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
