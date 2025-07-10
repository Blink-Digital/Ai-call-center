"use client"

import { useState } from "react"
import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"
import { Webhook, Globe, Tag } from "lucide-react"

export default function WebhookNode({ data, selected, id }: any) {
  const [isEditing, setIsEditing] = useState(false)

  // Get webhook details
  const url = data?.url || "https://example.com/webhook"
  const method = data?.method || "POST"
  const nodeTitle = data?.nodeTitle || "Webhook Node"
  const responsePathways = data?.responsePathways || []
  const isGlobal = data?.isGlobal || false
  const tag = data?.tag || null

  return (
    <div className="relative">
      {selected && (
        <>
          <NodeDeleteButton nodeId={id} />
          <NodeDuplicateButton nodeId={id} />
        </>
      )}
      <Card className={`w-64 shadow-md ${selected ? "ring-2 ring-primary" : ""}`}>
        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between bg-indigo-100 dark:bg-indigo-900 rounded-t-lg">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            <Badge variant="outline" className="text-xs">
              Webhook
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            {isGlobal && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                <Globe className="w-3 h-3 mr-1" />
                Global
              </Badge>
            )}
            {tag && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                <Tag className="w-3 h-3 mr-1" />
                {tag.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 bg-white">
          <div className="space-y-2">
            <div className="text-sm font-medium">{nodeTitle}</div>
            <div className="text-xs text-gray-600">
              <div className="flex items-center gap-1 mb-1">
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {method}
                </Badge>
                <span className="truncate">{new URL(url).hostname}</span>
              </div>
              <div className="text-xs text-gray-500 truncate">{url}</div>
            </div>

            {/* Response Pathways Indicator */}
            {responsePathways.length > 0 && (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {responsePathways.length} response pathway{responsePathways.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Handles */}
          <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />
          <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />

          {/* Dynamic handles for response pathways */}
          {responsePathways.map((pathway: any, index: number) => (
            <Handle
              key={`response-${index}`}
              type="source"
              position={Position.Right}
              id={`response-${index}`}
              className="w-3 h-3 bg-green-500"
              style={{ top: `${30 + index * 20}%` }}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
