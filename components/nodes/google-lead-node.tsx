"use client"

import { useState } from "react"
import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Chrome } from "lucide-react"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"

export default function GoogleLeadNode({ data, selected, id }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [trackingId, setTrackingId] = useState(data?.trackingId || "")
  const [conversionId, setConversionId] = useState(data?.conversionId || "")
  const [description, setDescription] = useState(data?.text || data?.description || "Track Google conversion")

  const handleSave = () => {
    data.trackingId = trackingId
    data.conversionId = conversionId
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
        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between bg-green-100 dark:bg-green-900 rounded-t-lg">
          <CardTitle className="text-sm font-medium">
            <Badge variant="outline" className="mr-2">
              Integration
            </Badge>
            <Chrome size={16} className="inline mr-1 text-green-600" />
            Google Lead
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 bg-white">
          {!isEditing ? (
            <>
              <div className="text-sm min-h-[40px]">{data?.description || "Track Google conversion"}</div>
              {data?.trackingId && (
                <div className="mt-2 text-xs bg-gray-50 p-1 rounded font-mono truncate">
                  Tracking ID: {data.trackingId}
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
                  placeholder="Track Google conversion"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`tracking-id-${id}`}>Google Analytics ID</Label>
                <Input
                  id={`tracking-id-${id}`}
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`conversion-id-${id}`}>Conversion ID</Label>
                <Input
                  id={`conversion-id-${id}`}
                  value={conversionId}
                  onChange={(e) => setConversionId(e.target.value)}
                  placeholder="AW-XXXXXXXXXX"
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
          <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-500" />
          <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
        </CardContent>
      </Card>
    </div>
  )
}
