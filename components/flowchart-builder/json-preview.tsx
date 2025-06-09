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

interface JsonPreviewProps {
  data: any
  title?: string
}

export function JsonPreview({ data, title = "JSON Preview" }: JsonPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Process the data to ensure it matches the Bland.ai format
  const processData = (inputData: any) => {
    if (!inputData) return inputData

    // Create a deep copy to avoid modifying the original
    const processedData = JSON.parse(JSON.stringify(inputData))

    // Convert edges to Bland.ai format
    if (processedData.edges && Array.isArray(processedData.edges)) {
      processedData.edges = processedData.edges.map((edge: any) => {
        // Convert from our format to Bland.ai format
        const newEdge: any = {
          id: edge.id,
          source: edge.source,
          target: edge.target,
        }

        // Get the label from data.label if it exists, otherwise use edge.label or "next"
        if (edge.data && edge.data.label) {
          newEdge.label = edge.data.label
        } else if (edge.label) {
          newEdge.label = edge.label
        } else {
          // If we can't find a label, use "next" as fallback
          newEdge.label = "next"
        }

        // Remove the type and data properties as they're not in Bland.ai format
        delete newEdge.type
        delete newEdge.data

        return newEdge
      })
    }

    return processedData
  }

  const formattedJson = JSON.stringify(processData(data), null, 2)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Code size={16} />
          View JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            This is the JSON payload that will be sent to Bland.ai when updating the pathway.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[60vh]">
          <pre className="text-xs font-mono">{formattedJson}</pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
