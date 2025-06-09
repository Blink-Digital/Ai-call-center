"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { convertApiResponseToFlowchart } from "@/utils/api-to-flowchart-converter"

export default function FlowchartConverterDebug() {
  const [inputJson, setInputJson] = useState("")
  const [outputJson, setOutputJson] = useState("")
  const [error, setError] = useState("")

  const handleConvert = () => {
    try {
      setError("")
      const parsedInput = JSON.parse(inputJson)
      const converted = convertApiResponseToFlowchart(parsedInput)
      setOutputJson(JSON.stringify(converted, null, 2))
    } catch (err) {
      setError(err.message)
      console.error("Conversion error:", err)
    }
  }

  const handleClear = () => {
    setInputJson("")
    setOutputJson("")
    setError("")
  }

  const exampleInput = {
    nodes: [
      {
        id: "node-1",
        type: "greeting",
        data: {
          text: "Hello, this is [Company Name]. How can I help you today?",
        },
        position: { x: 250, y: 0 },
      },
      {
        id: "node-2",
        type: "question",
        data: {
          text: "Are you currently on Medicare or Medicaid?",
        },
        position: { x: 250, y: 100 },
      },
      {
        id: "node-3",
        type: "response",
        data: {
          text: "Yes",
        },
        position: { x: 150, y: 200 },
      },
      {
        id: "node-4",
        type: "response",
        data: {
          text: "No",
        },
        position: { x: 350, y: 200 },
      },
    ],
    edges: [
      {
        id: "edge-1-2",
        source: "node-1",
        target: "node-2",
      },
      {
        id: "edge-2-3",
        source: "node-2",
        target: "node-3",
      },
      {
        id: "edge-2-4",
        source: "node-2",
        target: "node-4",
      },
    ],
  }

  const loadExample = () => {
    setInputJson(JSON.stringify(exampleInput, null, 2))
    setOutputJson("")
    setError("")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Flowchart Converter Debug Tool</h1>
      <p className="mb-6 text-gray-600">
        This tool helps you test the API-to-flowchart converter. Paste your API response JSON and see how it gets
        converted.
      </p>

      <Tabs defaultValue="converter" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="converter">Converter</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>

        <TabsContent value="converter">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Input JSON</CardTitle>
                <CardDescription>Paste your API response JSON here</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={inputJson}
                  onChange={(e) => setInputJson(e.target.value)}
                  className="min-h-[400px] font-mono"
                  placeholder="Paste your API response JSON here..."
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleClear}>
                  Clear
                </Button>
                <Button variant="outline" onClick={loadExample}>
                  Load Example
                </Button>
                <Button onClick={handleConvert}>Convert</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Output JSON</CardTitle>
                <CardDescription>Converted flowchart JSON</CardDescription>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="text-red-500 p-4 bg-red-50 rounded-md">{error}</div>
                ) : (
                  <Textarea
                    value={outputJson}
                    readOnly
                    className="min-h-[400px] font-mono"
                    placeholder="Converted JSON will appear here..."
                  />
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(outputJson)}>
                  Copy to Clipboard
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle>How to Use This Tool</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Paste your API response JSON in the Input JSON field.</li>
                <li>Click the "Convert" button to process the JSON.</li>
                <li>The converted flowchart JSON will appear in the Output JSON field.</li>
                <li>If there are any errors, they will be displayed instead of the output.</li>
                <li>You can use the "Load Example" button to see a sample input.</li>
              </ol>

              <h3 className="font-bold mt-6 mb-2">Common Issues</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Make sure your input JSON has both "nodes" and "edges" arrays.</li>
                <li>Each node should have an "id", "type", and "data" property.</li>
                <li>Each edge should have a "source" and "target" property.</li>
                <li>The converter will try to fix common issues, but it may not catch everything.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
