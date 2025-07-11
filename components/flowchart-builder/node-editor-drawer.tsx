"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, ChevronRight, Settings, Database, Phone, PhoneOff, Webhook } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { WebhookNodeConfig } from "./webhook-node-config"
import type { Node } from "reactflow"

interface Variable {
  id: string
  name: string
  type: "string" | "integer" | "boolean" | "date" | "range" | "email" | "phone"
  description: string
  required: boolean
}

interface ConditionExample {
  id: string
  label: string
  nodeId: string
}

interface DialogueExample {
  id: string
  userInput: string
  aiResponse: string
}

interface PathwayExample {
  id: string
  context: string
}

interface NodeEditorDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedNode: Node | null
  onUpdateNode: (nodeId: string, updates: any) => void
  availableNodes?: Node[]
}

export function NodeEditorDrawer({
  isOpen,
  onClose,
  selectedNode,
  onUpdateNode,
  availableNodes = [],
}: NodeEditorDrawerProps) {
  // Form state
  const [nodeTitle, setNodeTitle] = useState("")
  const [useStaticPrompt, setUseStaticPrompt] = useState(true)
  const [prompt, setPrompt] = useState("")
  const [loopCondition, setLoopCondition] = useState("")
  const [isGlobal, setIsGlobal] = useState(false)
  const [globalLabel, setGlobalLabel] = useState("")
  const [temperature, setTemperature] = useState([0.7])
  const [skipUserResponse, setSkipUserResponse] = useState(false)
  const [disableRepeatOnSilence, setDisableRepeatOnSilence] = useState(false)
  const [enableSmsReturnNode, setEnableSmsReturnNode] = useState(false)
  const [disableEndCallTool, setDisableEndCallTool] = useState(false)

  // Transfer Node specific state
  const [transferType, setTransferType] = useState("Phone Number")
  const [transferNumber, setTransferNumber] = useState("")

  // Customer Response Node (Extractor) specific state
  const [extractCallInfo, setExtractCallInfo] = useState(false)
  const [extractionPrompt, setExtractionPrompt] = useState("")
  const [ignorePrevious, setIgnorePrevious] = useState(false)

  // Variables state
  const [variables, setVariables] = useState<Variable[]>([])
  const [newVariable, setNewVariable] = useState<Partial<Variable>>({
    name: "",
    type: "string",
    description: "",
    required: false,
  })

  // Fine-tuning examples state
  const [conditionExamples, setConditionExamples] = useState<ConditionExample[]>([])
  const [dialogueExamples, setDialogueExamples] = useState<DialogueExample[]>([])
  const [pathwayExamples, setPathwayExamples] = useState<PathwayExample[]>([])

  // Collapsible sections state
  const [generalOpen, setGeneralOpen] = useState(true)
  const [loopConditionOpen, setLoopConditionOpen] = useState(true)
  const [globalAccessOpen, setGlobalAccessOpen] = useState(true)
  const [variableExtractionOpen, setVariableExtractionOpen] = useState(true)
  const [fineTuningOpen, setFineTuningOpen] = useState(false)
  const [modelBehaviorOpen, setModelBehaviorOpen] = useState(false)

  // Check node types - with null safety
  const isExtractorNode = selectedNode?.type === "customerResponseNode"
  const isTransferNode = selectedNode?.type === "transferNode"
  const isEndCallNode = selectedNode?.type === "endCallNode"
  const isWebhookNode = selectedNode?.type === "webhookNode"

  // Load data when node changes
  useEffect(() => {
    if (selectedNode?.data) {
      const data = selectedNode.data
      setNodeTitle(data.nodeTitle || data.nodeName || "")
      setUseStaticPrompt(data.useStaticPrompt !== false) // Default to true
      setPrompt(data.text || data.prompt || "")
      setLoopCondition(data.loopCondition || "")
      setIsGlobal(data.isGlobal || false)
      setGlobalLabel(data.globalLabel || "")
      setTemperature([data.temperature || 0.7])
      setSkipUserResponse(data.skipUserResponse || false)
      setDisableRepeatOnSilence(data.disableRepeatOnSilence || false)
      setEnableSmsReturnNode(data.enableSmsReturnNode || false)
      setDisableEndCallTool(data.disableEndCallTool || false)

      // Transfer Node specific fields
      setTransferType(data.transferType || "Phone Number")
      setTransferNumber(data.phone || "")

      // Extractor-specific fields
      setExtractCallInfo(data.extractCallInfo || (data.extractVars && data.extractVars.length > 0))
      setExtractionPrompt(data.extractionPrompt || "")
      setIgnorePrevious(data.extractVarSettings?.ignorePrevious || false)

      // Load variables from extractVars format
      if (data.extractVars && Array.isArray(data.extractVars)) {
        const loadedVars = data.extractVars.map((varData: any, index: number) => {
          if (Array.isArray(varData)) {
            // Legacy format: [name, type, description, required]
            return {
              id: `var_${index}`,
              name: varData[0] || "",
              type: varData[1] || "string",
              description: varData[2] || "",
              required: varData[3] || false,
            }
          } else {
            // New format: object
            return {
              id: varData.id || `var_${index}`,
              name: varData.name || "",
              type: varData.type || "string",
              description: varData.description || "",
              required: varData.required || false,
            }
          }
        })
        setVariables(loadedVars)
      } else {
        setVariables(data.variables || [])
      }

      setConditionExamples(data.conditionExamples || [])
      setDialogueExamples(data.dialogueExamples || [])
      setPathwayExamples(data.pathwayExamples || [])
    } else {
      // Reset to defaults when no node is selected
      setNodeTitle("")
      setUseStaticPrompt(true)
      setPrompt("")
      setLoopCondition("")
      setIsGlobal(false)
      setGlobalLabel("")
      setTemperature([0.7])
      setSkipUserResponse(false)
      setDisableRepeatOnSilence(false)
      setEnableSmsReturnNode(false)
      setDisableEndCallTool(false)
      setTransferType("Phone Number")
      setTransferNumber("")
      setExtractCallInfo(false)
      setExtractionPrompt("")
      setIgnorePrevious(false)
      setVariables([])
      setConditionExamples([])
      setDialogueExamples([])
      setPathwayExamples([])
    }
  }, [selectedNode])

  // Variable management
  const addVariable = () => {
    if (!newVariable.name?.trim()) {
      toast({
        title: "Variable name required",
        description: "Please enter a name for the variable.",
        variant: "destructive",
      })
      return
    }

    const variable: Variable = {
      id: `var_${Date.now()}`,
      name: newVariable.name,
      type: newVariable.type || "string",
      description: newVariable.description || "",
      required: newVariable.required || false,
    }

    setVariables([...variables, variable])
    setNewVariable({ name: "", type: "string", description: "", required: false })
    toast({
      title: "Variable added",
      description: `Variable "${variable.name}" has been added.`,
    })
  }

  const removeVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id))
    toast({
      title: "Variable removed",
      description: "The variable has been removed.",
    })
  }

  const updateVariable = (id: string, updates: Partial<Variable>) => {
    setVariables(variables.map((v) => (v.id === id ? { ...v, ...updates } : v)))
  }

  // Fine-tuning examples management
  const addConditionExample = () => {
    const example: ConditionExample = {
      id: `cond_${Date.now()}`,
      label: "New Condition",
      nodeId: "",
    }
    setConditionExamples([...conditionExamples, example])
  }

  const updateConditionExample = (id: string, updates: Partial<ConditionExample>) => {
    setConditionExamples(conditionExamples.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex)))
  }

  const removeConditionExample = (id: string) => {
    setConditionExamples(conditionExamples.filter((ex) => ex.id !== id))
  }

  const addDialogueExample = () => {
    const example: DialogueExample = {
      id: `dial_${Date.now()}`,
      userInput: "",
      aiResponse: "",
    }
    setDialogueExamples([...dialogueExamples, example])
  }

  const updateDialogueExample = (id: string, updates: Partial<DialogueExample>) => {
    setDialogueExamples(dialogueExamples.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex)))
  }

  const removeDialogueExample = (id: string) => {
    setDialogueExamples(dialogueExamples.filter((ex) => ex.id !== id))
  }

  const addPathwayExample = () => {
    const example: PathwayExample = {
      id: `path_${Date.now()}`,
      context: "",
    }
    setPathwayExamples([...pathwayExamples, example])
  }

  const updatePathwayExample = (id: string, updates: Partial<PathwayExample>) => {
    setPathwayExamples(pathwayExamples.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex)))
  }

  const removePathwayExample = (id: string) => {
    setPathwayExamples(pathwayExamples.filter((ex) => ex.id !== id))
  }

  // Save node changes
  const handleSave = () => {
    if (!selectedNode) {
      toast({
        title: "No node selected",
        description: "Please select a node to edit.",
        variant: "destructive",
      })
      return
    }

    if (useStaticPrompt && !prompt.trim() && !isWebhookNode) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt for the node when using static prompt.",
        variant: "destructive",
      })
      return
    }

    let updates: any = {}

    if (isEndCallNode) {
      // End Call Node - Minimal format
      updates = {
        nodeTitle,
        text: prompt,
        prompt: prompt, // Keep both for compatibility
      }
    } else if (isTransferNode) {
      // Transfer Node - Simplified format
      updates = {
        nodeTitle,
        text: prompt,
        transferType,
        phone: transferType === "Phone Number" ? transferNumber : "",
        useStaticPrompt,
      }
    } else if (isExtractorNode) {
      // Customer Response Node (Extractor) - Bland.ai compatible format
      updates = {
        nodeTitle,
        text: prompt,
        extractCallInfo,
        extractionPrompt: extractCallInfo ? extractionPrompt : "",
        extractVars: extractCallInfo ? variables.map((v) => [v.name, v.type, v.description, v.required]) : [],
        extractVarSettings: {
          ignorePrevious,
        },
        modelOptions: {
          newTemperature: 0.2,
          skipUserResponse: false,
          disableEndCallTool: false,
          disableSilenceRepeat: false,
          isSMSReturnNode: false,
        },
      }
    } else if (isWebhookNode) {
      // Webhook Node - handled by WebhookNodeConfig component
      // Don't update here, let the webhook config handle it
      return
    } else {
      // Default Node - Full feature set
      updates = {
        nodeTitle,
        useStaticPrompt,
        text: useStaticPrompt ? prompt : "",
        loopCondition,
        isGlobal,
        globalLabel: isGlobal ? globalLabel : "",
        temperature: temperature[0],
        skipUserResponse,
        disableRepeatOnSilence,
        enableSmsReturnNode,
        disableEndCallTool,
        variables,
        conditionExamples,
        dialogueExamples,
        pathwayExamples,
      }
    }

    onUpdateNode(selectedNode.id, updates)
    toast({
      title: "Node updated",
      description: "Your changes have been saved successfully.",
    })
    onClose()
  }

  const getNodeTypeLabel = (nodeType: string) => {
    switch (nodeType) {
      case "greetingNode":
        return "Start Node"
      case "questionNode":
        return "Default Node"
      case "responseNode":
        return "Response Node"
      case "customerResponseNode":
        return "Extractor Node"
      case "transferNode":
        return "Transfer Node"
      case "endCallNode":
        return "End Call Node"
      case "webhookNode":
        return "Webhook Node"
      case "conditionalNode":
        return "Conditional Node"
      case "zapierNode":
        return "Zapier Node"
      case "facebookLeadNode":
        return "Facebook Lead Node"
      case "googleLeadNode":
        return "Google Lead Node"
      default:
        return "Node"
    }
  }

  const getNodeDescription = (nodeType: string) => {
    switch (nodeType) {
      case "greetingNode":
        return "Configure node behavior"
      case "questionNode":
        return "Configure AI message, response logic, variables, and advanced behavior"
      case "customerResponseNode":
        return "Extract variables from conversation - Bland.ai compatible"
      case "transferNode":
        return "Transfer call to phone number or phone tree"
      case "endCallNode":
        return "End the call with a final message"
      case "webhookNode":
        return "Make API calls to external services with response routing"
      default:
        return "Configure node behavior"
    }
  }

  // Early return if no node is selected
  if (!selectedNode) return null

  const isStartNode = selectedNode.type === "greetingNode" || selectedNode.data?.isStart || selectedNode.data?.isDefault
  const totalExamples = conditionExamples.length + dialogueExamples.length + pathwayExamples.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 bg-white">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isExtractorNode
                    ? "bg-purple-100"
                    : isTransferNode
                      ? "bg-amber-100"
                      : isEndCallNode
                        ? "bg-red-100"
                        : isWebhookNode
                          ? "bg-indigo-100"
                          : "bg-blue-100"
                }`}
              >
                {isExtractorNode ? (
                  <Database className="w-5 h-5 text-purple-600" />
                ) : isTransferNode ? (
                  <Phone className="w-5 h-5 text-amber-600" />
                ) : isEndCallNode ? (
                  <PhoneOff className="w-5 h-5 text-red-600" />
                ) : isWebhookNode ? (
                  <Webhook className="w-5 h-5 text-indigo-600" />
                ) : (
                  <Settings className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {getNodeTypeLabel(selectedNode.type)}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">{getNodeDescription(selectedNode.type)}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[calc(90vh-140px)]">
          <div className="px-6 py-6 space-y-6">
            {isWebhookNode ? (
              // Webhook Node UI - Full featured
              <WebhookNodeConfig
                node={selectedNode}
                updateNode={(updates) => onUpdateNode(selectedNode.id, updates)}
                availableNodes={availableNodes}
              />
            ) : isEndCallNode ? (
              // End Call Node UI - Minimal
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛑</span>
                    <h3 className="text-lg font-semibold text-gray-900">End Call</h3>
                  </div>

                  {/* Node Title */}
                  <div className="space-y-3">
                    <Label htmlFor="nodeTitle" className="text-sm font-medium text-gray-700">
                      Node Title
                    </Label>
                    <Input
                      id="nodeTitle"
                      value={nodeTitle}
                      onChange={(e) => setNodeTitle(e.target.value)}
                      placeholder="Internal label (optional)"
                    />
                    <p className="text-xs text-gray-500">Internal label for organization (not spoken).</p>
                  </div>

                  {/* Prompt */}
                  <div className="space-y-3">
                    <Label htmlFor="prompt" className="text-sm font-medium text-gray-700">
                      Prompt
                    </Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Thanks for calling. We're ending the call here."
                      className="min-h-[120px] resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      This is the last thing the agent will say before ending the call.
                    </p>
                  </div>
                </div>
              </>
            ) : isTransferNode ? (
              // Transfer Node UI - Simplified
              <>
                {/* General Section */}
                <Collapsible open={generalOpen} onOpenChange={setGeneralOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {generalOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <span className="text-lg">📝</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">General</h3>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-6 mt-4">
                    {/* Node Type (Static Label) */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">Node Type</Label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                        Transfer Call
                      </div>
                    </div>

                    {/* Node Title */}
                    <div className="space-y-3">
                      <Label htmlFor="nodeTitle" className="text-sm font-medium text-gray-700">
                        Node Title
                      </Label>
                      <Input
                        id="nodeTitle"
                        value={nodeTitle}
                        onChange={(e) => setNodeTitle(e.target.value)}
                        placeholder="Internal label (optional)"
                      />
                      <p className="text-xs text-gray-500">Internal label for organization (not spoken).</p>
                    </div>

                    {/* Static Prompt Toggle */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-gray-700">Use Static Prompt</Label>
                          <p className="text-xs text-gray-500">When you want the agent to say a specific dialogue</p>
                        </div>
                        <Switch checked={useStaticPrompt} onCheckedChange={setUseStaticPrompt} />
                      </div>

                      {/* Prompt - only show when static prompt is enabled */}
                      {useStaticPrompt && (
                        <div className="space-y-3 pl-4 border-l-2 border-blue-200 bg-blue-50/30 p-4 rounded-r-lg">
                          <Label htmlFor="prompt" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            Prompt <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Let me transfer you to the right department."
                            className="min-h-[120px] resize-none"
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* Transfer Type */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="transferType"
                        className="text-sm font-medium text-gray-700 flex items-center gap-1"
                      >
                        Transfer Type <span className="text-red-500">*</span>
                      </Label>
                      <Select value={transferType} onValueChange={setTransferType}>
                        <SelectTrigger id="transferType">
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
                      <div className="space-y-3">
                        <Label
                          htmlFor="transferNumber"
                          className="text-sm font-medium text-gray-700 flex items-center gap-1"
                        >
                          Transfer Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="transferNumber"
                          value={transferNumber}
                          onChange={(e) => setTransferNumber(e.target.value)}
                          placeholder="+1234567890"
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Enter the phone number to transfer the call to (include country code).
                        </p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </>
            ) : (
              // Default Node Editor UI - keeping existing implementation
              <>
                {/* General Section */}
                <Collapsible open={generalOpen} onOpenChange={setGeneralOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {generalOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <span className="text-lg">📝</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">General</h3>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-6 mt-4">
                    {/* Node Title */}
                    <div className="space-y-3">
                      <Label htmlFor="nodeTitle" className="text-sm font-medium text-gray-700">
                        Node Title
                      </Label>
                      <Input
                        id="nodeTitle"
                        value={nodeTitle}
                        onChange={(e) => setNodeTitle(e.target.value)}
                        placeholder="Internal label (optional)"
                      />
                      <p className="text-xs text-gray-500">Internal label for organization (not spoken).</p>
                    </div>

                    {/* Static Prompt Toggle */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-gray-700">Use Static Prompt</Label>
                          <p className="text-xs text-gray-500">When you want the agent to say a specific dialogue</p>
                        </div>
                        <Switch checked={useStaticPrompt} onCheckedChange={setUseStaticPrompt} />
                      </div>

                      {/* Prompt - only show when static prompt is enabled */}
                      {useStaticPrompt && (
                        <div className="space-y-3 pl-4 border-l-2 border-blue-200 bg-blue-50/30 p-4 rounded-r-lg">
                          <Label htmlFor="prompt" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            Prompt <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Provide a short goal/prompt for what the agent needs to do - e.g. Ask for the customer's name"
                            className="min-h-[120px] resize-none"
                            required
                          />
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                {/* Rest of the default node implementation would continue here... */}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer - only show for non-webhook nodes */}
        {!isWebhookNode && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50">
            <div className="flex justify-end gap-3">
              <Button onClick={onClose} variant="ghost" className="bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                Save Node
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
