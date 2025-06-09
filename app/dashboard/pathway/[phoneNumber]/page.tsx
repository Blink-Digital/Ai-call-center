"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { FlowchartBuilder } from "@/components/flowchart-builder/flowchart-builder"
import { formatPhoneNumber } from "@/utils/phone-utils"
import { lookupPathwayIdClientSide, lookupPathwayIdDirectSupabase } from "@/lib/client-pathway-lookup"

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
  const [error, setError] = useState<string | null>(null)

  // Decode and validate phone number
  const rawPhoneNumber = params?.phoneNumber
  const phoneNumber = rawPhoneNumber ? decodeURIComponent(rawPhoneNumber) : null

  console.log("[PATHWAY-PAGE] 🔍 Raw params:", params)
  console.log("[PATHWAY-PAGE] 📞 Decoded phone number:", phoneNumber)

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

  const fetchPathwayInfo = async () => {
    if (!phoneNumber || phoneNumber === "undefined" || phoneNumber === "null") {
      console.error("[PATHWAY-PAGE] ❌ Cannot fetch pathway info - invalid phone number")
      setError("Invalid phone number")
      setIsLoadingPathway(false)
      return
    }

    try {
      setError(null)
      console.log("[PATHWAY-PAGE] 🔍 Fetching pathway info...")

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

      // Try API route first
      console.log("[PATHWAY-PAGE] 🔄 Trying API route lookup...")
      const apiResult = await lookupPathwayIdClientSide(phoneNumber)

      if (apiResult.error) {
        console.warn("[PATHWAY-PAGE] ⚠️ API route failed, trying direct Supabase:", apiResult.error)
        
        // Fallback to direct Supabase query
        const directResult = await lookupPathwayIdDirectSupabase(phoneNumber)
        
        if (directResult.error) {
          console.error("[PATHWAY-PAGE] ❌ Both methods failed:", directResult.error)
          setError(directResult.error)
        } else {
          console.log("[PATHWAY-PAGE] ✅ Direct Supabase success:", directResult)
          setPathwayInfo(directResult)
        }
      } else {
        console.log("[PATHWAY-PAGE] ✅ API route success:", apiResult)
        setPathwayInfo(apiResult)
      }
    } catch (error) {
      console.error("[PATHWAY-PAGE] ❌ Error fetching pathway info:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
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
      
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="text-red-800">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}
      
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
