"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Save, Type, MessageSquare, Settings, GitBranch, Phone, Globe, Zap, Chrome, Facebook } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus } from "lucide-react"
import { commonVariables } from "@/config/flowchart-defaults"

interface NodeEditorDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedNode: any
  onUpdateNode: (nodeId: string, updates: any) => void
}

export function NodeEditorDrawer({ isOpen, onClose, selectedNode, onUpdateNode }: NodeEditorDrawerProps) {
  const [formData, setFormData] = useState<any>({})
  const [activeTab, setActiveTab] = useState("content")

  // Initialize form data when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setFormData({
        title: selectedNode.data?.title || getDefaultTitle(selectedNode.type),
        text: selectedNode.data?.text || "",
        ...selectedNode.data,
      })
      setActiveTab("content")
    }
  }, [selectedNode])

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  const handleSave = () => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, formData)
      onClose()
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case "greetingNode":
        return <MessageSquare className="h-5 w-5" />
      case "questionNode":
        return <MessageSquare className="h-5 w-5" />
      case "responseNode":
        return <Type className="h-5 w-5" />
      case "customerResponseNode":
        return <GitBranch className="h-5 w-5" />
      case "transferNode":
        return <Phone className="h-5 w-5" />
      case "endCallNode":
        return <Phone className="h-5 w-5" />
      case "webhookNode":
        return <Globe className="h-5 w-5" />
      case "facebookLeadNode":
        return <Facebook className="h-5 w-5" />
      case "googleLeadNode":
        return <Chrome className="h-5 w-5" />
      case "zapierNode":
        return <Zap className="h-5 w-5" />
      case "conditionalNode":
        return <GitBranch className="h-5 w-5" />
      default:
        return <Settings className="h-5 w-5" />
    }
  }

  const getNodeTypeLabel = (nodeType: string) => {
    switch (nodeType) {
      case "greetingNode":
        return "Greeting"
      case "questionNode":
        return "Question"
      case "responseNode":
        return "Response"
      case "customerResponseNode":
        return "Customer Response"
      case "transferNode":
        return "Transfer Call"
      case "endCallNode":
        return "End Call"
      case "webhookNode":
        return "Webhook"
      case "facebookLeadNode":
        return "Facebook Lead"
      case "googleLeadNode":
        return "Google Lead"
      case "zapierNode":
        return "Zapier"
      case "conditionalNode":
        return "Conditional"
      default:
        return "Node"
    }
  }

  const getDefaultTitle = (nodeType: string) => {
    switch (nodeType) {
      case "greetingNode":
        return "Welcome Greeting"
      case "questionNode":
        return "Ask Question"
      case "responseNode":
        return "AI Response"
      case "customerResponseNode":
        return "Capture Response"
      case "transferNode":
        return "Transfer Call"
      case "endCallNode":
        return "End Conversation"
      case "webhookNode":
        return "API Call"
      case "facebookLeadNode":
        return "Facebook Conversion"
      case "googleLeadNode":
        return "Google Conversion"
      case "zapierNode":
        return "Zapier Automation"
      case "conditionalNode":
        return "Conditional Logic"
      default:
        return "Node"
    }
  }

  const renderContentTab = () => (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-3">
        <Label htmlFor="title" className="text-sm font-medium text-gray-900">
          Node Title
        </Label>
        <Input
          id="title"
          value={formData.title || ""}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          placeholder="Enter a descriptive title for this node"
          className="w-full"
        />
      </div>

      {/* Main Text/Message */}
      <div className="space-y-3">
        <Label htmlFor="text" className="text-sm font-medium text-gray-900">
          {selectedNode?.type === "questionNode"
            ? "Question Text"
            : selectedNode?.type === "greetingNode"
              ? "Greeting Message"
              : selectedNode?.type === "responseNode"
                ? "Response Message"
                : selectedNode?.type === "endCallNode"
                  ? "Closing Message"
                  : "Message Text"}
        </Label>
        <Textarea
          id="text"
          value={formData.text || ""}
          onChange={(e) => handleFieldChange("text", e.target.value)}
          placeholder="Enter the message content..."
          className="min-h-[120px] resize-y"
        />
      </div>

      {/* Customer Response Options */}
      {selectedNode?.type === "customerResponseNode" && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Response Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Switch
                id="open-ended"
                checked={formData.isOpenEnded || false}
                onCheckedChange={(checked) => handleFieldChange("isOpenEnded", checked)}
              />
              <Label htmlFor="open-ended" className="text-sm font-medium">
                Open-ended response
              </Label>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900">Response Options</Label>
              {(formData.options || []).map((option: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(formData.options || [])]
                      newOptions[index] = e.target.value
                      handleFieldChange("options", newOptions)
                    }}
                    className="flex-1"
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newOptions = (formData.options || []).filter((_: any, i: number) => i !== index)
                      handleFieldChange("options", newOptions)
                    }}
                    className="shrink-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  const newOptions = [...(formData.options || []), ""]
                  handleFieldChange("options", newOptions)
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Node Settings */}
      {selectedNode?.type === "transferNode" && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Transfer Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="transferNumber" className="text-sm font-medium text-gray-900">
                Phone Number
              </Label>
              <Input
                id="transferNumber"
                value={formData.transferNumber || ""}
                onChange={(e) => handleFieldChange("transferNumber", e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="transferType" className="text-sm font-medium text-gray-900">
                Transfer Type
              </Label>
              <Select
                value={formData.transferType || "warm"}
                onValueChange={(value) => handleFieldChange("transferType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warm">Warm Transfer</SelectItem>
                  <SelectItem value="cold">Cold Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook Settings */}
      {selectedNode?.type === "webhookNode" && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Webhook Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="url" className="text-sm font-medium text-gray-900">
                Webhook URL
              </Label>
              <Input
                id="url"
                value={formData.url || ""}
                onChange={(e) => handleFieldChange("url", e.target.value)}
                placeholder="https://api.example.com/webhook"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="method" className="text-sm font-medium text-gray-900">
                HTTP Method
              </Label>
              <Select value={formData.method || "POST"} onValueChange={(value) => handleFieldChange("method", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="body" className="text-sm font-medium text-gray-900">
                Request Body
              </Label>
              <Textarea
                id="body"
                value={formData.body || "{}"}
                onChange={(e) => handleFieldChange("body", e.target.value)}
                placeholder='{"key": "value"}'
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conditional Logic */}
      {selectedNode?.type === "conditionalNode" && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Conditional Logic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="variableName" className="text-sm font-medium text-gray-900">
                Variable Name
              </Label>
              <Select
                value={formData.variableName || ""}
                onValueChange={(value) => handleFieldChange("variableName", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select variable" />
                </SelectTrigger>
                <SelectContent>
                  {commonVariables.map((variable) => (
                    <SelectItem key={variable.name} value={variable.name}>
                      {variable.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="conditionOperator" className="text-sm font-medium text-gray-900">
                  Operator
                </Label>
                <Select
                  value={formData.conditionOperator || "=="}
                  onValueChange={(value) => handleFieldChange("conditionOperator", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="==">=</SelectItem>
                    <SelectItem value="!=">≠</SelectItem>
                    <SelectItem value="<">{"<"}</SelectItem>
                    <SelectItem value="<=">≤</SelectItem>
                    <SelectItem value=">">{">"}</SelectItem>
                    <SelectItem value=">=">≥</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="conditionValue" className="text-sm font-medium text-gray-900">
                  Value
                </Label>
                <Input
                  id="conditionValue"
                  value={formData.conditionValue || ""}
                  onChange={(e) => handleFieldChange("conditionValue", e.target.value)}
                  placeholder="Comparison value"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderVariablesTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Extract Variables</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newVars = [...(formData.extractVariables || []), ""]
              handleFieldChange("extractVariables", newVars)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variable
          </Button>
        </div>

        {(formData.extractVariables || []).map((variable: string, index: number) => (
          <Card key={index} className="border-gray-200 shadow-sm">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={variable}
                    onChange={(e) => {
                      const newVars = [...(formData.extractVariables || [])]
                      newVars[index] = e.target.value
                      handleFieldChange("extractVariables", newVars)
                    }}
                    placeholder="Variable name"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newVars = (formData.extractVariables || []).filter((_: any, i: number) => i !== index)
                      handleFieldChange("extractVariables", newVars)
                    }}
                    className="shrink-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!formData.extractVariables || formData.extractVariables.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-sm font-medium">No variables configured</p>
            <p className="text-xs mt-1">Add variables to extract from user responses</p>
          </div>
        )}
      </div>
    </div>
  )

  if (!selectedNode) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            style={{ backdropFilter: "blur(8px)" }}
          />

          {/* Drawer - Fixed Overlay */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-[500px] max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">{getNodeIcon(selectedNode.type)}</div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Edit {getNodeTypeLabel(selectedNode.type)}</h2>
                  <Badge variant="outline" className="text-xs font-mono">
                    {selectedNode.id}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="px-6 py-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="content" className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Content
                      </TabsTrigger>
                      <TabsTrigger value="variables" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Variables
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="mt-0">
                      {renderContentTab()}
                    </TabsContent>

                    <TabsContent value="variables" className="mt-0">
                      {renderVariablesTab()}
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 shrink-0">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
