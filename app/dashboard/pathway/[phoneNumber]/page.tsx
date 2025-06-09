"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FlowchartBuilder } from "@/components/flowchart-builder/flowchart-builder"
import { formatPhoneNumber } from "@/utils/phone-utils"
import { lookupPathwayIdClientSide } from "@/lib/client-pathway-lookup"

interface PathwayEditorPageProps {
  params: {
    phoneNumber: string
  }
}

export default function PathwayEditorPage({ params }: PathwayEditorPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { phoneNumber } = params

  const [formattedNumber, setFormattedNumber] = useState<string>("")
  const [pathwayInfo, setPathwayInfo] = useState<any>(null)
  const [isLoadingPathway, setIsLoadingPathway] = useState(true)

  // Check if pathway info was passed via URL params (optimization)
  const preloadedPathwayId = searchParams.get("pathwayId")
  const preloadedPathwayName = searchParams.get("pathwayName")

  useEffect(() => {
    // Format the phone number for display
    if (phoneNumber) {
      const e164Number = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber}`
      setFormattedNumber(formatPhoneNumber(e164Number))
    }
  }, [phoneNumber])

  const fetchPathwayInfo = async () => {
    try {
      // If pathway info was passed via URL params, use it directly (optimization)
      if (preloadedPathwayId) {
        console.log("[PATHWAY-PAGE] ✅ Using preloaded pathway info from URL")
        setPathwayInfo({
          pathway_id: preloadedPathwayId,
          pathway_name: preloadedPathwayName || null,
        })
        setIsLoadingPathway(false)
        return
      }

      // Otherwise, fetch from API using the fixed lookup function
      console.log("[PATHWAY-PAGE] 🔍 Fetching pathway info from API...")

      const result = await lookupPathwayIdClientSide(phoneNumber)

      if (result.error) {
        console.error("[PATHWAY-PAGE] ❌ Lookup error:", result.error)
        setPathwayInfo(null)
      } else if (result.pathway_id) {
        console.log("[PATHWAY-PAGE] ✅ Pathway found:", result.pathway_id)
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
    if (phoneNumber) {
      fetchPathwayInfo()
    }
  }, [phoneNumber, preloadedPathwayId])

  const handleAIGeneratorClick = () => {
    router.push(`/dashboard/call-flows/generate?phoneNumber=${phoneNumber}`)
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
            <div className="text-sm text-gray-600">Pathway: {pathwayInfo.pathway_name || pathwayInfo.pathway_id}</div>
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
