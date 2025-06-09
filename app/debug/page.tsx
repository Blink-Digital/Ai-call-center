"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type ApiResponse = {
  rawResponse: string
  parsedJson: any | null
  error: string | null
  loading: boolean
  startTime?: number
  endTime?: number
}

const OPENROUTER_MODELS = [
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "openai/gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "anthropic/claude-3-sonnet", label: "Claude 3 Sonnet" },
  { value: "google/gemini-pro", label: "Google Gemini Pro" },
  { value: "meta/llama-3-8b-instruct", label: "Llama 3 8B" },
]

export default function DebugPage() {
  const [prompt, setPrompt] = useState(
    "Create a restaurant reservation system that books tables and collects customer information.",
  )
  const [response, setResponse] = useState<ApiResponse>({
    rawResponse: "",
    parsedJson: null,
    error: null,
    loading: false,
  })
  const [activeTab, setActiveTab] = useState("raw")
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o-mini")

  const handleTest = async () => {
    if (!prompt.trim()) return

    setResponse({
      rawResponse: "",
      parsedJson: null,
      error: null,
      loading: true,
      startTime: Date.now(),
    })

    try {
      const res = await fetch("/api/generate-pathway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
        }),
      })

      const rawResponse = await res.text()
      const endTime = Date.now()

      try {
        const jsonData = JSON.parse(rawResponse)
        setResponse({
          rawResponse,
          parsedJson: jsonData,
          error: jsonData.error || null,
          loading: false,
          startTime: response.startTime,
          endTime,
        })
      } catch (e) {
        setResponse({
          rawResponse,
          parsedJson: null,
          error: `Failed to parse JSON: ${e.message}`,
          loading: false,
          startTime: response.startTime,
          endTime,
        })
      }
    } catch (e) {
      setResponse({
        rawResponse: "",
        parsedJson: null,
        error: `Request failed: ${e.message}`,
        loading: false,
        startTime: response.startTime,
        endTime: Date.now(),
      })
    }
  }

  const handleSaveToEditor = () => {
    if (response.parsedJson && response.parsedJson.nodes && response.parsedJson.edges) {
      localStorage.setItem("generatedPathway", JSON.stringify(response.parsedJson))
      window.location.href = "/dashboard/call-flows/new?source=generated"
    }
  }

  const getModelLabel = (modelValue: string) => {
    return OPENROUTER_MODELS.find((m) => m.value === modelValue)?.label || modelValue
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">API Debug Tool</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test OpenRouter API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
                placeholder="Enter your prompt here..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Label htmlFor="model-select" className="mb-1 block">
                  Model
                </Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger id="model-select">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPENROUTER_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleTest} disabled={response.loading} variant="default" className="min-w-[120px]">
                {response.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test API"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {(response.rawResponse || response.error) && (
        <>
          <div className="flex items-center justify-between mb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="raw">Raw Response</TabsTrigger>
                <TabsTrigger value="formatted">Formatted JSON</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>
            </Tabs>

            {response.startTime && response.endTime && (
              <Badge variant="outline" className="ml-2">
                {((response.endTime - response.startTime) / 1000).toFixed(2)}s
              </Badge>
            )}
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Response</CardTitle>
              <CardDescription>
                Model: {getModelLabel(selectedModel)}
                {response.parsedJson && response.parsedJson.nodes && (
                  <span className="ml-2">
                    ({response.parsedJson.nodes.length} nodes, {response.parsedJson.edges?.length || 0} edges)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {response.error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
                  <h3 className="font-bold">Error</h3>
                  <p>{response.error}</p>
                </div>
              ) : null}

              {activeTab === "raw" && (
                <pre className="bg-slate-50 p-4 rounded-md overflow-auto max-h-[400px] text-sm">
                  {response.rawResponse || "No response yet"}
                </pre>
              )}

              {activeTab === "formatted" && (
                <pre className="bg-slate-50 p-4 rounded-md overflow-auto max-h-[400px] text-sm">
                  {response.parsedJson ? JSON.stringify(response.parsedJson, null, 2) : "No valid JSON found"}
                </pre>
              )}

              {activeTab === "stats" &&
                (response.parsedJson ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Response Overview</h3>
                      <ul className="list-disc pl-5 mt-2">
                        <li>Nodes: {response.parsedJson.nodes?.length || 0}</li>
                        <li>Edges: {response.parsedJson.edges?.length || 0}</li>
                        <li>Has Error: {response.parsedJson.error ? "Yes" : "No"}</li>
                        {response.parsedJson.error && <li>Error: {response.parsedJson.error}</li>}
                      </ul>
                    </div>

                    {response.parsedJson.nodes && response.parsedJson.nodes.length > 0 && (
                      <div>
                        <h3 className="font-medium">Node Types</h3>
                        <ul className="list-disc pl-5 mt-2">
                          {Object.entries(
                            response.parsedJson.nodes.reduce((acc, node) => {
                              acc[node.type] = (acc[node.type] || 0) + 1
                              return acc
                            }, {}),
                          ).map(([type, count]) => (
                            <li key={type}>
                              {type}: {count}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  "No valid JSON found"
                ))}

              {response.parsedJson && response.parsedJson.nodes && response.parsedJson.edges && (
                <div className="mt-4">
                  <Button variant="outline" onClick={handleSaveToEditor}>
                    Save to Editor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <div className="text-sm text-slate-500 mt-6">
        <p>
          This debug tool helps you test the OpenRouter API with different models. You can see the raw response,
          formatted JSON, and statistics about the generated pathway.
        </p>
      </div>
    </div>
  )
}
