"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FlowchartBuilder } from "@/components/flowchart-builder/flowchart-builder"
import { toast } from "@/components/ui/use-toast"
import { convertApiResponseToFlowchart } from "@/utils/api-to-flowchart-converter"
import { FullScreenContainer } from "@/components/layout/full-screen-container"

export default function FlowchartEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const source = searchParams.get("source")
  const phoneNumber = searchParams.get("phoneNumber")

  const [flowName, setFlowName] = useState("")
  const [flowData, setFlowData] = useState(null)
  const [apiResponse, setApiResponse] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If there's a phone number, redirect to the specific pathway
    if (phoneNumber) {
      router.replace(`/dashboard/pathway/${phoneNumber}${source ? `?source=${source}` : ""}`)
    } else {
      // Otherwise, redirect to the general pathway page
      router.replace("/dashboard/pathway")
    }

    // Check if we have a generated pathway in localStorage
    if (source === "generated") {
      try {
        const generatedData = JSON.parse(localStorage.getItem("generatedPathway") || "{}")

        if (generatedData) {
          if (generatedData.flowchartData) {
            // If we already have converted flowchart data, use it
            setFlowData(generatedData.flowchartData)
            setApiResponse(generatedData.apiResponse)
            setFlowName(generatedData.flowName || "Generated Flow")
          } else if (generatedData.apiResponse || generatedData.pathway) {
            // If we only have the API response, convert it
            const apiData = generatedData.apiResponse || generatedData.pathway
            try {
              const convertedData = convertApiResponseToFlowchart(apiData)
              setFlowData(convertedData)
              setApiResponse(apiData)
              setFlowName(generatedData.flowName || "Generated Flow")

              // Update localStorage with the converted data
              localStorage.setItem(
                "generatedPathway",
                JSON.stringify({
                  ...generatedData,
                  flowchartData: convertedData,
                }),
              )
            } catch (conversionError) {
              console.error("Error converting API response:", conversionError)
              setError("Failed to convert API response to flowchart format")
            }
          } else {
            setError("No valid pathway data found")
          }
        } else {
          setError("No generated pathway found")
        }
      } catch (error) {
        console.error("Error loading generated pathway:", error)
        setError("Failed to load the generated pathway")
      } finally {
        setIsLoading(false)
      }
    } else {
      // Handle other sources or direct access
      setIsLoading(false)
    }
  }, [router, phoneNumber, source])

  const handleSave = () => {
    if (!flowData) {
      toast({
        title: "No flow data",
        description: "There is no flow data to save",
        variant: "destructive",
      })
      return
    }

    try {
      // Save the flow data to localStorage
      const flowToSave = {
        ...flowData,
        name: flowName,
        description: `Generated from prompt: ${JSON.parse(localStorage.getItem("generatedPathway") || "{}").prompt || ""}`,
      }

      localStorage.setItem("bland-flowchart", JSON.stringify(flowToSave))

      toast({
        title: "Flow saved",
        description: `"${flowName}" has been saved successfully`,
      })

      // Navigate back to the call flows page
      router.push("/dashboard/call-flows")
    } catch (error) {
      console.error("Error saving flow:", error)
      toast({
        title: "Error saving flow",
        description: "Failed to save the flow",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <FullScreenContainer>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </FullScreenContainer>
    )
  }

  if (error) {
    return (
      <FullScreenContainer>
        <div className="flex flex-col items-center justify-center h-full p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p>{error}</p>
          </div>
          <Button onClick={() => router.push("/dashboard/call-flows/generate")}>Return to Generator</Button>
        </div>
      </FullScreenContainer>
    )
  }

  return (
    <FullScreenContainer>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/call-flows")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold">Edit Call Flow</h1>
              <div className="flex items-center gap-2">
                <Label htmlFor="flowName" className="sr-only">
                  Flow Name
                </Label>
                <Input
                  id="flowName"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  className="w-80"
                  placeholder="Enter flow name"
                />
                <Button onClick={handleSave} className="flex items-center gap-1">
                  <Save className="h-4 w-4" />
                  Save Flow
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {flowData ? (
            <FlowchartBuilder initialData={flowData} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No flow data available</p>
            </div>
          )}
        </div>
      </div>
    </FullScreenContainer>
  )
}
