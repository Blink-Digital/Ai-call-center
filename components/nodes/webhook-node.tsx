"use client"
import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"
import { Webhook, Globe, Tag, ExternalLink } from "lucide-react"

export default function WebhookNode({ data, selected, id }: any) {
  // Safely extract data with fallbacks
  const nodeName = data?.name || data?.nodeTitle || "New Webhook Node"
  const url = data?.webhook?.url || data?.url || ""
  const method = data?.webhook?.method || data?.method || "POST"
  const isGlobal = data?.isGlobal || false
  const tag = data?.tag || null
  const pathwayAfterApiResponse = data?.pathwayAfterApiResponse || null
  const sendSpeechDuringWebhook = data?.sendSpeechDuringWebhook || false

  // Get URL hostname for display
  const getHostname = (urlString: string) => {
    try {
      return new URL(urlString).hostname
    } catch {
      return urlString || "No URL set"
    }
  }

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
            {/* Node Name */}
            <div className="text-sm font-medium truncate" title={nodeName}>
              {nodeName}
            </div>

            {/* Method and URL */}
            <div className="text-xs text-gray-600">
              <div className="flex items-center gap-1 mb-1">
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {method}
                </Badge>
                <span className="truncate">{getHostname(url)}</span>
                {url && <ExternalLink className="w-3 h-3 text-gray-400" />}
              </div>
              {url && (
                <div className="text-xs text-gray-500 truncate" title={url}>
                  {url}
                </div>
              )}
            </div>

            {/* Response Routing Indicator */}
            {pathwayAfterApiResponse && (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Routes to: {pathwayAfterApiResponse.targetNodeId || "Not set"}
              </div>
            )}

            {/* Send Speech During Webhook Indicator */}
            {sendSpeechDuringWebhook && (
              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Speech enabled during webhook</div>
            )}
          </div>

          {/* Handles */}
          <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />
          <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />

          {/* Dynamic handle for response routing */}
          {pathwayAfterApiResponse && (
            <Handle
              type="source"
              position={Position.Right}
              id="response-route"
              className="w-3 h-3 bg-green-500"
              style={{ top: "50%" }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
