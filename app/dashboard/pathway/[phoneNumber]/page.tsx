"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FlowchartBuilder } from "@/components/flowchart-builder/flowchart-builder"
import { formatPhoneNumber } from "@/utils/phone-utils"

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
  const [formattedNumber, setFormattedNumber] = useState<string>("")
  const [pathwayInfo, setPathwayInfo] = useState<any>(null)
  const [isLoadingPathway, setIsLoadingPathway] = useState(true)

  // CRITICAL FIX: Properly extract and validate phone number
  const rawPhoneNumber = params?.phoneNumber
  const phoneNumber = rawPhoneNumber ? decodeURIComponent(rawPhoneNumber) : null

  console.log("[PATHWAY-PAGE] 🔍 Raw params:", params)
  console.log("[PATHWAY-PAGE] 📞 Decoded phone number:", phoneNumber)

  // Helper function to normalize phone numbers
  const normalizePhone = (phone: string) => {
    if (!phone) return ""
    return phone.replace(/\D/g, "")
  }

  useEffect(() => {
    // VALIDATION: Check if phoneNumber is valid
    if (!phoneNumber || phoneNumber === "undefined" || phoneNumber === "null") {
      console.error("[PATHWAY-PAGE] ❌ Invalid phone number:", phoneNumber)
      router.push("/dashboard/phone-numbers") // Redirect to phone numbers page
      return
    }

    // Format the phone number for display
    try {
      const normalizedNumber = normalizePhone(phoneNumber)
      const e164Number = normalizedNumber.startsWith("1") ? `+${normalizedNumber}` : `+1${normalizedNumber}`
      setFormattedNumber(formatPhoneNumber(e164Number))
    } catch (error) {
      console.error("[PATHWAY-PAGE] ❌ Error formatting phone number:", error)
      setFormattedNumber(phoneNumber) // Fallback to raw phone number
    }
  }, [phoneNumber, router])

  // Rest of the fetchPathwayInfo function remains the same but with better validation
  const fetchPathwayInfo = async () => {
    // GUARD: Don't fetch if phone number is invalid
    if (!phoneNumber || phoneNumber === "undefined" || phoneNumber === "null") {
      console.error("[PATHWAY-PAGE] ❌ Cannot fetch pathway info - invalid phone number")
      setIsLoadingPathway(false)
      return
    }

    try {
      // If pathway info is passed via URL params, use it directly
      if (searchParams?.pathwayId) {
        console.log("[PATHWAY-PAGE] ✅ Using pathway info from URL params")
        setPathwayInfo({
          pathway_id: searchParams.pathwayId,
          pathway_name: searchParams.pathwayName || null,
        })
        setIsLoadingPathway(false)
        return
      }

      // Use normalized phone number for API calls
      const normalizedPhone = normalizePhone(phoneNumber)
      console.log("[PATHWAY-PAGE] 🔍 Fetching pathway info for normalized phone:", normalizedPhone)

      const response = await fetch(`/api/lookup-pathway?phone=${encodeURIComponent(normalizedPhone)}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.pathway_id) {
        setPathwayInfo({
          pathway_id: result.pathway_id,
          pathway_name: result.pathway_name,
          pathway_description: result.pathway_description,
        })
      } else {
        console.log("[PATHWAY-PAGE] ℹ️ No existing pathway found")
        setPathwayInfo(null)
      }
    } catch (error) {
      console.error("[PATHWAY-PAGE] ❌ Error fetching pathway info:", error)
      setPathwayInfo(null)
    } finally {
      setIsLoadingPathway(false)
    }
  }

  useEffect(() => {
    if (phoneNumber && phoneNumber !== "undefined") {
      fetchPathwayInfo()
    }
  }, [phoneNumber, searchParams?.pathwayId])

  const handleAIGeneratorClick = () => {
    if (!phoneNumber || phoneNumber === "undefined") {
      router.push("/dashboard/call-flows/generate")
      return
    }
    router.push(`/dashboard/call-flows/generate?phoneNumber=${phoneNumber}`)
  }

  // Show loading or error state for invalid phone number
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
          {pathwayInfo?.pathway_id && (
            <div className="text-sm text-gray-600">
              Pathway: {pathwayInfo.pathway_name || pathwayInfo.pathway_id}
              {pathwayInfo.last_deployed_at && (
                <span className="ml-2">
                  (Last deployed: {new Date(pathwayInfo.last_deployed_at).toLocaleDateString()})
                </span>
              )}
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
