"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FlowchartBuilder } from "@/components/flowchart-builder/flowchart-builder"
import { formatPhoneNumber } from "@/utils/phone-utils"
import { useAuth } from "@/contexts/auth-context"

interface PathwayInfo {
  pathway_id: string | null
  pathway_name: string | null
  pathway_description: string | null
  last_deployed_at?: string
}

interface PathwayEditorPageProps {
  params: {
    phoneNumber: string
  }
  searchParams?: {
    pathwayId?: string
    pathwayName?: string
  }
}

export default function PathwayEditorPage({ params, searchParams }: PathwayEditorPageProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [formattedNumber, setFormattedNumber] = useState<string>("")
  const [pathwayInfo, setPathwayInfo] = useState<PathwayInfo | null>(null)
  const [isLoadingPathway, setIsLoadingPathway] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Decode and validate phone number
  const rawPhoneNumber = params?.phoneNumber
  const phoneNumber = rawPhoneNumber ? decodeURIComponent(rawPhoneNumber) : null

  console.log("[PATHWAY-PAGE] 🔍 Raw params:", params)
  console.log("[PATHWAY-PAGE] 📞 Decoded phone number:", phoneNumber)
  console.log("[PATHWAY-PAGE] 👤 Auth user:", user?.email)

  useEffect(() => {
    // Validate phone number
    if (!phoneNumber || phoneNumber === "undefined" || phoneNumber === "null") {
      console.error("[PATHWAY-PAGE] ❌ Invalid phone number:", phoneNumber)
      setError("Invalid phone number")
      setIsLoadingPathway(false)
      return
    }

    // Format the phone number for display
    try {
      const normalizedNumber = phoneNumber.replace(/\D/g, "")
      const e164Number = normalizedNumber.startsWith("1") ? `+${normalizedNumber}` : `+1${normalizedNumber}`
      setFormattedNumber(formatPhoneNumber(e164Number))
    } catch (error) {
      console.error("[PATHWAY-PAGE] ❌ Error formatting phone number:", error)
      setFormattedNumber(phoneNumber) // Fallback to raw phone number
    }
  }, [phoneNumber])

  // ✅ FIXED: Improved fetchPathwayInfo with silent error handling
  const fetchPathwayInfo = async () => {
    if (!phoneNumber || phoneNumber === "undefined" || phoneNumber === "null") {
      console.error("[PATHWAY-PAGE] ❌ Cannot fetch pathway info - invalid phone number")
      setError("Invalid phone number")
      setIsLoadingPathway(false)
      return
    }

    // ✅ Wait for auth to be ready
    if (authLoading) {
      console.log("[PATHWAY-PAGE] ⏳ Waiting for auth to load...")
      return
    }

    if (!user) {
      console.error("[PATHWAY-PAGE] ❌ No authenticated user")
      setError("Authentication required. Please log in.")
      setIsLoadingPathway(false)
      return
    }

    try {
      setError(null)
      console.log("[PATHWAY-PAGE] 🔍 Fetching pathway info for user:", user.email)

      // If pathway info is passed via URL params, use it directly
      if (searchParams?.pathwayId) {
        console.log("[PATHWAY-PAGE] ✅ Using pathway info from URL params")
        setPathwayInfo({
          pathway_id: searchParams.pathwayId,
          pathway_name: searchParams.pathwayName || null,
          pathway_description: null,
        })
        setIsLoadingPathway(false)
        return
      }

      // ✅ Make API call using the shared auth context (no manual session handling)
      const response = await fetch(`/api/lookup-pathway?phone=${encodeURIComponent(phoneNumber)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ Include cookies for authentication
      })

      if (!response.ok) {
        // ✅ SILENT HANDLING: Don't show error for auth failures
        if (response.status === 401) {
          console.warn("[PATHWAY-PAGE] ⚠️ Authentication failed - continuing with new pathway mode")
          setPathwayInfo(null) // This will trigger "Create New" mode
          setIsLoadingPathway(false)
          return
        }

        const errorText = await response.text()
        console.error("[PATHWAY-PAGE] ❌ API error:", response.status, errorText)

        if (response.status === 404) {
          console.log("[PATHWAY-PAGE] ℹ️ No existing pathway found - will create new")
          setPathwayInfo(null) // This will trigger "Create New" mode
        } else {
          setError(`API error: ${response.status} - ${errorText}`)
        }
        setIsLoadingPathway(false)
        return
      }

      const result = await response.json()
      console.log("[PATHWAY-PAGE] ✅ API response:", result)

      if (result.success && result.pathway_id) {
        setPathwayInfo({
          pathway_id: result.pathway_id,
          pathway_name: result.pathway_name,
          pathway_description: result.pathway_description,
          last_deployed_at: result.last_deployed_at,
        })
      } else {
        console.log("[PATHWAY-PAGE] ℹ️ No existing pathway found - will create new")
        setPathwayInfo(null) // This will trigger "Create New" mode
      }
    } catch (error) {
      console.error("[PATHWAY-PAGE] ❌ Error fetching pathway info:", error)
      // ✅ SILENT HANDLING: Don't show error for network failures
      // The user can still use the flowchart builder
      setPathwayInfo(null)
    } finally {
      setIsLoadingPathway(false)
    }
  }

  useEffect(() => {
    if (phoneNumber && phoneNumber !== "undefined") {
      fetchPathwayInfo()
    }
  }, [phoneNumber, searchParams?.pathwayId, user, authLoading])

  const handleAIGeneratorClick = () => {
    if (!phoneNumber || phoneNumber === "undefined") {
      router.push("/dashboard/call-flows/generate")
      return
    }
    router.push(`/dashboard/call-flows/generate?phoneNumber=${phoneNumber}`)
  }

  // ✅ Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // ✅ Show auth required state
  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to access the pathway editor.</p>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </div>
      </div>
    )
  }

  // Show error state for invalid phone number
  if (!phoneNumber || phoneNumber === "undefined" || phoneNumber === "null") {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Phone Number</h1>
          <p className="text-gray-600 mb-4">The phone number parameter is missing or invalid.</p>
          <Button onClick={() => router.push("/dashboard/phone-numbers")}>Go to Phone Numbers</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/pathway")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Pathway for {formattedNumber}</h1>
          {isLoadingPathway ? (
            <div className="text-sm text-gray-500">Loading pathway info...</div>
          ) : pathwayInfo?.pathway_id ? (
            <div className="text-sm text-gray-600">
              Pathway: {pathwayInfo.pathway_name || pathwayInfo.pathway_id}
              {pathwayInfo.last_deployed_at && (
                <span className="ml-2">
                  (Last deployed: {new Date(pathwayInfo.last_deployed_at).toLocaleDateString()})
                </span>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Status: <span className="font-medium text-blue-600">Will Create New Pathway</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleAIGeneratorClick}>
            <Sparkles className="h-4 w-4" />
            AI Generator
          </Button>
        </div>
      </div>

      {/* ✅ REMOVED: Error banner - errors are now handled silently */}

      <div className="flex-1 overflow-hidden">
        <FlowchartBuilder
          phoneNumber={phoneNumber}
          initialPathwayId={pathwayInfo?.pathway_id}
          initialPathwayName={pathwayInfo?.pathway_name}
        />
      </div>
    </div>
  )
}
