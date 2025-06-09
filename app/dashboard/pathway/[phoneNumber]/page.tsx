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
  const { phoneNumber } = params
  const [formattedNumber, setFormattedNumber] = useState<string>("")
  const [pathwayInfo, setPathwayInfo] = useState<any>(null)
  const [isLoadingPathway, setIsLoadingPathway] = useState(true)

  useEffect(() => {
    // Format the phone number for display
    if (phoneNumber) {
      // Add the country code if it's not there
      const e164Number = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber}`
      setFormattedNumber(formatPhoneNumber(e164Number))
    }
  }, [phoneNumber])

  const fetchPathwayInfo = async () => {
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

      // Otherwise, fetch from API
      console.log("[PATHWAY-PAGE] 🔍 Fetching pathway info from API...")

      const response = await fetch(`/api/lookup-pathway?phone=${encodeURIComponent(phoneNumber)}`, {
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
    if (phoneNumber) {
      fetchPathwayInfo()
    }
  }, [phoneNumber, searchParams?.pathwayId])

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
