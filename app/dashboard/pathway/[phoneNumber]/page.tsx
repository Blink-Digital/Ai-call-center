"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FlowchartBuilder } from "@/components/flowchart-builder/flowchart-builder"
import { formatPhoneNumber } from "@/utils/phone-utils"
import { supabase } from "@/lib/supabase"

interface PathwayEditorPageProps {
  params: {
    phoneNumber: string
  }
}

export default function PathwayEditorPage({ params }: PathwayEditorPageProps) {
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
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch(`/api/phone-numbers/${phoneNumber}/pathway?userId=${user.id}`)
      const result = await response.json()

      if (result.success) {
        setPathwayInfo(result.data)
      }
    } catch (error) {
      console.error("Error fetching pathway info:", error)
    } finally {
      setIsLoadingPathway(false)
    }
  }

  useEffect(() => {
    if (phoneNumber) {
      fetchPathwayInfo()
    }
  }, [phoneNumber])

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
        <FlowchartBuilder phoneNumber={phoneNumber} />
      </div>
    </div>
  )
}
