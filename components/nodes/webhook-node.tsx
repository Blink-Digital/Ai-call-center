"use client"

import { useState } from "react"
import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"

export default function WebhookNode({ data, selected, id }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [url, setUrl] = useState(data?.url || "https://example.com/webhook")
  const [method, setMethod] = useState(data?.method || "POST")
  const [description, setDescription] = useState(data?.text || data?.description || "Send data to external API")
  const [body, setBody] = useState(data?.body || JSON.stringify({ event: "call_progress", data: {} }, null, 2))
  const [extractVars, setExtractVars] = useState<Array<[string, string, string]>>(
    data?.extractVars &&
      Array.isArray(data.extractVars) &&
      data.extractVars.length > 0 &&
      Array.isArray(data.extractVars[0])
      ? data.extractVars
      : [
          ["response", "string", "The response from the webhook"],
          ["status", "number", "The HTTP status code"],
        ],
  )

  // Update the handleSave function to ensure text is set at the top level
  const handleSave = () => {
    data.url = url
    data.method = method
    data.description = description
    data.text = description // Ensure text field is explicitly set at the top level
    data.body = body
    data.extractVars = extractVars // This is already in the correct format
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
        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between bg-indigo-100 dark:bg-indigo-900 rounded-t-lg">
          <CardTitle className="text-sm font-medium">
            <Badge variant="outline" className="mr-2">
              Webhook
            </Badge>
            API Call
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 bg-white">
          {!isEditing ? (
            <>
              <div className="text-sm min-h-[40px]">{data?.description || "Send data to external API"}</div>
              {data?.url && <div className="mt-2 text-xs bg-gray-50 p-1 rounded font-mono truncate">{data.url}</div>}
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full mt-2">
                Edit Webhook
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
                  placeholder="Send data to external API"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`url-${id}`}>Webhook URL</Label>
                <Input
                  id={`url-${id}`}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`method-${id}`}>HTTP Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id={`method-${id}`}>
                    <SelectValue placeholder="Select HTTP method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`body-${id}`}>Request Body</Label>
                <Textarea
                  id={`body-${id}`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"event": "call_progress", "data": {}}'
                  rows={5}
                  className="font-mono text-sm"
                />
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
          <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />
          <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />
        </CardContent>
      </Card>
    </div>
  )
}
