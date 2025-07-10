"use client"

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
  ReactFlowProvider,
} from "reactflow"
import "reactflow/dist/style.css"
import { AddNodePanel } from "./add-node-panel"
import { NodeEditorDrawer } from "./node-editor-drawer"
import { EdgeEditorDrawer } from "./edge-editor-drawer"
import { nodeTypes } from "./node-types"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { initialNodes } from "./initial-data"
import { Play, Plus, Globe, Flag, Edit2 } from "lucide-react"
import { JsonPreview } from "./json-preview"
import { TestPathwayDialog } from "./test-pathway-dialog"
import { useAuth } from "@/contexts/auth-context"
import { saveFlowchart as saveFlowchartUtil } from "@/utils/save-flowchart"
import { useSearchParams } from "next/navigation"
import { convertFlowchartToBlandFormat, normalizeId } from "./deploy-utils"

const initialEdges: Edge[] = []

// Enhanced Custom Edge component with clickable labels
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
  onEdgeClick,
}: any) => {
  const [isHovered, setIsHovered] = useState(false)
  const { setEdges } = useReactFlow()

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const label = data?.label || "Proceed"

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

  const handleLabelClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      onEdgeClick?.(id)
    },
    [id, onEdgeClick],
  )

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

      {/* Clickable Label */}
      <foreignObject
        width={140}
        height={40}
        x={labelX - 70}
        y={labelY - 20}
        className="overflow-visible"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div
          style={{
            background: selected || isHovered ? "#eff6ff" : "white",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 500,
            border: selected || isHovered ? "2px solid #3b82f6" : "1px solid #d1d5db",
            cursor: "pointer",
            boxShadow: selected || isHovered ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "0 2px 4px 0 rgba(0, 0, 0, 0.1)",
            minWidth: "100px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            justifyContent: "center",
            position: "relative",
            zIndex: 1000,
            transition: "all 0.2s ease-in-out",
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleLabelClick}
        >
          <span>{label}</span>
          <Edit2 className="h-3 w-3 text-blue-600 opacity-70 hover:opacity-100" />
        </div>
      </foreignObject>

      {/* Delete button */}
      {(selected || isHovered) && (
        <foreignObject
          width={22}
          height={22}
          x={(sourceX + targetX) / 2 - 11}
          y={(sourceY + targetY) / 2 - 31}
          className="overflow-visible"
        >
          <div
            style={{
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
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              zIndex: 1001,
            }}
            className="nodrag nopan"
            onClick={handleDelete}
            title="Delete connection"
          >
            ✖
          </div>
        </foreignObject>
      )}
    </>
  )
}

// Main FlowchartBuilder component (wrapped with ReactFlowProvider)
function FlowchartBuilderInner({
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
  const [selectedEdgeForEdit, setSelectedEdgeForEdit] = useState<Edge | null>(null)
  const [isEdgeEditorOpen, setIsEdgeEditorOpen] = useState(false)
  const [existingPathwayId, setExistingPathwayId] = useState<string | null>(initialPathwayId || null)

  // New state for the redesigned interface
  const [isAddNodePanelOpen, setIsAddNodePanelOpen] = useState(false)
  const [lastNodePosition, setLastNodePosition] = useState({ x: 250, y: 100 })

  // Create edge types with click handler
  const edgeTypes = {
    custom: (props: any) => <CustomEdge {...props} onEdgeClick={handleEdgeClick} />,
  }

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
      const startNodeId = nodes.find((node) => node.type === "greetingNode")?.id || nodes[0]?.id || ""

      const blandFormat = convertFlowchartToBlandFormat(flow.nodes, flow.edges, startNodeId)
      blandFormat.name = pathwayName || "Bland.ai Pathway"
      blandFormat.description = pathwayDescription || `Pathway created on ${new Date().toLocaleString()}`

      setBlandPayload(blandFormat)
    }
  }, [nodes, edges, reactFlowInstance, pathwayName, pathwayDescription])

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((node) => node.id === params.source)
      let edgeLabel = "Proceed"

      if (sourceNode) {
        if (sourceNode.type === "customerResponseNode" && params.sourceHandle?.startsWith("response-")) {
          const responseIndex = Number.parseInt(params.sourceHandle.split("-")[1])
          const responses = sourceNode.data.options || sourceNode.data.responses || []

          if (responses.length > 0) {
            const responseText =
              responseIndex >= 0 && responseIndex < responses.length ? responses[responseIndex] : responses[0]
            edgeLabel = `User responded ${responseText}`
          }
        } else if (sourceNode.type === "conditionalNode") {
          if (params.sourceHandle === "true") {
            edgeLabel = sourceNode.data.trueLabel || "Yes"
          } else if (params.sourceHandle === "false") {
            edgeLabel = sourceNode.data.falseLabel || "No"
          }
        }
      }

      const edge: Edge = {
        id: `reactflow__edge-${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
        type: "custom",
        data: {
          label: edgeLabel,
          description: "",
          alwaysPick: false,
        },
      }

      setEdges((eds) => addEdge(edge, eds))

      // Add toast notification to confirm edge creation
      toast({
        title: "Connection created",
        description: `Added pathway with label: "${edgeLabel}"`,
      })
    },
    [nodes, setEdges],
  )

  const handleNodeClick = useCallback((event: any, node: any) => {
    setSelectedNodeForEdit(node)
    setIsNodeEditorOpen(true)
  }, [])

  const handleEdgeClick = useCallback(
    (edgeId: string) => {
      const edge = edges.find((e) => e.id === edgeId)
      if (edge) {
        setSelectedEdgeForEdit(edge)
        setIsEdgeEditorOpen(true)
      }
    },
    [edges],
  )

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

  const handleUpdateEdge = useCallback(
    (edgeId: string, updates: any) => {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: {
                  ...edge.data,
                  ...updates,
                },
              }
            : edge,
        ),
      )
    },
    [setEdges],
  )

  const handleCloseNodeEditor = useCallback(() => {
    setIsNodeEditorOpen(false)
    setSelectedNodeForEdit(null)
  }, [])

  const handleCloseEdgeEditor = useCallback(() => {
    setIsEdgeEditorOpen(false)
    setSelectedEdgeForEdit(null)
  }, [])

  const handleAddNode = useCallback(
    (nodeType: string, nodeData: any) => {
      const rawNodeId = `${nodeType.toLowerCase()}_${Date.now()}`
      const newNodeId = normalizeId(rawNodeId)

      // Calculate position with Y-offset from last node
      const newPosition = {
        x: lastNodePosition.x,
        y: lastNodePosition.y + 150, // 150px offset
      }

      const newNode: Node = {
        id: newNodeId,
        type: nodeType,
        position: newPosition,
        data: nodeData,
      }

      setNodes((nds) => nds.concat(newNode))
      setLastNodePosition(newPosition)

      toast({
        title: "Node added",
        description: `${nodeType} has been added to your pathway`,
      })
    },
    [lastNodePosition, setNodes],
  )

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

  const handleGlobalPrompt = () => {
    toast({
      title: "Global Prompt",
      description: "Global prompt configuration coming soon...",
    })
  }

  const handleFeatureFlags = () => {
    toast({
      title: "Feature Flags",
      description: "Feature flags configuration coming soon...",
    })
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
      <div className="h-full w-full overflow-hidden bg-white relative">
        {/* Floating Control Buttons - Top Left */}
        <div className="absolute top-4 left-4 z-50 flex flex-col gap-3">
          {/* Add New Node Button */}
          <Button
            onClick={() => setIsAddNodePanelOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-3 px-4 flex items-center gap-2 font-medium shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Add new node
          </Button>

          {/* Global Prompt Button */}
          <Button
            onClick={handleGlobalPrompt}
            variant="outline"
            className="rounded-lg py-3 px-4 flex items-center gap-2 font-medium border-blue-200 hover:bg-blue-50 transition-all duration-200 bg-white shadow-lg text-blue-600 border-2 hover:border-blue-300"
          >
            <Globe className="h-4 w-4" />
            Global Prompt
          </Button>

          {/* Feature Flags Button */}
          <Button
            onClick={handleFeatureFlags}
            variant="outline"
            className="rounded-lg py-3 px-4 flex items-center gap-2 font-medium border-gray-300 hover:bg-gray-50 transition-all duration-200 bg-white shadow-lg text-gray-600"
          >
            <Flag className="h-4 w-4" />
            Feature Flags
          </Button>
        </div>

        {/* Full Screen ReactFlow Canvas */}
        <div className="w-full h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
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

            {/* Action buttons in top-right corner with proper z-index */}
            <Panel position="top-right" className="flex gap-3 p-4 z-40">
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

            {/* Debug info panel - positioned to avoid overlap */}
            <Panel
              position="bottom-left"
              className="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm z-30"
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

      <AddNodePanel
        isOpen={isAddNodePanelOpen}
        onClose={() => setIsAddNodePanelOpen(false)}
        onAddNode={handleAddNode}
      />

      <NodeEditorDrawer
        isOpen={isNodeEditorOpen}
        onClose={handleCloseNodeEditor}
        selectedNode={selectedNodeForEdit}
        onUpdateNode={handleUpdateNode}
      />

      <EdgeEditorDrawer
        isOpen={isEdgeEditorOpen}
        onClose={handleCloseEdgeEditor}
        selectedEdge={selectedEdgeForEdit}
        onUpdateEdge={handleUpdateEdge}
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

// Wrapper component with ReactFlowProvider
function FlowchartBuilderComponent(props: {
  phoneNumber?: string
  initialPathwayId?: string | null
  initialPathwayName?: string | null
  initialData?: any
}) {
  return (
    <ReactFlowProvider>
      <FlowchartBuilderInner {...props} />
    </ReactFlowProvider>
  )
}

// Export as default
export default FlowchartBuilderComponent
