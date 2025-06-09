"use client"

import { useState } from "react"
import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Facebook } from "lucide-react"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"

export default function FacebookLeadNode({ data, selected, id }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [pixelId, setPixelId] = useState(data?.pixelId || "")
  const [eventName, setEventName] = useState(data?.eventName || "Lead")
  const [description, setDescription] = useState(data?.text || data?.description || "Track Facebook conversion")

  const handleSave = () => {
    data.pixelId = pixelId
    data.eventName = eventName
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
        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between bg-blue-100 dark:bg-blue-900 rounded-t-lg">
          <CardTitle className="text-sm font-medium">
            <Badge variant="outline" className="mr-2">
              Integration
            </Badge>
            <Facebook size={16} className="inline mr-1 text-blue-600" />
            Facebook Lead
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 bg-white">
          {!isEditing ? (
            <>
              <div className="text-sm min-h-[40px]">{data?.description || "Track Facebook conversion"}</div>
              {data?.pixelId && (
                <div className="mt-2 text-xs bg-gray-50 p-1 rounded font-mono truncate">Pixel ID: {data.pixelId}</div>
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
                  placeholder="Track Facebook conversion"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`pixel-id-${id}`}>Facebook Pixel ID</Label>
                <Input
                  id={`pixel-id-${id}`}
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value)}
                  placeholder="Enter your Facebook Pixel ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`event-name-${id}`}>Event Name</Label>
                <Input
                  id={`event-name-${id}`}
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Lead"
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                <p>Variables available:</p>
                <code className="bg-gray-100 px-1 rounded">{"{{caller_number}}"}</code>
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
          <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
          <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
        </CardContent>
      </Card>
    </div>
  )
}
