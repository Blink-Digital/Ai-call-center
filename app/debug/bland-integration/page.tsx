"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"

interface DebugInfo {
  debug_info: {
    api_key_configured: boolean
    api_key_prefix: string
    account_response: {
      status: number
      ok: boolean
      data: any
      raw_text: string
    }
    numbers_response: {
      status: number
      ok: boolean
      raw_text: string
    }
    bland_numbers: any[]
    supabase_numbers: any[]
    supabase_error: any
    test_formats: Array<{
      description: string
      value: string
    }>
    user_id: string
  }
}

export default function BlandIntegrationDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  const fetchDebugInfo = async () => {
    try {
      setError(null)
      const res = await fetch("/api/bland-ai/debug/numbers")
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch debug info")
      }

      setDebugInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const testCallsEndpoint = async (phoneNumber: string, description: string) => {
    try {
      const res = await fetch(`/api/bland-ai/calls?to_number=${encodeURIComponent(phoneNumber)}`)
      const data = await res.json()

      setTestResults((prev) => ({
        ...prev,
        [description]: {
          status: res.status,
          ok: res.ok,
          data: data,
          phone_number: phoneNumber,
        },
      }))
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [description]: {
          status: 0,
          ok: false,
          error: err instanceof Error ? err.message : "Unknown error",
          phone_number: phoneNumber,
        },
      }))
    }
  }

  useEffect(() => {
    const loadDebugInfo = async () => {
      setLoading(true)
      await fetchDebugInfo()
      setLoading(false)
    }

    loadDebugInfo()
  }, [])

  const getStatusIcon = (ok: boolean) => {
    return ok ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Bland.ai Integration Debug</h1>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Bland.ai Integration Debug</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center p-6 text-center">
              <div className="text-red-500">
                <p className="font-medium">Error loading debug information</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bland.ai Integration Debug</h1>
        <Button onClick={fetchDebugInfo} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(debugInfo?.debug_info.api_key_configured || false)}
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>API Key Configured:</span>
              <Badge variant={debugInfo?.debug_info.api_key_configured ? "default" : "destructive"}>
                {debugInfo?.debug_info.api_key_configured ? "Yes" : "No"}
              </Badge>
            </div>
            {debugInfo?.debug_info.api_key_prefix && (
              <div className="flex items-center justify-between">
                <span>API Key Prefix:</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{debugInfo.debug_info.api_key_prefix}</code>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(debugInfo?.debug_info.account_response.ok || false)}
            Bland.ai Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Account API Status:</span>
              <Badge variant={debugInfo?.debug_info.account_response.ok ? "default" : "destructive"}>
                {debugInfo?.debug_info.account_response.status}
              </Badge>
            </div>
            {debugInfo?.debug_info.account_response.data && (
              <div>
                <h4 className="font-medium mb-2">Account Data:</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {JSON.stringify(debugInfo.debug_info.account_response.data, null, 2)}
                </pre>
              </div>
            )}
            <div>
              <h4 className="font-medium mb-2">Raw Response:</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                {debugInfo?.debug_info.account_response.raw_text}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phone Numbers Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(debugInfo?.debug_info.numbers_response.ok || false)}
            Phone Numbers Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Numbers in Bland.ai Account:</h4>
              {debugInfo?.debug_info.bland_numbers.length ? (
                <div className="space-y-2">
                  {debugInfo.debug_info.bland_numbers.map((number, index) => (
                    <div key={index} className="text-sm bg-green-50 p-2 rounded">
                      {typeof number === "string" ? number : JSON.stringify(number)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground bg-yellow-50 p-2 rounded">
                  No numbers found in Bland.ai account
                </div>
              )}
              <div className="mt-2">
                <h5 className="text-sm font-medium">Raw API Response:</h5>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                  {debugInfo?.debug_info.numbers_response.raw_text}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Numbers in Supabase Database:</h4>
              {debugInfo?.debug_info.supabase_numbers?.length ? (
                <div className="space-y-2">
                  {debugInfo.debug_info.supabase_numbers.map((number, index) => (
                    <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                      <div>
                        <strong>Number:</strong> {number.number}
                      </div>
                      <div>
                        <strong>Status:</strong> {number.status}
                      </div>
                      <div>
                        <strong>Type:</strong> {number.type}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground bg-yellow-50 p-2 rounded">
                  No numbers found in database
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Format Testing */}
      {debugInfo?.debug_info.test_formats && debugInfo.debug_info.test_formats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Phone Number Format Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Test different phone number formats to see which one works with Bland.ai:
              </p>
              <div className="grid gap-3">
                {debugInfo.debug_info.test_formats.map((format, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{format.description}</div>
                      <code className="text-sm text-muted-foreground">{format.value}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      {testResults[format.description] && (
                        <Badge
                          variant={testResults[format.description].ok ? "default" : "destructive"}
                          className="mr-2"
                        >
                          {testResults[format.description].status}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => testCallsEndpoint(format.value, format.description)}
                        variant="outline"
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(testResults).length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Test Results:</h4>
                  <div className="space-y-2">
                    {Object.entries(testResults).map(([description, result]) => (
                      <div key={description} className="text-sm bg-gray-50 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(result.ok)}
                          <strong>{description}</strong>
                          <Badge variant={result.ok ? "default" : "destructive"}>{result.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">Phone: {result.phone_number}</div>
                        {result.data && (
                          <pre className="text-xs mt-2 overflow-auto max-h-32">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        )}
                        {result.error && <div className="text-red-500 text-xs mt-1">{result.error}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
