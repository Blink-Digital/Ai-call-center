"use client"

import { NodeEditorDrawer } from "./node-editor-drawer"
import type React from "react"
import { useCallback, useRef, useState, useEffect } from "react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  type Connection,
  type Edge,
  type Node,
  getBezierPath,
  useReactFlow,
} from "reactflow"
import "reactflow/dist/style.css"
import { NodeSidebar } from "./node-sidebar"
import { nodeTypes } from "./node-types"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { initialNodes } from "./initial-data"
import { Play } from "lucide-react"
import { JsonPreview } from "./json-preview"
import { TestPathwayDialog } from "./test-pathway-dialog"
import { useAuth } from "@/contexts/auth-context"
import { saveFlowchart as saveFlowchartUtil } from "@/utils/save-flowchart"
import { useSearchParams } from "next/navigation"

const initialEdges: Edge[] = []

// Helper function to normalize IDs
function normalizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_")
}

// Helper function to normalize node IDs
function normalizeNodeIds(flowchart: any) {
  if (!flowchart || !flowchart.nodes || !Array.isArray(flowchart.nodes)) {
    console.warn("Invalid flowchart structure:", flowchart)
    return flowchart
  }

  const idMap = new Map()
  const normalizedFlowchart = JSON.parse(JSON.stringify(flowchart))

  normalizedFlowchart.nodes = normalizedFlowchart.nodes.filter((node: any) => {
    if (!node || !node.id || typeof node.id !== "string") {
      console.warn("Skipping node with invalid ID:", node)
      return false
    }
    return true
  })

  normalizedFlowchart.nodes.forEach((node: any) => {
    const originalId = node.id
    const normalizedId = originalId.replace(/[^a-zA-Z0-9_]/g, "_")
    node.id = normalizedId
    idMap.set(originalId, normalizedId)
  })

  if (normalizedFlowchart.edges && Array.isArray(normalizedFlowchart.edges)) {
    normalizedFlowchart.edges = normalizedFlowchart.edges.filter((edge: any) => {
      if (!edge || !edge.source || !edge.target || typeof edge.source !== "string" || typeof edge.target !== "string") {
        console.warn("Skipping edge with invalid source or target:", edge)
        return false
      }
      return true
    })

    normalizedFlowchart.edges.forEach((edge: any) => {
      if (idMap.has(edge.source)) {
        edge.source = idMap.get(edge.source)
      }
      if (idMap.has(edge.target)) {
        edge.target = idMap.get(edge.target)
      }
      if (edge.sourceHandle && typeof edge.sourceHandle === "string") {
        edge.sourceHandle = edge.sourceHandle.replace(/[^a-zA-Z0-9_]/g, "_")
      }
      if (edge.targetHandle && typeof edge.targetHandle === "string") {
        edge.targetHandle = edge.targetHandle.replace(/[^a-zA-Z0-9_]/g, "_")
      }
    })
  }

  return normalizedFlowchart
}

// Convert flowchart to Bland format
function convertFlowchartToBlandFormat(flowchart: any) {
  console.log("Converting flowchart to Bland format:", flowchart)

  if (!flowchart || !flowchart.nodes || !Array.isArray(flowchart.nodes)) {
    console.error("Invalid flowchart structure:", flowchart)
    return {
      name: flowchart?.name || "Bland.ai Pathway",
      description: flowchart?.description || `Pathway created on ${new Date().toISOString()}`,
      nodes: [],
      edges: [],
    }
  }

  // Filter out invalid nodes and convert to Bland format
  const blandNodes = flowchart.nodes
    .filter((node: any) => node && node.id && node.type && node.data)
    .map((node: any) => {
      const blandNode: any = {
        id: node.id,
        type: mapNodeTypeToBlandType(node.type),
        data: {
          ...node.data,
          isStart: false,
        },
      }

      if (blandNode.type === "Default" && !blandNode.data.text) {
        blandNode.data.text = "Default response"
      }

      if (blandNode.type === "End Call" && !blandNode.data.prompt) {
        blandNode.data.prompt = blandNode.data.text || "Thank you for calling. Goodbye!"
      }

      return blandNode
    })

  // Set start node
  if (blandNodes.length > 0) {
    const greetingNode = blandNodes.find((node) => node.type === "Default")
    if (greetingNode) {
      greetingNode.data.isStart = true
    } else {
      blandNodes[0].data.isStart = true
    }
  }

  // Convert edges to Bland format
  const blandEdges = (flowchart.edges || [])
    .filter((edge: any) => edge && edge.source && edge.target)
    .map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.data?.label || edge.label || "next",
    }))

  const result = {
    name: flowchart.name || "Bland.ai Pathway",
    description: flowchart.description || `Pathway created on ${new Date().toISOString()}`,
    nodes: blandNodes,
    edges: blandEdges,
  }

  console.log("Converted Bland format:", result)
  return result
}

// Map node types to Bland types
function mapNodeTypeToBlandType(type: string): string {
  switch (type) {
    case "greetingNode":
    case "questionNode":
    case "customerResponseNode":
      return "Default"
    case "endCallNode":
      return "End Call"
    case "transferNode":
      return "Transfer Call"
    case "webhookNode":
      return "Webhook"
    default:
      return "Default"
  }
}

// Custom edge component
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
  selected,
}: any) => {
  const [isHovered, setIsHovered] = useState(false)
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const label = data?.label || "next"
  const { setEdges } = useReactFlow()

  const handleDelete = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      setEdges((edges) => edges.filter((edge) => edge.id !== id))
      toast({
        title: "Connection removed",
        description: "The connection has been deleted.",
      })
    },
    [id, setEdges],
  )

  const deleteButtonX = (sourceX + targetX) / 2
  const deleteButtonY = (sourceY + targetY) / 2 - 20

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: selected || isHovered ? "#3b82f6" : style.stroke || "#b1b1b7",
          strokeWidth: selected || isHovered ? 3 : style.strokeWidth || 1.5,
          cursor: "pointer",
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          if (!selected) {
            setEdges((edges) =>
              edges.map((e) => ({
                ...e,
                selected: e.id === id,
              })),
            )
          }
        }}
      />
      {label && (
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: selected || isHovered ? "#eff6ff" : "white",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 500,
            pointerEvents: "all",
            border: selected || isHovered ? "1px solid #3b82f6" : "1px solid #d1d5db",
            cursor: "pointer",
            boxShadow: selected || isHovered ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => {
            e.stopPropagation()
            setEdges((edges) =>
              edges.map((e) => ({
                ...e,
                selected: e.id === id,
              })),
            )
          }}
        >
          {label}
        </div>
      )}
      {(selected || isHovered) && (
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${deleteButtonX}px, ${deleteButtonY}px)`,
            background: "#ef4444",
            color: "white",
            borderRadius: "50%",
            width: "22px",
            height: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            pointerEvents: "all",
            zIndex: 10,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            transition: "transform 0.1s ease-in-out",
          }}
          className="nodrag nopan"
          onClick={handleDelete}
          title="Delete connection"
        >
          ✖
        </div>
      )}
    </>
  )
}

const edgeTypes = {
  custom: CustomEdge,
}

// Main FlowchartBuilder component
function FlowchartBuilderComponent({
  phoneNumber,
  initialPathwayId,
  initialPathwayName,
  initialData,
}: {
  phoneNumber?: string
  initialPathwayId?: string | null
  initialPathwayName?: string | null
  initialData?: any
}) {
  // All hooks must be at the top level
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()

  // Parse generated flowchart from URL
  const generatedParam = searchParams?.get("generated")
  const timestampParam = searchParams?.get("timestamp")

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || initialEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  // State variables
  const [deployDialogOpen, setDeployDialogOpen] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [pathwayName, setPathwayName] = useState("")
  const [pathwayDescription, setPathwayDescription] = useState("")
  const [isDeploying, setIsDeploying] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")
  const [connectionMessage, setConnectionMessage] = useState("")
  const [deploymentResult, setDeploymentResult] = useState<any>(null)
  const [blandPayload, setBlandPayload] = useState<any>(null)
  const [testPathwayOpen, setTestPathwayOpen] = useState(false)
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null)
  const [sendTestCallOpen, setSendTestCallOpen] = useState(false)
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState<any>(null)
  const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false)
  const [existingPathwayId, setExistingPathwayId] = useState<string | null>(initialPathwayId || null)

  // Initialize pathway name
  useEffect(() => {
    if (initialPathwayName) {
      setPathwayName(initialPathwayName)
    } else if (phoneNumber) {
      const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber}`
      setPathwayName(`Pathway for ${formattedNumber}`)
      setPathwayDescription(`Call flow for phone number ${formattedNumber}`)
    }

    // Load saved API key
    const savedApiKey = localStorage.getItem("bland-api-key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [initialPathwayName, phoneNumber])

  // Load generated flowchart data from URL
  useEffect(() => {
    if (generatedParam && reactFlowInstance) {
      try {
        console.log("[FLOWCHART] 🤖 Loading AI-generated flowchart from URL...")
        const generatedData = JSON.parse(decodeURIComponent(generatedParam))

        if (generatedData.nodes && generatedData.edges) {
          console.log("[FLOWCHART] ✅ Setting generated nodes and edges:", {
            nodes: generatedData.nodes.length,
            edges: generatedData.edges.length,
          })

          setNodes(generatedData.nodes)
          setEdges(generatedData.edges)

          // Update pathway name if provided
          if (generatedData.name) {
            setPathwayName(generatedData.name)
          }
          if (generatedData.description) {
            setPathwayDescription(generatedData.description)
          }

          // Fit view to show all nodes
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2 })
          }, 100)

          toast({
            title: "AI-Generated Flowchart Loaded",
            description: `Loaded ${generatedData.nodes.length} nodes and ${generatedData.edges.length} connections`,
          })
        }
      } catch (error) {
        console.error("[FLOWCHART] ❌ Error parsing generated data:", error)
        toast({
          title: "Error loading generated flowchart",
          description: "Failed to parse the AI-generated flowchart data",
          variant: "destructive",
        })
      }
    }
  }, [generatedParam, reactFlowInstance, setNodes, setEdges])

  // Update Bland.ai payload preview
  useEffect(() => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject()
      flow.name = pathwayName || "Bland.ai Pathway"
      flow.description = pathwayDescription || `Pathway created on ${new Date().toLocaleString()}`

      const normalizedFlow = normalizeNodeIds(flow)
      const blandFormat = convertFlowchartToBlandFormat(normalizedFlow)
      setBlandPayload(blandFormat)
    }
  }, [nodes, edges, reactFlowInstance, pathwayName, pathwayDescription])

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((node) => node.id === params.source)
      let edgeData = {}

      if (sourceNode) {
        if (sourceNode.type === "customerResponseNode" && params.sourceHandle?.startsWith("response-")) {
          const responseIndex = Number.parseInt(params.sourceHandle.split("-")[1])
          const responses = sourceNode.data.options || sourceNode.data.responses || []

          if (responses.length > 0) {
            const responseText =
              responseIndex >= 0 && responseIndex < responses.length ? responses[responseIndex] : responses[0]
            edgeData = { label: `User responded ${responseText}` }
          } else {
            edgeData = { label: "next" }
          }
        } else if (sourceNode.type === "conditionalNode") {
          if (params.sourceHandle === "true") {
            edgeData = { label: sourceNode.data.trueLabel || "Yes" }
          } else if (params.sourceHandle === "false") {
            edgeData = { label: sourceNode.data.falseLabel || "No" }
          }
        }
      }

      const edge = {
        ...params,
        data: edgeData,
        type: "custom",
      }

      setEdges((eds) => addEdge(edge, eds))
    },
    [nodes, setEdges],
  )

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      const type = event.dataTransfer.getData("application/reactflow")

      if (typeof type === "undefined" || !type || !reactFlowBounds || !reactFlowInstance) {
        return
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const rawNodeId = `${type.toLowerCase()}_${Date.now()}`
      const newNodeId = normalizeId(rawNodeId)

      let nodeData = {}

      switch (type) {
        case "greetingNode":
          nodeData = {
            text: "Hello! This is an AI assistant calling. How are you today?",
          }
          break
        case "questionNode":
          nodeData = {
            text: "What can I help you with today?",
          }
          break
        case "responseNode":
          nodeData = {
            text: "I understand. Let me help you with that.",
          }
          break
        case "customerResponseNode":
          nodeData = {
            responses: ["Age", "Name", "Email", "Phone"],
            options: ["Age", "Name", "Email", "Phone"],
            isOpenEnded: false,
            intentDescription: "Capture customer's response and determine their intent",
          }
          break
        case "endCallNode":
          nodeData = {
            text: "Thank you for your time. Goodbye!",
          }
          break
        default:
          nodeData = {}
      }

      const newNode: Node = {
        id: newNodeId,
        type,
        position,
        data: nodeData,
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes],
  )

  const handleNodeClick = useCallback((event: any, node: any) => {
    setSelectedNodeForEdit(node)
    setIsNodeEditorOpen(true)
  }, [])

  const handleUpdateNode = useCallback(
    (nodeId: string, updates: any) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...updates,
                },
              }
            : node,
        ),
      )
    },
    [setNodes],
  )

  const handleCloseNodeEditor = useCallback(() => {
    setIsNodeEditorOpen(false)
    setSelectedNodeForEdit(null)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const handleDeploy = async () => {
    if (!reactFlowInstance) {
      toast({
        title: "Error",
        description: "Flowchart not ready. Please wait a moment and try again.",
        variant: "destructive",
      })
      return
    }

    if (!pathwayName.trim()) {
      toast({
        title: "Missing pathway name",
        description: "Please provide a name for your pathway.",
        variant: "destructive",
      })
      return
    }

    setDeployDialogOpen(true)
  }

  const handleSaveFlowchart = async () => {
    if (!reactFlowInstance || !user || !phoneNumber) {
      toast({
        title: "Cannot save",
        description: "Missing required information to save flowchart.",
        variant: "destructive",
      })
      return
    }

    const flow = reactFlowInstance.toObject()

    const result = await saveFlowchartUtil({
      nodes: flow.nodes,
      edges: flow.edges,
      phoneNumber,
      pathwayName: pathwayName || `Pathway for ${phoneNumber}`,
      pathwayDescription: pathwayDescription || `Call flow for phone number ${phoneNumber}`,
      user,
    })

    if (result.success && result.pathway) {
      if (result.action === "created" && result.pathway.id) {
        setExistingPathwayId(result.pathway.id)
      }
    }
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flowchart builder...</p>
        </div>
      </div>
    )
  }

  // Show auth required state
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to use the flowchart builder.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
        <NodeSidebar />
        <div className="flex-1 min-w-0 h-full overflow-hidden bg-white">
          <div className="w-full h-full" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={{ type: "custom" }}
              selectNodesOnDrag={false}
              elementsSelectable={true}
              edgesFocusable={true}
              edgesUpdatable={true}
              fitView
              deleteKeyCode={["Backspace", "Delete"]}
              className="w-full h-full"
              style={{ width: "100%", height: "100%" }}
            >
              <Controls className="bg-white border border-gray-200 shadow-lg rounded-xl" />
              <MiniMap
                className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden"
                nodeColor="#3b82f6"
                maskColor="rgba(0, 0, 0, 0.1)"
              />
              <Background variant="dots" gap={20} size={1} color="#e5e7eb" />
              <Panel position="top-right" className="flex gap-3 p-4">
                <Button onClick={handleSaveFlowchart} className="bg-green-600 hover:bg-green-700 shadow-md" size="sm">
                  Save Flowchart
                </Button>
                <Button
                  onClick={() => setTestPathwayOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-md"
                  size="sm"
                >
                  <Play className="h-4 w-4" />
                  Test Pathway
                </Button>
                {blandPayload && <JsonPreview data={blandPayload} title="Bland.ai Pathway JSON" />}
                <Button onClick={handleDeploy} className="bg-blue-600 hover:bg-blue-700 shadow-md" size="sm">
                  {existingPathwayId ? "Update Pathway" : "Deploy to Bland.ai"}
                </Button>
              </Panel>
              <Panel
                position="top-left"
                className="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="text-xs text-gray-600">
                  <div>Nodes: {nodes.length}</div>
                  <div>Edges: {edges.length}</div>
                  <div>Phone: {phoneNumber || "None"}</div>
                  <div>Pathway ID: {existingPathwayId || "None"}</div>
                  <div>API Key: {apiKey ? "Set" : "Missing"}</div>
                  <div>User: {user?.email || "None"}</div>
                  <div className="text-xs font-medium mt-1">
                    Status: {existingPathwayId ? "🔄 Will Update" : "🆕 Will Create New"}
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>
      </div>

      <NodeEditorDrawer
        isOpen={isNodeEditorOpen}
        onClose={handleCloseNodeEditor}
        selectedNode={selectedNodeForEdit}
        onUpdateNode={handleUpdateNode}
      />

      {testPathwayOpen && reactFlowInstance && (
        <TestPathwayDialog
          isOpen={testPathwayOpen}
          onClose={() => {
            setTestPathwayOpen(false)
            setHighlightedNodeId(null)
          }}
          flowchartData={reactFlowInstance.toObject()}
          onHighlightNode={(nodeId) => setHighlightedNodeId(nodeId)}
        />
      )}

      <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{existingPathwayId ? "Update Pathway" : "Deploy to Bland.ai"}</DialogTitle>
            <DialogDescription>
              {existingPathwayId
                ? `Update your existing pathway (${existingPathwayId}) with the current flowchart.`
                : "Enter your Bland.ai API key and pathway details to deploy your flowchart."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right">
                API Key
              </Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="org_..."
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pathwayName" className="text-right">
                Pathway Name
              </Label>
              <Input
                id="pathwayName"
                value={pathwayName}
                onChange={(e) => setPathwayName(e.target.value)}
                placeholder="My Pathway"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pathwayDescription" className="text-right">
                Description
              </Label>
              <Input
                id="pathwayDescription"
                value={pathwayDescription}
                onChange={(e) => setPathwayDescription(e.target.value)}
                placeholder="A description of your pathway"
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeployDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!apiKey || !pathwayName || isDeploying}>
              {isDeploying ? "Deploying..." : existingPathwayId ? "Update Pathway" : "Deploy Pathway"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Export as default
export default FlowchartBuilderComponent
