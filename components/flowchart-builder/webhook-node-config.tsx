"use client"

import { useState, useEffect } from "react"
import { Trash2, ChevronDown, ChevronRight, Play, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "@/components/ui/use-toast"
import type { Node } from "reactflow"

interface HeaderPair {
  id: string
  key: string
  value: string
}

interface PathwayRoute {
  id: string
  trigger: "completed" | "success" | "fail"
  condition?: string
  value?: string
  targetNodeId: string
}

interface WebhookNodeConfigProps {
  node: Node
  updateNode: (updates: any) => void
  availableNodes?: Node[]
}

export function WebhookNodeConfig({ node, updateNode, availableNodes = [] }: WebhookNodeConfigProps) {
  // Form state
  const [nodeName, setNodeName] = useState("")
  const [extractCallInfo, setExtractCallInfo] = useState(false)

  // Webhook configuration
  const [method, setMethod] = useState("POST")
  const [url, setUrl] = useState("")
  const [authType, setAuthType] = useState("None")
  const [authToken, setAuthToken] = useState("")
  const [encodeAuth, setEncodeAuth] = useState(false)
  const [headers, setHeaders] = useState<HeaderPair[]>([])
  const [body, setBody] = useState("")
  const [timeout, setTimeout] = useState(10)
  const [retryAttempts, setRetryAttempts] = useState(0)
  const [reroute, setReroute] = useState(true)

  // Response and routing
  const [responseData, setResponseData] = useState(false)
  const [pathwayRoutes, setPathwayRoutes] = useState<PathwayRoute[]>([])
  const [sendSpeechDuringWebhook, setSendSpeechDuringWebhook] = useState(false)

  // Advanced options
  const [isGlobal, setIsGlobal] = useState(false)
  const [tagName, setTagName] = useState("")
  const [tagColor, setTagColor] = useState("#000000")

  // Collapsible sections
  const [webhookOpen, setWebhookOpen] = useState(true)
  const [pathwayOpen, setPathwayOpen] = useState(true)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Load data from node
  useEffect(() => {
    if (node?.data) {
      const data = node.data

      // Basic info
      setNodeName(data.name || data.nodeTitle || "")
      setExtractCallInfo(data.extractCallInfo || false)

      // Webhook config
      const webhook = data.webhook || {}
      setMethod(webhook.method || data.method || "POST")
      setUrl(webhook.url || data.url || "")
      setAuthType(data.authType || "None")
      setAuthToken(data.authToken || "")
      setEncodeAuth(data.encodeAuth || false)

      // Headers
      const webhookHeaders = webhook.headers || data.headers || {}
      const headerPairs = Object.entries(webhookHeaders).map(([key, value], index) => ({
        id: `header_${index}`,
        key,
        value: String(value),
      }))
      setHeaders(
        headerPairs.length > 0 ? headerPairs : [{ id: "header_0", key: "Content-Type", value: "application/json" }],
      )

      // Body and other settings
      setBody(typeof webhook.body === "string" ? webhook.body : JSON.stringify(webhook.body || {}, null, 2))
      setTimeout(webhook.timeout || data.timeout || 10)
      setRetryAttempts(webhook.retryAttempts || data.retryAttempts || 0)
      setReroute(webhook.reroute !== false)

      // Response routing
      setResponseData(data.responseData || false)
      const pathwayAfter = data.pathwayAfterApiResponse
      if (pathwayAfter) {
        setPathwayRoutes([
          {
            id: "route_0",
            trigger: pathwayAfter.trigger || "completed",
            condition: pathwayAfter.condition,
            value: pathwayAfter.value,
            targetNodeId: pathwayAfter.targetNodeId || "",
          },
        ])
      }

      setSendSpeechDuringWebhook(data.sendSpeechDuringWebhook || false)
      setIsGlobal(data.isGlobal || false)

      // Tag info
      const tag = data.tag || {}
      setTagName(tag.name || "")
      setTagColor(tag.color || "#000000")
    }
  }, [node])

  // Header management
  const addHeader = () => {
    const newHeader: HeaderPair = {
      id: `header_${Date.now()}`,
      key: "",
      value: "",
    }
    setHeaders([...headers, newHeader])
  }

  const updateHeader = (id: string, field: "key" | "value", value: string) => {
    setHeaders(headers.map((header) => (header.id === id ? { ...header, [field]: value } : header)))
  }

  const removeHeader = (id: string) => {
    setHeaders(headers.filter((header) => header.id !== id))
  }

  // Pathway route management
  const addPathwayRoute = () => {
    const newRoute: PathwayRoute = {
      id: `route_${Date.now()}`,
      trigger: "completed",
      targetNodeId: "",
    }
    setPathwayRoutes([...pathwayRoutes, newRoute])
  }

  const updatePathwayRoute = (id: string, updates: Partial<PathwayRoute>) => {
    setPathwayRoutes(pathwayRoutes.map((route) => (route.id === id ? { ...route, ...updates } : route)))
  }

  const removePathwayRoute = (id: string) => {
    setPathwayRoutes(pathwayRoutes.filter((route) => route.id !== id))
  }

  // Test API request
  const testApiRequest = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a webhook URL to test.",
        variant: "destructive",
      })
      return
    }

    try {
      // Build headers object
      const headersObj: Record<string, string> = {}
      headers.forEach((header) => {
        if (header.key.trim() && header.value.trim()) {
          headersObj[header.key] = header.value
        }
      })

      // Add auth header if needed
      if (authType !== "None" && authToken.trim()) {
        headersObj["Authorization"] = `${authType} ${authToken}`
      }

      const testData = {
        method,
        url,
        headers: headersObj,
        body: method !== "GET" ? body : undefined,
        timeout,
      }

      console.log("Testing webhook with:", testData)

      toast({
        title: "Test Request Sent",
        description: "Check the browser console for details.",
      })
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test request.",
        variant: "destructive",
      })
    }
  }

  // Save configuration
  const handleSave = () => {
    // Build headers object
    const headersObj: Record<string, string> = {}
    headers.forEach((header) => {
      if (header.key.trim() && header.value.trim()) {
        headersObj[header.key] = header.value
      }
    })

    // Parse body as JSON if possible
    let parsedBody = body
    try {
      if (body.trim()) {
        parsedBody = JSON.parse(body)
      }
    } catch {
      // Keep as string if not valid JSON
    }

    // Build the update object matching Bland.ai structure
    const updates = {
      name: nodeName,
      nodeTitle: nodeName,
      extractCallInfo,
      webhook: {
        method,
        url,
        headers: headersObj,
        body: parsedBody,
        timeout,
        retryAttempts,
        reroute,
      },
      authType,
      authToken,
      encodeAuth,
      responseData,
      pathwayAfterApiResponse:
        pathwayRoutes.length > 0
          ? {
              trigger: pathwayRoutes[0].trigger,
              condition: pathwayRoutes[0].condition,
              value: pathwayRoutes[0].value,
              targetNodeId: pathwayRoutes[0].targetNodeId,
            }
          : null,
      sendSpeechDuringWebhook,
      isGlobal,
      tag: tagName.trim()
        ? {
            name: tagName,
            color: tagColor,
          }
        : null,
    }

    updateNode(updates)

    toast({
      title: "Webhook Updated",
      description: "Your webhook configuration has been saved.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Node Name */}
      <div className="space-y-3">
        <Label htmlFor="nodeName" className="text-sm font-medium text-gray-700">
          Name
        </Label>
        <Input
          id="nodeName"
          value={nodeName}
          onChange={(e) => setNodeName(e.target.value)}
          placeholder="New Webhook Node"
        />
      </div>

      {/* Extract Call Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Extract Call Info into Variables</Label>
            <p className="text-xs text-gray-500">
              Extract information from the call into variables, and use them in your webhook parameters. Gets run before
              the webhook is called.
            </p>
          </div>
          <Switch checked={extractCallInfo} onCheckedChange={setExtractCallInfo} />
        </div>
      </div>

      {/* Webhook Configuration */}
      <Collapsible open={webhookOpen} onOpenChange={setWebhookOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
            <div className="flex items-center gap-2">
              {webhookOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <h3 className="text-base font-medium text-gray-900">Webhook</h3>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">Add API details to fetch data from an external source.</p>

          {/* Method and URL */}
          <div className="flex gap-3">
            <div className="w-32">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL" />
            </div>
          </div>

          {/* Authorization */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={authType !== "None"}
                onCheckedChange={(checked) => setAuthType(checked ? "Bearer" : "None")}
              />
              <Label className="text-sm font-medium text-gray-700">Authorization</Label>
            </div>

            {authType !== "None" && (
              <div className="flex gap-3 items-center">
                <div className="w-32">
                  <Select value={authType} onValueChange={setAuthType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bearer">Bearer</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="API-Key">API-Key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Input
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="Enter token"
                    type="password"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={encodeAuth} onCheckedChange={setEncodeAuth} />
                  <Label className="text-xs text-gray-600">Encode</Label>
                </div>
              </div>
            )}
          </div>

          {/* Headers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={headers.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked && headers.length === 0) {
                      addHeader()
                    } else if (!checked) {
                      setHeaders([])
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
              <div className="space-y-2">
                {headers.map((header) => (
                  <div key={header.id} className="flex gap-2 items-center">
                    <Input
                      value={header.key}
                      onChange={(e) => updateHeader(header.id, "key", e.target.value)}
                      placeholder="Header name"
                      className="flex-1"
                    />
                    <Input
                      value={header.value}
                      onChange={(e) => updateHeader(header.id, "value", e.target.value)}
                      placeholder="Header value"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => removeHeader(header.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          {method !== "GET" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!body}
                  onCheckedChange={(checked) => {
                    if (!checked) setBody("")
                    else setBody('{\n  "call_id": "{{call_id}}",\n  "data": {}\n}')
                  }}
                />
                <Label className="text-sm font-medium text-gray-700">Body</Label>
              </div>

              {body && (
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter request body (JSON)"
                  className="min-h-[120px] font-mono text-sm"
                />
              )}
            </div>
          )}

          {/* Timeout and Retry */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Timeout (seconds)</Label>
              <Input
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(Number(e.target.value))}
                min="1"
                max="60"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                Retry Attempts
                <HelpCircle className="w-3 h-3 text-gray-400" />
              </Label>
              <Input
                type="number"
                value={retryAttempts}
                onChange={(e) => setRetryAttempts(Number(e.target.value))}
                min="0"
                max="5"
              />
            </div>
          </div>

          {/* Reroute through server */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                Reroute through server
                <HelpCircle className="w-3 h-3 text-gray-400" />
              </Label>
            </div>
            <Switch checked={reroute} onCheckedChange={setReroute} />
          </div>

          {/* Test API Request */}
          <Button onClick={testApiRequest} className="w-full bg-green-600 hover:bg-green-700">
            <Play className="w-4 h-4 mr-2" />
            Test API Request
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Response Data */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-700">Response Data</Label>
        </div>
        <Switch checked={responseData} onCheckedChange={setResponseData} />
      </div>

      {/* Pathway After API Request Response */}
      <Collapsible open={pathwayOpen} onOpenChange={setPathwayOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
            <div className="flex items-center gap-2">
              {pathwayOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <h3 className="text-base font-medium text-gray-900">Pathway After API Request Response</h3>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            Select the pathway to follow after the API Request response. Pathway can be selected based on the API
            Request response variable matching a specific value.
          </p>

          {pathwayRoutes.length === 0 && (
            <Button onClick={addPathwayRoute} className="w-full">
              Add Pathway
            </Button>
          )}

          {pathwayRoutes.map((route) => (
            <Card key={route.id} className="border border-gray-200">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Trigger</Label>
                    <Select
                      value={route.trigger}
                      onValueChange={(value) => updatePathwayRoute(route.id, { trigger: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">API Request Completed</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Condition</Label>
                    <Select
                      value={route.condition || ""}
                      onValueChange={(value) => updatePathwayRoute(route.id, { condition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Value</Label>
                    <Input
                      value={route.value || ""}
                      onChange={(e) => updatePathwayRoute(route.id, { value: e.target.value })}
                      placeholder="Enter a Value/Response Code"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-600">Target Node</Label>
                  <Select
                    value={route.targetNodeId}
                    onValueChange={(value) => updatePathwayRoute(route.id, { targetNodeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Node" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableNodes.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.data?.name || node.data?.nodeTitle || node.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => removePathwayRoute(route.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Send Speech During Webhook */}
      <div className="space-y-3">
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
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
            <div className="flex items-center gap-2">
              {advancedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <h3 className="text-base font-medium text-gray-900">Advanced Options</h3>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            Adjust settings to optimize model performance (Temperature, Latency, and Model Intelligence)
          </p>

          {/* Global Node */}
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
        </CollapsibleContent>
      </Collapsible>

      {/* Node Tag */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900">Node Tag</h3>
          {tagName && (
            <Button
              onClick={() => {
                setTagName("")
                setTagColor("#000000")
              }}
              size="sm"
              variant="outline"
            >
              Remove Tag
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600">Add a tag to your call when this node gets executed</p>

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Tag Name</Label>
            <Input value={tagName} onChange={(e) => setTagName(e.target.value)} placeholder="Enter tag name" />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Tag Color</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={tagColor}
                onChange={(e) => setTagColor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
              <div className="w-8 h-8 rounded border border-gray-300" style={{ backgroundColor: tagColor }} />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
          Save
        </Button>
      </div>
    </div>
  )
}
