"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, Bug } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { convertApiResponseToFlowchart } from "@/utils/api-to-flowchart-converter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UseCasePromptProps {
  phoneNumber?: string | null
}

export default function UseCasePrompt({ phoneNumber }: UseCasePromptProps) {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [model, setModel] = useState("openai/gpt-4o-mini")
  const [debugMode, setDebugMode] = useState(false)
  const [rawResponse, setRawResponse] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("prompt")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("UseCasePrompt received phoneNumber:", phoneNumber)
  }, [phoneNumber])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a description of your call flow.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setError(null)
    setRawResponse(null)

    try {
      console.log("Generating pathway with prompt:", prompt)
      console.log("Using model:", model)
      console.log("Debug mode:", debugMode)
      console.log("For phone number:", phoneNumber || "No phone number provided")

      // Use the absolute URL for the API endpoint
      const apiUrl = "/api/generate-pathway"
      console.log("Calling API at:", apiUrl)

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model,
          debug: debugMode,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error("API error:", responseData)

        // If we have debug data, show it
        if (responseData.rawContent || responseData.details) {
          setRawResponse(responseData)
          setActiveTab("debug")
        }

        throw new Error(responseData.message || responseData.error || "Failed to generate pathway")
      }

      console.log("API response received:", responseData)

      // If debug mode is enabled and we have debug data, save it
      if (debugMode && responseData._debug) {
        setRawResponse(responseData)
      }

      // Remove any debug data before converting to flowchart
      const apiResponse = { ...responseData }
      delete apiResponse._debug

      try {
        const flowchartData = convertApiResponseToFlowchart(apiResponse)
        console.log("Converted to flowchart data:", flowchartData)

        const generatedPathway = {
          prompt,
          apiResponse,
          flowchartData,
          flowName: `Generated from: ${prompt.substring(0, 30)}...`,
          timestamp: new Date().toISOString(),
        }

        if (phoneNumber) {
          const storageKey = `bland-flowchart-${phoneNumber}`
          localStorage.setItem(storageKey, JSON.stringify(flowchartData))
          console.log("Saved flowchart data to localStorage with key:", storageKey)

          localStorage.setItem("generatedPathway", JSON.stringify(generatedPathway))
          localStorage.setItem("flowchartData", JSON.stringify(flowchartData))

          toast({
            title: "Flowchart generated",
            description: "Your flowchart has been generated and inserted into the pathway.",
          })

          router.push(`/dashboard/pathway/${phoneNumber}`)
        } else {
          localStorage.setItem("generatedPathway", JSON.stringify(generatedPathway))
          localStorage.setItem("flowchartData", JSON.stringify(flowchartData))

          toast({
            title: "Flowchart generated",
            description: "Your flowchart has been generated. Redirecting to editor...",
          })

          router.push("/dashboard/call-flows/editor?source=generated")
        }
      } catch (conversionError) {
        console.error("Error converting API response to flowchart:", conversionError)
        setError(`Error converting API response: ${conversionError.message}`)
        setActiveTab("debug")
      }
    } catch (error) {
      console.error("Error generating pathway:", error)
      setError(error instanceof Error ? error.message : "Failed to generate pathway")
      setActiveTab("debug")

      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate pathway",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          {(rawResponse || error) && <TabsTrigger value="debug">Debug</TabsTrigger>}
        </TabsList>

        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle>Describe Your Call Flow</CardTitle>
              <CardDescription>
                Provide a detailed description of what you want your call flow to do. Include any specific questions,
                responses, or logic you want to include.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Create a call flow for qualifying Medicare leads. Ask if they're on Medicare, their age, and collect their contact information. If they're under 65, transfer to an agent. If they're over 65, thank them and end the call."
                    className="min-h-[200px]"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">AI Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai/gpt-4o-mini">GPT-4o Mini (Faster)</SelectItem>
                      <SelectItem value="openai/gpt-4o">GPT-4o (More Detailed)</SelectItem>
                      <SelectItem value="anthropic/claude-3-opus:beta">Claude 3 Opus (Most Detailed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="debug-mode" checked={debugMode} onCheckedChange={setDebugMode} />
                  <Label htmlFor="debug-mode" className="cursor-pointer">
                    <div className="flex items-center gap-1">
                      <Bug className="h-4 w-4" />
                      <span>Debug Mode</span>
                    </div>
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setPrompt("")}>
                Clear
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Call Flow
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Example Prompts</CardTitle>
              <CardDescription>Click on any of these examples to use them as a starting point.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {[
                  "Create a call flow for qualifying Medicare leads. Ask if they're on Medicare, their age, and collect their contact information. If they're under 65, transfer to an agent. If they're over 65, thank them and end the call.",
                  "Build a call flow for a dental office that schedules appointments. Ask for the patient's name, reason for visit, and preferred date and time. Collect their phone number and email for confirmation.",
                  "Design a call flow for a real estate agent that qualifies potential home buyers. Ask about their budget, preferred location, timeline for purchase, and whether they're pre-approved for a mortgage. Collect their contact information for follow-up.",
                ].map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start h-auto p-4 text-left"
                    onClick={() => setPrompt(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>Raw API response and error details for debugging purposes.</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
                  <h3 className="font-semibold mb-2">Error</h3>
                  <p>{error}</p>
                </div>
              )}

              {rawResponse && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Raw API Response</h3>
                  <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[500px]">
                    <pre className="text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(rawResponse, null, 2)}
                    </pre>
                  </div>

                  {rawResponse.rawContent && (
                    <>
                      <h3 className="font-semibold">Raw Content from AI</h3>
                      <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[300px]">
                        <pre className="text-xs whitespace-pre-wrap break-words">{rawResponse.rawContent}</pre>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="mt-6">
                <h3 className="font-semibold mb-2">Troubleshooting Steps</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Check if the API response contains valid JSON</li>
                  <li>Verify that customer-response nodes have the correct structure</li>
                  <li>Ensure all edges are properly connected to nodes</li>
                  <li>Check for missing required fields in nodes</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setActiveTab("prompt")} className="mr-2">
                Back to Prompt
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
