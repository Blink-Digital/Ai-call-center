"use client"

import { useState } from "react"
import { Handle, Position } from "reactflow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Phone, Globe } from "lucide-react"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"
import { Switch } from "@/components/ui/switch"

interface TransferNodeProps {
  data: any // Using any to handle potentially undefined data
  id: string
  selected: boolean
}

export default function TransferNode({ data = {}, id, selected }: TransferNodeProps) {
  // Initialize with default values if data properties are undefined
  const [isEditing, setIsEditing] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(data?.transferNumber || data?.phoneNumber || "+1")
  const [transferType, setTransferType] = useState<"warm" | "cold">(data?.transferType || "warm")
  const [webhookUrl, setWebhookUrl] = useState(data?.webhookUrl || "")
  const [webhookMethod, setWebhookMethod] = useState(data?.webhookMethod || "POST")
  const [webhookBody, setWebhookBody] = useState(
    data?.webhookBody || '{\n  "callId": "{{callId}}",\n  "campaign": "{{campaign}}"\n}',
  )
  const [isWebhookOpen, setIsWebhookOpen] = useState(false)
  const [nodeText, setNodeText] = useState(data?.text || "Transferring your call now...")
  // Add a webhookDescription field to the component state
  const [webhookDescription, setWebhookDescription] = useState(
    data?.webhookDescription || "Fetch customer data and trigger Facebook Pixel",
  )
  // Add a new state variable for tracking if webhook is enabled
  const [isWebhookEnabled, setIsWebhookEnabled] = useState(!!data?.webhookUrl)

  // Ensure data object exists
  if (!data) {
    data = {}
  }

  // Update the handleSave function to only save webhook data if it's enabled
  const handleSave = () => {
    // Update the node data
    data.transferNumber = phoneNumber
    data.phoneNumber = phoneNumber // Set both for compatibility
    data.transferType = transferType
    data.text = nodeText // Ensure text field is always set

    // Only include webhook data if the webhook is enabled
    if (isWebhookEnabled) {
      data.webhookUrl = webhookUrl
      data.webhookMethod = webhookMethod
      data.webhookBody = webhookBody
      data.webhookDescription = webhookDescription
    } else {
      // Remove webhook data if disabled
      data.webhookUrl = ""
      data.webhookMethod = undefined
      data.webhookBody = undefined
      data.webhookDescription = undefined
    }

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
            <span>Transfer</span>
          </div>
          <span>{data.label || "Call Transfer"}</span>
        </div>

        {!isEditing ? (
          <div className="bg-white p-3 rounded-b-md">
            <div className="mb-2">
              <span className="text-sm font-medium">Message:</span>
              <div className="mt-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm">
                {data.text || "Transferring your call now..."}
              </div>
            </div>

            <div className="mb-2">
              <span className="text-sm font-medium">Transfer Type:</span>
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-sm">
                {data.transferType === "warm" ? "Warm Transfer" : "Cold Transfer"}
              </span>
            </div>

            <div className="mb-3">
              <span className="text-sm font-medium">Phone Number:</span>
              <div className="mt-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm font-mono">
                {data.transferNumber || data.phoneNumber || "No phone number set"}
              </div>
            </div>

            {(data.webhookUrl || data.webhookUrl === "") && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <Globe size={14} />
                  <span>Webhook {data.webhookUrl ? "enabled" : "disabled"}</span>
                </div>
                {data.webhookUrl && <div className="mt-1 text-xs text-gray-500 truncate">{data.webhookUrl}</div>}
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
                <div className="space-y-2">
                  <Label htmlFor={`text-${id}`}>Message</Label>
                  <Textarea
                    id={`text-${id}`}
                    value={nodeText}
                    onChange={(e) => setNodeText(e.target.value)}
                    placeholder="Transferring your call now..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`phone-${id}`}>Phone Number</Label>
                  <Input
                    id={`phone-${id}`}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+18005551234"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`type-${id}`}>Transfer Type</Label>
                  <Select value={transferType} onValueChange={(value) => setTransferType(value as "warm" | "cold")}>
                    <SelectTrigger id={`type-${id}`}>
                      <SelectValue placeholder="Select transfer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warm">Warm Transfer</SelectItem>
                      <SelectItem value="cold">Cold Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Collapsible
                  open={isWebhookOpen}
                  onOpenChange={setIsWebhookOpen}
                  className="border border-gray-200 rounded-md"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Globe size={16} />
                      <span className="font-medium">Webhook Configuration</span>
                    </div>
                    {isWebhookOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-3 border-t border-gray-200 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`webhook-enabled-${id}`}
                        checked={isWebhookEnabled}
                        onCheckedChange={setIsWebhookEnabled}
                      />
                      <Label htmlFor={`webhook-enabled-${id}`}>Enable webhook</Label>
                    </div>

                    {isWebhookEnabled && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`webhook-url-${id}`}>Webhook URL</Label>
                          <Input
                            id={`webhook-url-${id}`}
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://example.com/webhook"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`webhook-method-${id}`}>HTTP Method</Label>
                          <Select value={webhookMethod} onValueChange={setWebhookMethod}>
                            <SelectTrigger id={`webhook-method-${id}`}>
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
                          <Label htmlFor={`webhook-body-${id}`}>Request Body</Label>
                          <Textarea
                            id={`webhook-body-${id}`}
                            value={webhookBody}
                            onChange={(e) => setWebhookBody(e.target.value)}
                            placeholder='{"callId": "{{callId}}", "campaign": "{{campaign}}"}'
                            rows={5}
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-gray-500">
                            You can use variables like {`{{`}callId{`}}`}, {`{{`}campaign{`}}`}, etc.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`webhook-description-${id}`}>Webhook Description</Label>
                          <Input
                            id={`webhook-description-${id}`}
                            value={webhookDescription}
                            onChange={(e) => setWebhookDescription(e.target.value)}
                            placeholder="Fetch customer data and trigger Facebook Pixel"
                          />
                        </div>
                      </>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save
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
