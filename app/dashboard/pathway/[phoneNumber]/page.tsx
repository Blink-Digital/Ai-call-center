"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPhoneNumber } from "@/utils/phone-utils"
import { useAuth } from "@/contexts/auth-context"
import dynamic from "next/dynamic"

// ✅ FIX: Use dynamic import to prevent SSR issues and hook call errors
const FlowchartBuilder = dynamic(() => import("@/components/flowchart-builder/flowchart-builder"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading flowchart builder...</p>
      </div>
    </div>
  ),
})

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
  const [isInitialized, setIsInitialized] = useState(false)

  // Decode and validate phone number
  const rawPhoneNumber = params?.phoneNumber
  const phoneNumber = rawPhoneNumber ? decodeURIComponent(rawPhoneNumber) : null

  console.log("[PATHWAY-PAGE] 🔍 Raw params:", params)
  console.log("[PATHWAY-PAGE] 📞 Decoded phone number:", phoneNumber)
  console.log("[PATHWAY-PAGE] 👤 Auth user:", user?.email)
  console.log("[PATHWAY-PAGE] 🔄 Auth loading:", authLoading)
  console.log("[PATHWAY-PAGE] 🎯 Is initialized:", isInitialized)

  useEffect(() => {
    // Validate phone number
    if (!phoneNumber || phoneNumber === "undefined" || phoneNumber === "null") {
      console.error("[PATHWAY-PAGE] ❌ Invalid phone number:", phoneNumber)
      setError("Invalid phone number")
      setIsLoadingPathway(false)
      setIsInitialized(true)
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

  const fetchPathwayInfo = async () => {
    if (!phoneNumber || phoneNumber === "undefined" || phoneNumber === "null") {
      console.error("[PATHWAY-PAGE] ❌ Cannot fetch pathway info - invalid phone number")
      setError("Invalid phone number")
      setIsLoadingPathway(false)
      setIsInitialized(true)
      return
    }

    // Wait for auth to be ready
    if (authLoading) {
      console.log("[PATHWAY-PAGE] ⏳ Waiting for auth to load...")
      return
    }

    if (!user) {
      console.error("[PATHWAY-PAGE] ❌ No authenticated user")
      setError("Authentication required. Please log in.")
      setIsLoadingPathway(false)
      setIsInitialized(true)
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
        setIsInitialized(true)
        return
      }

      // ✅ CRITICAL: Ensure proper cookie handling
      console.log("[PATHWAY-PAGE] 📡 Making API request with phone:", phoneNumber)
      const response = await fetch(`/api/lookup-pathway?phone=${encodeURIComponent(phoneNumber)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ CRITICAL: Include cookies for authentication
      })

      console.log("[PATHWAY-PAGE] 📊 Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[PATHWAY-PAGE] ❌ API error:", response.status, errorText)

        if (response.status === 401) {
          setError("Authentication failed. Please refresh the page and log in again.")
        } else if (response.status === 404) {
          console.log("[PATHWAY-PAGE] ℹ️ No existing pathway found - will create new")
          setPathwayInfo(null) // This will trigger "Create New" mode
        } else {
          setError(`API error: ${response.status} - ${errorText}`)
        }
        setIsLoadingPathway(false)
        setIsInitialized(true)
        return
      }

      const result = await response.json()
      console.log("[PATHWAY-PAGE] ✅ API response:", result)

      if (result.success && result.pathway_id) {
        console.log("[PATHWAY-PAGE] 🎯 PATHWAY FOUND:", result.pathway_id)
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
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsLoadingPathway(false)
      setIsInitialized(true)
    }
  }

  useEffect(() => {
    if (phoneNumber && phoneNumber !== "undefined" && !isInitialized) {
      fetchPathwayInfo()
    }
  }, [phoneNumber, searchParams?.pathwayId, user, authLoading, isInitialized])

  const handleAIGeneratorClick = () => {
    if (!phoneNumber || phoneNumber === "undefined") {
      router.push("/dashboard/call-flows/generate")
      return
    }
    router.push(`/dashboard/call-flows/generate?phoneNumber=${phoneNumber}`)
  }

  // ✅ CRITICAL: Only show loading if we're actually loading AND not initialized
  if (authLoading && !isInitialized) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // ✅ CRITICAL: Only show auth required if we're initialized and no user
  if (isInitialized && !user) {
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

  // ✅ CRITICAL: Only render the main content if we're initialized
  if (!isInitialized) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing pathway editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Compact Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/pathway")} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Pathway for {formattedNumber}</h1>
            {pathwayInfo?.pathway_name && (
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{pathwayInfo.pathway_name}</span>
            )}
          </div>
        </div>
        <Button variant="outline" className="gap-2 text-sm bg-transparent" onClick={handleAIGeneratorClick}>
          <Sparkles className="h-4 w-4" />
          AI Generator
        </Button>
      </div>

      {error && (
        <div className="px-6 py-2 bg-red-50 border-b border-red-200">
          <div className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Full-height FlowchartBuilder */}
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
