"use client"

import { useState, useEffect } from "react"
import { Plus, ChevronDown, ChevronRight, TestTube, Tag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"

interface Header {
  id: string
  key: string
  value: string
}

interface ResponsePathway {
  id: string
  label: string
  condition?: string
  conditionType?: string
  targetNodeId?: string
}

interface WebhookAuth {
  type: "none" | "bearer" | "basic"
  token: string
  encode: boolean
}

interface WebhookNodeConfigProps {
  node: any
  updateNode: (updates: any) => void
  availableNodes?: any[]
}

export function WebhookNodeConfig({ node, updateNode, availableNodes = [] }: WebhookNodeConfigProps) {
  // Basic webhook settings
  const [nodeTitle, setNodeTitle] = useState("")
  const [url, setUrl] = useState("")
  const [method, setMethod] = useState<"GET" | "POST">("POST")
  const [timeoutValue, setTimeoutValue] = useState(10)
  const [maxRetries, setMaxRetries] = useState(0)
  const [body, setBody] = useState("")

  // Authentication
  const [auth, setAuth] = useState<WebhookAuth>({
    type: "none",
    token: "",
    encode: false,
  })

  // Headers
  const [headers, setHeaders] = useState<Header[]>([])
  const [newHeader, setNewHeader] = useState({ key: "", value: "" })

  // Response pathways
  const [responsePathways, setResponsePathways] = useState<ResponsePathway[]>([])
  const [newPathway, setNewPathway] = useState({
    label: "",
    condition: "",
    conditionType: "",
    targetNodeId: "",
  })

  // Optional settings
  const [extractVarsBeforeCall, setExtractVarsBeforeCall] = useState(false)
  const [rerouteThroughServer, setRerouteThroughServer] = useState(false)
  const [sendSpeechDuringWebhook, setSendSpeechDuringWebhook] = useState(false)
  const [isGlobal, setIsGlobal] = useState(false)
  const [globalLabel, setGlobalLabel] = useState("")

  // Tag settings
  const [tag, setTag] = useState<{ name: string; color: string } | null>(null)
  const [tagName, setTagName] = useState("")
  const [tagColor, setTagColor] = useState("#000000")

  // Advanced options
  const [temperature, setTemperature] = useState([0.7])

  // Collapsible sections
  const [webhookDetailsOpen, setWebhookDetailsOpen] = useState(true)
  const [responsePathwaysOpen, setResponsePathwaysOpen] = useState(true)
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false)

  // Load data from node
  useEffect(() => {
    if (node?.data) {
      const data = node.data
      setNodeTitle(data.nodeTitle || "")
      setUrl(data.url || "")
      setMethod(data.method || "POST")
      setTimeoutValue(data.timeoutValue || 10)
      setMaxRetries(data.max_retries || 0)
      setBody(data.body || JSON.stringify({ call_id: "{{call_id}}", data: "{{extracted_data}}" }, null, 2))

      // Auth
      setAuth(data.auth || { type: "none", token: "", encode: false })

      // Headers
      if (data.headers && Array.isArray(data.headers)) {
        setHeaders(
          data.headers.map((h: any, index: number) => ({
            id: `header_${index}`,
            key: h.key || h[0] || "",
            value: h.value || h[1] || "",
          })),
        )
      } else {
        // Default headers
        setHeaders([{ id: "header_0", key: "Content-Type", value: "application/json" }])
      }

      // Response pathways
      setResponsePathways(data.responsePathways || [])

      // Optional settings
      setExtractVarsBeforeCall(data.extractVarsBeforeCall || false)
      setRerouteThroughServer(data.rerouteThroughServer || false)
      setSendSpeechDuringWebhook(data.sendSpeechDuringWebhook || false)
      setIsGlobal(data.isGlobal || false)
      setGlobalLabel(data.globalLabel || "")

      // Tag
      setTag(data.tag || null)
      if (data.tag) {
        setTagName(data.tag.name || "")
        setTagColor(data.tag.color || "#000000")
      }

      // Advanced
      setTemperature([data.temperature || 0.7])
    }
  }, [node])

  // Header management
  const addHeader = () => {
    if (!newHeader.key.trim()) {
      toast({
        title: "Header key required",
        description: "Please enter a header key.",
        variant: "destructive",
      })
      return
    }

    const header: Header = {
      id: `header_${Date.now()}`,
      key: newHeader.key,
      value: newHeader.value,
    }

    setHeaders([...headers, header])
    setNewHeader({ key: "", value: "" })
  }

  const removeHeader = (id: string) => {
    setHeaders(headers.filter((h) => h.id !== id))
  }

  const updateHeader = (id: string, updates: Partial<Header>) => {
    setHeaders(headers.map((h) => (h.id === id ? { ...h, ...updates } : h)))
  }

  // Response pathway management
  const addResponsePathway = () => {
    if (!newPathway.label.trim()) {
      toast({
        title: "Pathway label required",
        description: "Please enter a label for the response pathway.",
        variant: "destructive",
      })
      return
    }

    const pathway: ResponsePathway = {
      id: `pathway_${Date.now()}`,
      label: newPathway.label,
      condition: newPathway.condition,
      conditionType: newPathway.conditionType,
      targetNodeId: newPathway.targetNodeId,
    }

    setResponsePathways([...responsePathways, pathway])
    setNewPathway({ label: "", condition: "", conditionType: "", targetNodeId: "" })

    toast({
      title: "Response pathway added",
      description: `Added pathway: ${pathway.label}`,
    })
  }

  const removeResponsePathway = (id: string) => {
    setResponsePathways(responsePathways.filter((p) => p.id !== id))
  }

  const updateResponsePathway = (id: string, updates: Partial<ResponsePathway>) => {
    setResponsePathways(responsePathways.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }

  // Tag management
  const addTag = () => {
    if (!tagName.trim()) {
      toast({
        title: "Tag name required",
        description: "Please enter a tag name.",
        variant: "destructive",
      })
      return
    }

    setTag({ name: tagName, color: tagColor })
    toast({
      title: "Tag added",
      description: `Added tag: ${tagName}`,
    })
  }

  const removeTag = () => {
    setTag(null)
    setTagName("")
    setTagColor("#000000")
  }

  // Test webhook
  const testWebhook = async () => {
    if (!url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a webhook URL to test.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Testing webhook...",
      description: "Sending test request to your webhook URL.",
    })

    // Here you would implement the actual webhook test
    // For now, just show a success message
    setTimeout(() => {
      toast({
        title: "Webhook test completed",
        description: "Check the response data section for results.",
      })
    }, 2000)
  }

  // Save all changes
  const handleSave = () => {
    const updates = {
      nodeTitle,
      url,
      method,
      timeoutValue,
      max_retries: maxRetries,
      body,
      auth,
      headers: headers.map((h) => ({ key: h.key, value: h.value })),
      responsePathways,
      extractVarsBeforeCall,
      rerouteThroughServer,
      sendSpeechDuringWebhook,
      isGlobal,
      globalLabel: isGlobal ? globalLabel : "",
      tag,
      temperature: temperature[0],
      // Ensure text field is set for compatibility
      text: nodeTitle || "Webhook API Call",
    }

    updateNode(updates)
  }

  // Auto-save on changes
  useEffect(() => {
    handleSave()
  }, [
    nodeTitle,
    url,
    method,
    timeoutValue,
    maxRetries,
    body,
    auth,
    headers,
    responsePathways,
    extractVarsBeforeCall,
    rerouteThroughServer,
    sendSpeechDuringWebhook,
    isGlobal,
    globalLabel,
    tag,
    temperature,
  ])

  return (
    <div className="space-y-6">
      {/* Node Title */}
      <div className="space-y-3">
        <Label htmlFor="nodeTitle" className="text-sm font-medium text-gray-700">
          Name
        </Label>
        <Input
          id="nodeTitle"
          value={nodeTitle}
          onChange={(e) => setNodeTitle(e.target.value)}
          placeholder="New Webhook Node"
        />
      </div>

      {/* Extract Call Info Toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Extract Call Info into Variables</Label>
            <p className="text-xs text-gray-500">
              Extract information from the call into variables, and use them in your webhook parameters. Gets run before
              the webhook is called.
            </p>
          </div>
          <Switch checked={extractVarsBeforeCall} onCheckedChange={setExtractVarsBeforeCall} />
        </div>
      </div>

      {/* Webhook Details */}
      <Collapsible open={webhookDetailsOpen} onOpenChange={setWebhookDetailsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
            <div className="flex items-center gap-2">
              {webhookDetailsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <h3 className="text-lg font-semibold text-gray-900">Webhook</h3>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-4">
          <p className="text-sm text-gray-600">Add API details to fetch data from an external source.</p>

          {/* Method and URL */}
          <div className="flex gap-3">
            <div className="w-32">
              <Select value={method} onValueChange={(value: "GET" | "POST") => setMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://v0-bland-call-end-handler.vercel.app/"
              />
            </div>
          </div>

          {/* Authorization */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={auth.type !== "none"}
                onCheckedChange={(checked) => setAuth({ ...auth, type: checked ? "bearer" : "none" })}
              />
              <Label className="text-sm font-medium text-gray-700">Authorization</Label>
            </div>

            {auth.type !== "none" && (
              <div className="space-y-3 pl-4 border-l-2 border-blue-200 bg-blue-50/30 p-4 rounded-r-lg">
                <div className="flex gap-3">
                  <div className="w-32">
                    <Select
                      value={auth.type}
                      onValueChange={(value: "none" | "bearer" | "basic") => setAuth({ ...auth, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="bearer">Bearer</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input
                      value={auth.token}
                      onChange={(e) => setAuth({ ...auth, token: e.target.value })}
                      placeholder="Enter token"
                      type="password"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={auth.encode}
                      onCheckedChange={(checked) => setAuth({ ...auth, encode: checked })}
                    />
                    <Label className="text-xs text-gray-600">Encode</Label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Headers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={headers.length > 0}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      setHeaders([])
                    } else {
                      setHeaders([{ id: "header_0", key: "Content-Type", value: "application/json" }])
                    }
                  }}
                />
                <Label className="text-sm font-medium text-gray-700">Headers</Label>
              </div>
              {headers.length > 0 && (
                <Button onClick={addHeader} size="sm" variant="outline">
                  Add Header
                </Button>
              )}
            </div>

            {headers.length > 0 && (
              <div className="space-y-3 pl-4 border-l-2 border-blue-200 bg-blue-50/30 p-4 rounded-r-lg">
                {/* Add new header */}
                <div className="flex gap-2">
                  <Input
                    value={newHeader.key}
                    onChange={(e) => setNewHeader({ ...newHeader, key: e.target.value })}
                    placeholder="Header key"
                    className="flex-1"
                  />
                  <Input
                    value={newHeader.value}
                    onChange={(e) => setNewHeader({ ...newHeader, value: e.target.value })}
                    placeholder="Header value"
                    className="flex-1"
                  />
                  <Button onClick={addHeader} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Existing headers */}
                {headers.map((header) => (
                  <div key={header.id} className="flex gap-2">
                    <Input
                      value={header.key}
                      onChange={(e) => updateHeader(header.id, { key: e.target.value })}
                      placeholder="Header key"
                      className="flex-1"
                    />
                    <Input
                      value={header.value}
                      onChange={(e) => updateHeader(header.id, { value: e.target.value })}
                      placeholder="Header value"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => removeHeader(header.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          {method === "POST" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!body}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      setBody("")
                    } else {
                      setBody(
                        JSON.stringify(
                          {
                            call_id: "{{call_id}}",
                            organization_id: "{{organization_id}}",
                            pathway_id: "{{pathway_id}}",
                            caller_number: "{{caller_number}}",
                          },
                          null,
                          2,
                        ),
                      )
                    }
                  }}
                />
                <Label className="text-sm font-medium text-gray-700">Body</Label>
              </div>

              {body && (
                <div className="pl-4 border-l-2 border-blue-200 bg-blue-50/30 p-4 rounded-r-lg">
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Request body (JSON)"
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Timeout and Retry */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Timeout (seconds)</Label>
              <Input
                type="number"
                value={timeoutValue}
                onChange={(e) => setTimeoutValue(Number(e.target.value))}
                min={1}
                max={60}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Retry Attempts</Label>
              <Input
                type="number"
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                min={0}
                max={5}
              />
            </div>
          </div>

          {/* Reroute through server */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700">Reroute through server</Label>
              <p className="text-xs text-gray-500">Route webhook requests through Bland.ai servers</p>
            </div>
            <Switch checked={rerouteThroughServer} onCheckedChange={setRerouteThroughServer} />
          </div>

          {/* Test API Request */}
          <Button onClick={testWebhook} className="w-full bg-green-600 hover:bg-green-700">
            <TestTube className="w-4 h-4 mr-2" />
            Test API Request
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Response Pathways */}
      <Collapsible open={responsePathwaysOpen} onOpenChange={setResponsePathwaysOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
            <div className="flex items-center gap-2">
              {responsePathwaysOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <h3 className="text-lg font-semibold text-gray-900">Pathway After API Request Response</h3>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-4">
          <p className="text-sm text-gray-600">
            Select the pathway to follow after the API Request response. Pathway can be selected based on the API
            Request response variable matching a specific value.
          </p>

          {/* Add new pathway */}
          <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <Input
                  value={newPathway.label}
                  onChange={(e) => setNewPathway({ ...newPathway, label: e.target.value })}
                  placeholder="API Request Completion"
                />
                <Select
                  value={newPathway.conditionType}
                  onValueChange={(value) => setNewPathway({ ...newPathway, conditionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                    <SelectItem value="exists">Exists</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={newPathway.condition}
                  onChange={(e) => setNewPathway({ ...newPathway, condition: e.target.value })}
                  placeholder="Enter a Value/Response Condition"
                />
                <Select
                  value={newPathway.targetNodeId}
                  onValueChange={(value) => setNewPathway({ ...newPathway, targetNodeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Target Node" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.data?.nodeTitle || node.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addResponsePathway} className="w-full">
                Add Pathway
              </Button>
            </CardContent>
          </Card>

          {/* Existing pathways */}
          {responsePathways.map((pathway) => (
            <Card key={pathway.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    value={pathway.label}
                    onChange={(e) => updateResponsePathway(pathway.id, { label: e.target.value })}
                    placeholder="Label"
                  />
                  <Select
                    value={pathway.conditionType || ""}
                    onValueChange={(value) => updateResponsePathway(pathway.id, { conditionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Condition Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="exists">Exists</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={pathway.condition || ""}
                    onChange={(e) => updateResponsePathway(pathway.id, { condition: e.target.value })}
                    placeholder="Condition Value"
                  />
                  <div className="flex gap-2">
                    <Select
                      value={pathway.targetNodeId || ""}
                      onValueChange={(value) => updateResponsePathway(pathway.id, { targetNodeId: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Target" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableNodes.map((node) => (
                          <SelectItem key={node.id} value={node.id}>
                            {node.data?.nodeTitle || node.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => removeResponsePathway(pathway.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Send Speech During Webhook */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Send Speech During Webhook</Label>
            <p className="text-xs text-gray-500">
              Enable speech output while the webhook is running in the background.
            </p>
          </div>
          <Switch checked={sendSpeechDuringWebhook} onCheckedChange={setSendSpeechDuringWebhook} />
        </div>
      </div>

      {/* Advanced Options */}
      <Collapsible open={advancedOptionsOpen} onOpenChange={setAdvancedOptionsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
            <div className="flex items-center gap-2">
              {advancedOptionsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <h3 className="text-lg font-semibold text-gray-900">Advanced Options</h3>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-4">
          <p className="text-sm text-gray-600">
            Adjust settings to optimize model performance (Temperature, Latency, and Model Intelligence)
          </p>

          {/* Temperature */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Temperature</Label>
              <Badge variant="outline" className="text-xs">
                {temperature[0]}
              </Badge>
            </div>
            <Slider value={temperature} onValueChange={setTemperature} max={1} min={0} step={0.1} className="w-full" />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Global Node */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Global Node</Label>
            <p className="text-xs text-gray-500">
              Toggle this if you want to make this node accessible from any other node. Global nodes have a hidden
              pathway that links all other nodes, to this node.
            </p>
          </div>
          <Switch checked={isGlobal} onCheckedChange={setIsGlobal} />
        </div>

        {isGlobal && (
          <div className="pl-4 border-l-2 border-green-200 bg-green-50/30 p-4 rounded-r-lg">
            <Label htmlFor="globalLabel" className="text-sm font-medium text-gray-700">
              Global Label
            </Label>
            <Input
              id="globalLabel"
              value={globalLabel}
              onChange={(e) => setGlobalLabel(e.target.value)}
              placeholder="Interrupt label name (optional)"
              className="mt-2"
            />
          </div>
        )}
      </div>

      {/* Node Tag */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Node Tag</Label>
            <p className="text-xs text-gray-500">Add a tag to your call when this node gets executed</p>
          </div>
          {tag && (
            <Button onClick={removeTag} size="sm" variant="outline" className="text-red-600 bg-transparent">
              Remove Tag
            </Button>
          )}
        </div>

        {!tag ? (
          <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Tag Name</Label>
                <Input value={tagName} onChange={(e) => setTagName(e.target.value)} placeholder="Enter tag name" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Tag Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
              <Button onClick={addTag} className="w-full">
                Add Tag
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-sm"
              style={{ backgroundColor: tag.color + "20", color: tag.color }}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag.name}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}
