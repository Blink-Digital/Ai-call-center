"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Phone, Search, Plus, RefreshCw, AlertCircle, Copy, ArrowRight, LogIn } from "lucide-react"
import { formatPhoneNumber } from "@/utils/phone-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/auth-helpers-nextjs"

interface PhoneNumberWithPathway {
  id: string
  number: string
  pathway_id?: string | null
  pathway_name?: string | null
  pathway_description?: string | null
  status: string
  location?: string | null
  created_at: string
  user_id: string
}

export default function PathwaysPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberWithPathway[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [initialized, setInitialized] = useState(false)

  const supabase = createClientComponentClient()
  const router = useRouter()

  // Normalize phone number for URL encoding
  const normalizePhone = (phone: string): string => {
    return phone.replace(/\D/g, "")
  }

  // Simple, clean auth check - no manual cookie parsing
  const initializeAuth = async () => {
    try {
      console.log("🔍 Initializing auth...")

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error("❌ Auth error:", error.message)
        throw error
      }

      if (user) {
        console.log("✅ User authenticated:", user.email)
        setUser(user)
        return user
      } else {
        console.log("❌ No user found")
        return null
      }
    } catch (err) {
      console.error("❌ Auth initialization failed:", err)
      return null
    } finally {
      setInitialized(true)
    }
  }

  // Fetch pathways data
  const fetchPathwaysData = async (currentUser: User) => {
    try {
      setLoading(true)
      setError(null)

      console.log("📞 Fetching phone numbers for user:", currentUser.id)

      const { data: phones, error: phonesError } = await supabase
        .from("phone_numbers")
        .select(`
          id,
          number,
          pathway_id,
          pathway_name,
          pathway_description,
          status,
          location,
          created_at,
          user_id
        `)
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })

      if (phonesError) {
        console.error("❌ Database error:", phonesError)
        throw new Error(`Failed to fetch phone numbers: ${phonesError.message}`)
      }

      console.log("✅ Phone numbers fetched:", phones?.length || 0)
      setPhoneNumbers(phones || [])
    } catch (err) {
      console.error("❌ Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to load pathway data")
    } finally {
      setLoading(false)
    }
  }

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const currentUser = await initializeAuth()
      if (currentUser) {
        await fetchPathwaysData(currentUser)
      } else {
        setLoading(false)
      }
    }

    init()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event)

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        setInitialized(true)
        await fetchPathwaysData(session.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setPhoneNumbers([])
        setInitialized(true)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleRefresh = async () => {
    console.log("🔄 Refreshing data...")
    if (user) {
      await fetchPathwaysData(user)
    } else {
      const currentUser = await initializeAuth()
      if (currentUser) {
        await fetchPathwaysData(currentUser)
      }
    }
  }

  const handleLogin = () => {
    router.push("/login")
  }

  // Show loading while initializing
  if (!initialized) {
    return (
      <PageContainer>
        <PageHeader title="My Pathways" description="Manage call flow pathways for your phone numbers" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </PageContainer>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="My Pathways" description="Manage call flow pathways for your phone numbers" />
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <LogIn className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600 text-center mb-4 max-w-md">
              Please log in to view and manage your call flow pathways.
            </p>
            <p className="text-sm text-gray-500 text-center mb-8 max-w-md">
              If you're already logged in, try refreshing the page or clicking retry below.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleRefresh} variant="outline" className="border-gray-300">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
                <LogIn className="h-4 w-4 mr-2" />
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  // Show loading while fetching data
  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          title="My Pathways"
          description={`Manage call flow pathways for your phone numbers (User: ${user.email})`}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your pathways...</p>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="My Pathways"
        description={`Manage call flow pathways for your phone numbers (User: ${user.email})`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search pathways..."
              className="pl-10 w-64 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={loading}
            className="border-gray-200 hover:bg-gray-50"
          >
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
              onClick={handleRefresh}
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
        /* Pathways Grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {phoneNumbers.map((phoneNumber) => {
            const normalizedPhone = normalizePhone(phoneNumber.number)
            const hasPathway = phoneNumber.pathway_id && phoneNumber.pathway_name

            return (
              <Card key={phoneNumber.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {formatPhoneNumber(phoneNumber.number)}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{phoneNumber.location || "Massachusetts"} • voice</p>
                      </div>
                    </div>
                    <Badge
                      variant="default"
                      className={
                        phoneNumber.status === "active"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }
                    >
                      {phoneNumber.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    One pathway per phone number
                  </div>

                  {hasPathway ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">PATHWAY ID</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 font-mono flex-1 truncate">
                            {phoneNumber.pathway_id}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              phoneNumber.pathway_id && navigator.clipboard.writeText(phoneNumber.pathway_id)
                            }
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          PATHWAY NAME
                        </label>
                        <p className="text-sm font-medium text-gray-900 mt-1">{phoneNumber.pathway_name}</p>
                      </div>

                      {phoneNumber.pathway_description && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            DESCRIPTION
                          </label>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{phoneNumber.pathway_description}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Purchased: {new Date(phoneNumber.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                      No pathway configured yet
                    </div>
                  )}

                  <Link href={`/dashboard/pathway/${encodeURIComponent(normalizedPhone)}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Manage Pathway
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
