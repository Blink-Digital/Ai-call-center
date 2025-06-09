"use client"

import { useState } from "react"
import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Zap } from "lucide-react"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"

export default function ZapierNode({ data, selected, id }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState(data?.webhookUrl || "")
  const [description, setDescription] = useState(data?.text || data?.description || "Send data to Zapier")

  const handleSave = () => {
    data.webhookUrl = webhookUrl
    data.description = description
    data.text = description // Ensure text field is explicitly set at the top level
    setIsEditing(false)
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
        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between bg-purple-100 dark:bg-purple-900 rounded-t-lg">
          <CardTitle className="text-sm font-medium">
            <Badge variant="outline" className="mr-2">
              Integration
            </Badge>
            <Zap size={16} className="inline mr-1 text-purple-600" />
            Zapier
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 bg-white">
          {!isEditing ? (
            <>
              <div className="text-sm min-h-[40px]">{data?.description || "Send data to Zapier"}</div>
              {data?.webhookUrl && (
                <div className="mt-2 text-xs bg-gray-50 p-1 rounded font-mono truncate">
                  Webhook URL: {data.webhookUrl.substring(0, 25)}...
                </div>
              )}
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full mt-2">
                Edit Integration
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`description-${id}`}>Description</Label>
                <Input
                  id={`description-${id}`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Send data to Zapier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`webhook-url-${id}`}>Zapier Webhook URL</Label>
                <Input
                  id={`webhook-url-${id}`}
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                <p>Variables available:</p>
                <code className="bg-gray-100 px-1 rounded">{"{{caller_number}}"}</code>
                <p className="mt-1">All call data will be sent to this webhook.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          )}
          <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
          <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
        </CardContent>
      </Card>
    </div>
  )
}
