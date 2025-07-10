"use client"

import { useState } from "react"
import { Handle, Position } from "reactflow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Phone } from "lucide-react"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"
import { Switch } from "@/components/ui/switch"

interface TransferNodeProps {
  data: any
  id: string
  selected: boolean
}

export default function TransferNode({ data = {}, id, selected }: TransferNodeProps) {
  const [isEditing, setIsEditing] = useState(false)

  // Basic fields only - simplified for Bland.ai compatibility
  const [nodeTitle, setNodeTitle] = useState(data?.nodeTitle || "")
  const [useStaticPrompt, setUseStaticPrompt] = useState(data?.useStaticPrompt !== false)
  const [prompt, setPrompt] = useState(data?.text || "Let me transfer you to the right department.")
  const [transferType, setTransferType] = useState(data?.transferType || "Phone Number")
  const [transferNumber, setTransferNumber] = useState(data?.phone || "+1")

  // Ensure data object exists
  if (!data) {
    data = {}
  }

  const handleSave = () => {
    // Update the node data with Bland.ai compatible structure
    data.nodeTitle = nodeTitle
    data.useStaticPrompt = useStaticPrompt
    data.text = useStaticPrompt ? prompt : ""
    data.transferType = transferType
    data.phone = transferType === "Phone Number" ? transferNumber : ""
    data.isGlobal = false // Always false for transfer nodes

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
      <div className={`rounded-md border ${selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"}`}>
        <Handle type="target" position={Position.Top} />

        <div className="bg-amber-900 text-white px-3 py-1 rounded-t-md flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Phone size={16} />
            <span>Transfer Call</span>
          </div>
          <span>{data.nodeTitle || nodeTitle || "Call Transfer"}</span>
        </div>

        {!isEditing ? (
          <div className="bg-white p-3 rounded-b-md">
            <div className="mb-2">
              <span className="text-sm font-medium">Node Title:</span>
              <div className="mt-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm">
                {data.nodeTitle || nodeTitle || "Unnamed Transfer"}
              </div>
            </div>

            <div className="mb-2">
              <span className="text-sm font-medium">Static Prompt:</span>
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-sm">
                {data.useStaticPrompt !== false ? "Enabled" : "Disabled"}
              </span>
            </div>

            {data.useStaticPrompt !== false && (
              <div className="mb-2">
                <span className="text-sm font-medium">Prompt:</span>
                <div className="mt-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm">
                  {data.text || prompt || "Let me transfer you to the right department."}
                </div>
              </div>
            )}

            <div className="mb-2">
              <span className="text-sm font-medium">Transfer Type:</span>
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-sm">{data.transferType || transferType}</span>
            </div>

            {(data.transferType === "Phone Number" || transferType === "Phone Number") && (
              <div className="mb-3">
                <span className="text-sm font-medium">Phone Number:</span>
                <div className="mt-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm font-mono">
                  {data.phone || transferNumber || "No phone number set"}
                </div>
              </div>
            )}

            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full mt-2">
              Edit Transfer Settings
            </Button>
          </div>
        ) : (
          <Card className="border-0 shadow-none">
            <CardContent className="p-3 bg-white rounded-b-md">
              <div className="space-y-4">
                {/* Node Title */}
                <div className="space-y-2">
                  <Label htmlFor={`node-title-${id}`}>Node Title</Label>
                  <Input
                    id={`node-title-${id}`}
                    value={nodeTitle}
                    onChange={(e) => setNodeTitle(e.target.value)}
                    placeholder="Internal label (not spoken)"
                  />
                  <p className="text-xs text-gray-500">Internal label for organization purposes.</p>
                </div>

                {/* Static Prompt Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch id={`static-prompt-${id}`} checked={useStaticPrompt} onCheckedChange={setUseStaticPrompt} />
                    <Label htmlFor={`static-prompt-${id}`}>Use Static Prompt</Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    When enabled, use the specific prompt below instead of AI-generated text.
                  </p>
                </div>

                {/* Prompt - only show when static prompt is enabled */}
                {useStaticPrompt && (
                  <div className="space-y-2">
                    <Label htmlFor={`prompt-${id}`}>Prompt</Label>
                    <Textarea
                      id={`prompt-${id}`}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Let me transfer you to the right department."
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">What the AI will say before transferring the call.</p>
                  </div>
                )}

                {/* Transfer Type */}
                <div className="space-y-2">
                  <Label htmlFor={`transfer-type-${id}`}>Transfer Type</Label>
                  <Select value={transferType} onValueChange={setTransferType}>
                    <SelectTrigger id={`transfer-type-${id}`}>
                      <SelectValue placeholder="Select transfer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Phone Number">Phone Number</SelectItem>
                      <SelectItem value="Phone Tree">Phone Tree</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transfer Number - only show when Phone Number is selected */}
                {transferType === "Phone Number" && (
                  <div className="space-y-2">
                    <Label htmlFor={`transfer-number-${id}`}>Transfer Number</Label>
                    <Input
                      id={`transfer-number-${id}`}
                      value={transferNumber}
                      onChange={(e) => setTransferNumber(e.target.value)}
                      placeholder="+1234567890"
                    />
                    <p className="text-xs text-gray-500">The phone number to transfer the call to.</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    Save Node
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Handle type="source" position={Position.Bottom} />
      </div>
    </div>
  )
}
