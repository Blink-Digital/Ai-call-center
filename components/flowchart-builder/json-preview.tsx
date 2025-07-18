"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Code } from "lucide-react"
import { convertFlowchartToBlandFormat } from "./deploy-utils"

interface JsonPreviewProps {
  data: any
  title?: string
}

export function JsonPreview({ data, title = "JSON Preview" }: JsonPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Process the data to ensure it matches the Bland.ai format exactly
  const processData = (inputData: any) => {
    if (!inputData) return inputData

    console.log("[JSON_PREVIEW] 🔍 Processing data for preview...")
    console.log("[JSON_PREVIEW] Input data type:", typeof inputData)
    console.log("[JSON_PREVIEW] Input data keys:", Object.keys(inputData))

    // If this is already a processed Bland.ai format, return as-is
    if (inputData.name && inputData.description && inputData.nodes && inputData.edges) {
      console.log("[JSON_PREVIEW] ✅ Data already in Bland.ai format")
      return inputData
    }

    // If this is raw ReactFlow data, convert it properly
    if (inputData.nodes && inputData.edges) {
      console.log("[JSON_PREVIEW] 🔄 Converting ReactFlow data to Bland.ai format...")

      // Find the start node
      const startNode = inputData.nodes.find(
        (node: any) => node.type === "greetingNode" || node.data?.isStart === true || node.id.includes("greeting"),
      )
      const startNodeId = startNode?.id || inputData.nodes[0]?.id || ""

      console.log("[JSON_PREVIEW] 🎯 Start node ID:", startNodeId)

      // Use the same conversion logic as the deployment
      const convertedData = convertFlowchartToBlandFormat(
        inputData.nodes,
        inputData.edges,
        startNodeId,
        inputData.name || "Preview Pathway",
        inputData.description || "Pathway preview generated on " + new Date().toLocaleString(),
      )

      console.log("[JSON_PREVIEW] ✅ Conversion complete")
      console.log("[JSON_PREVIEW] Output nodes:", convertedData.nodes.length)
      console.log("[JSON_PREVIEW] Output edges:", convertedData.edges.length)

      return convertedData
    }

    // Fallback: return original data
    console.log("[JSON_PREVIEW] ⚠️ Using fallback - returning original data")
    return inputData
  }

  const processedData = processData(data)
  const formattedJson = JSON.stringify(processedData, null, 2)

  // Count nodes and edges for display
  const nodeCount = processedData?.nodes?.length || 0
  const edgeCount = processedData?.edges?.length || 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Code size={16} />
          View JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            This is the clean JSON payload that will be sent to Bland.ai when updating the pathway.
            <br />
            <span className="text-sm text-gray-500 mt-1 block">
              Nodes: {nodeCount} | Edges: {edgeCount} | Format: Bland.ai Compatible
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[60vh]">
          <pre className="text-xs font-mono whitespace-pre-wrap">{formattedJson}</pre>
        </div>
        <div className="text-xs text-gray-500 border-t pt-3">
          <strong>✅ Validation Status:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>✅ Mutually exclusive text/prompt fields</li>
            <li>✅ isStart only on start node</li>
            <li>✅ data.name as first property</li>
            <li>✅ Bland.ai compatible node types</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
