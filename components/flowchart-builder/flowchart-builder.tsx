"use client"

import type React from "react"
import { useCallback, useRef, useState, useEffect } from "react"
import ReactFlow, {
  MiniMap,
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
import { Slider } from "@/components/ui/slider"
import { initialNodes } from "./initial-data"
import {
  Plus,
  Globe,
  Edit2,
  Play,
  Minus,
  Maximize2,
  Lock,
  Unlock,
  List,
  Search,
  Trash2,
  Copy,
  Undo,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Code,
  Save,
  Sparkles,
} from "lucide-react"
import { JsonPreview } from "./json-preview"
import { TestPathwayDialog } from "./test-pathway-dialog"
import { useAuth } from "@/contexts/auth-context"
import { saveFlowchart as saveFlowchartUtil, loadFlowchart } from "@/utils/save-flowchart"
import { useSearchParams } from "next/navigation"
import { convertFlowchartToBlandFormat, normalizeId } from "./deploy-utils"
import { formatPhoneNumber } from "@/utils/phone-utils"

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
  const [isEditingLabel, setIsEditingLabel] = useState(false)
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
          stroke: selected || isHovered ? "#8b5cf6" : style.stroke || "#64748b",
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

      {/* Enhanced Clickable Label with Edit Icon */}
      <foreignObject
        width={160}
        height={44}
        x={labelX - 80}
        y={labelY - 22}
        className="overflow-visible"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div
          style={{
            background: selected || isHovered ? "hsl(262 83% 58% / 0.15)" : "hsl(240 23% 12% / 0.95)",
            padding: "10px 14px",
            borderRadius: "14px",
            fontSize: "12px",
            fontWeight: 500,
            border: selected || isHovered ? "2px solid #8b5cf6" : "1px solid hsl(240 23% 18%)",
            cursor: "pointer",
            boxShadow:
              selected || isHovered
                ? "0 0 0 3px rgba(139, 92, 246, 0.1), 0 8px 25px -5px rgba(0, 0, 0, 0.4)"
                : "0 4px 12px -2px rgba(0, 0, 0, 0.4)",
            minWidth: "120px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
            position: "relative",
            zIndex: 1000,
            transition: "all 0.2s ease-in-out",
            color: "hsl(240 10% 90%)",
            backdropFilter: "blur(8px)",
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleLabelClick}
        >
          <span className="truncate">{label}</span>
          {(isHovered || selected) && (
            <Edit2 className="h-3 w-3 text-purple-400 opacity-80 hover:opacity-100 flex-shrink-0" />
          )}
        </div>
      </foreignObject>

      {/* Delete button */}
      {(selected || isHovered) && (
        <foreignObject
          width={24}
          height={24}
          x={(sourceX + targetX) / 2 - 12}
          y={(sourceY + targetY) / 2 - 32}
          className="overflow-visible"
        >
          <div
            style={{
              background: "#ef4444",
              color: "white",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 12px -2px rgba(239, 68, 68, 0.4)",
              zIndex: 1001,
              transition: "all 0.2s ease-in-out",
            }}
            className="nodrag nopan hover:scale-110"
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

  // Add these new state variables after the existing ones
  const [isLoadingFlowchart, setIsLoadingFlowchart] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)

  // New state for the redesigned interface
  const [isAddNodePanelOpen, setIsAddNodePanelOpen] = useState(false)
  const [lastNodePosition, setLastNodePosition] = useState({ x: 250, y: 100 })

  // Add new state variables after the existing state declarations
  const [showDebugPayload, setShowDebugPayload] = useState(false)
  const [debugPayload, setDebugPayload] = useState<any>(null)

  // Add new state variables for viewport controls
  const [isPanLocked, setIsPanLocked] = useState(false)
  const [showOutlineView, setShowOutlineView] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showNodeSearch, setShowNodeSearch] = useState(false)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])

  // Add new state variables after the existing state declarations
  const [isLeftRailCollapsed, setIsLeftRailCollapsed] = useState(false)
  const [zoomLevel, setZoomLevel] = useState([100])
  const [isGlobalPromptEnabled, setIsGlobalPromptEnabled] = useState(false)
  const [isWebClientEnabled, setIsWebClientEnabled] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [isViewportOutOfCenter, setIsViewportOutOfCenter] = useState(false)

  // Create edge types with click handler
  const edgeTypes = {
    custom: (props: any) => <CustomEdge {...props} onEdgeClick={handleEdgeClick} />,
  }

  // Format phone number for display
  const formattedPhoneNumber = phoneNumber
    ? formatPhoneNumber(phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber}`)
    : ""

  // Initialize pathway name - Fixed to prevent infinite loops
  useEffect(() => {
    if (initialPathwayName && !pathwayName) {
      setPathwayName(initialPathwayName)
    } else if (phoneNumber && !pathwayName) {
      const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber}`
      setPathwayName(`Pathway for ${formattedNumber}`)
      setPathwayDescription(`Call flow for phone number ${formattedNumber}`)
    }

    // Load saved API key only once
    const savedApiKey = localStorage.getItem("bland-api-key")
    if (savedApiKey && !apiKey) {
      setApiKey(savedApiKey)
    }
  }, [initialPathwayName, phoneNumber]) // Removed pathwayName and apiKey from dependencies

  // Load generated flowchart data from URL
  useEffect(() => {
    if (generatedParam && reactFlowInstance && !hasLoadedInitialData) {
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

          setHasLoadedInitialData(true)
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
  }, [generatedParam, reactFlowInstance, hasLoadedInitialData, setNodes, setEdges])

  // Auto-load saved flowchart from database
  useEffect(() => {
    const loadSavedFlowchart = async () => {
      // Only run if we have all required data and haven't loaded yet
      if (!user || !phoneNumber || !reactFlowInstance || hasLoadedInitialData) {
        return
      }

      // Skip if we're loading AI-generated data from URL
      if (generatedParam) {
        console.log("[FLOWCHART] 🤖 Skipping auto-load - AI-generated data present")
        setHasLoadedInitialData(true)
        return
      }

      console.log("[FLOWCHART] 🔄 Auto-loading saved flowchart...")
      console.log("[FLOWCHART] 📞 Phone:", phoneNumber)
      console.log("[FLOWCHART] 👤 User:", user.email)

      setIsLoadingFlowchart(true)
      setLoadError(null)

      try {
        const savedData = await loadFlowchart(phoneNumber, user)

        if (savedData && savedData.data) {
          console.log("[FLOWCHART] ✅ Loaded saved flowchart:", {
            nodes: savedData.data.nodes?.length || 0,
            edges: savedData.data.edges?.length || 0,
            name: savedData.name,
          })

          // Inject the saved data into ReactFlow
          if (savedData.data.nodes && savedData.data.nodes.length > 0) {
            setNodes(savedData.data.nodes)
          }
          if (savedData.data.edges && savedData.data.edges.length > 0) {
            setEdges(savedData.data.edges)
          }

          // Update pathway name and description if available
          if (savedData.name && !pathwayName) {
            setPathwayName(savedData.name)
          }
          if (savedData.description && !pathwayDescription) {
            setPathwayDescription(savedData.description)
          }

          // Fit view to show all loaded nodes
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2 })
          }, 100)

          toast({
            title: "Flowchart loaded",
            description: `Loaded saved flowchart with ${savedData.data.nodes?.length || 0} nodes`,
          })
        } else {
          console.log("[FLOWCHART] ℹ️ No saved flowchart found - using default nodes")
        }
      } catch (error) {
        console.error("[FLOWCHART] ❌ Error loading saved flowchart:", error)
        setLoadError(error instanceof Error ? error.message : "Failed to load flowchart")

        toast({
          title: "Failed to load saved flowchart",
          description: "Using default template. You can still create and save your flowchart.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingFlowchart(false)
        setHasLoadedInitialData(true)
      }
    }

    loadSavedFlowchart()
  }, [user, phoneNumber, reactFlowInstance, hasLoadedInitialData, generatedParam])

  // Update Bland.ai payload preview - Fixed to prevent infinite loops
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      const flow = reactFlowInstance.toObject()
      const startNodeId = nodes.find((node) => node.type === "greetingNode")?.id || nodes[0]?.id || ""

      const blandFormat = convertFlowchartToBlandFormat(flow.nodes, flow.edges, startNodeId)
      blandFormat.name = pathwayName || "Bland.ai Pathway"
      blandFormat.description = pathwayDescription || `Pathway created on ${new Date().toLocaleString()}`

      setBlandPayload(blandFormat)
    }
  }, [nodes, edges, pathwayName, pathwayDescription]) // Removed reactFlowInstance from dependencies

  // Monitor zoom level changes
  useEffect(() => {
    if (reactFlowInstance) {
      const handleZoomChange = () => {
        const zoom = reactFlowInstance.getZoom()
        setZoomLevel([Math.round(zoom * 100)])
      }

      reactFlowInstance.onZoomChange = handleZoomChange
    }
  }, [reactFlowInstance])

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

  const handleShowDebugPayload = () => {
    if (!reactFlowInstance) {
      toast({
        title: "Error",
        description: "Flowchart not ready. Please wait a moment and try again.",
        variant: "destructive",
      })
      return
    }

    if (showDebugPayload) {
      // Hide the debug payload
      setShowDebugPayload(false)
      setDebugPayload(null)
    } else {
      // Generate and show the debug payload
      const flow = reactFlowInstance.toObject()
      const startNodeId = nodes.find((node) => node.type === "greetingNode")?.id || nodes[0]?.id || ""

      const payload = convertFlowchartToBlandFormat(
        flow.nodes,
        flow.edges,
        startNodeId,
        pathwayName,
        pathwayDescription || `Call flow for phone number ${phoneNumber}`,
      )

      setDebugPayload(payload)
      setShowDebugPayload(true)

      toast({
        title: "Debug payload generated",
        description: "Review the payload structure below before updating.",
      })
    }
  }

  const handlePanLockToggle = () => {
    setIsPanLocked(!isPanLocked)
    toast({
      title: isPanLocked ? "Pan unlocked" : "Pan locked",
      description: isPanLocked ? "You can now pan the canvas" : "Canvas panning is locked",
    })
  }

  const handleOutlineToggle = () => {
    setShowOutlineView(!showOutlineView)
    toast({
      title: showOutlineView ? "Outline view hidden" : "Outline view shown",
      description: showOutlineView ? "Switched to canvas view" : "Showing node outline",
    })
  }

  const handleNodeSearch = () => {
    setShowNodeSearch(!showNodeSearch)
  }

  const handleDeleteSelected = () => {
    if (selectedNodeIds.length === 0) {
      toast({
        title: "No nodes selected",
        description: "Select nodes to delete them",
        variant: "destructive",
      })
      return
    }

    setNodes((nds) => nds.filter((node) => !selectedNodeIds.includes(node.id)))
    setEdges((eds) =>
      eds.filter((edge) => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)),
    )
    setSelectedNodeIds([])

    toast({
      title: "Nodes deleted",
      description: `Deleted ${selectedNodeIds.length} node(s)`,
    })
  }

  const handleDuplicateSelected = () => {
    if (selectedNodeIds.length === 0) {
      toast({
        title: "No nodes selected",
        description: "Select nodes to duplicate them",
        variant: "destructive",
      })
      return
    }

    const nodesToDuplicate = nodes.filter((node) => selectedNodeIds.includes(node.id))
    const newNodes = nodesToDuplicate.map((node) => ({
      ...node,
      id: `${node.id}_copy_${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
    }))

    setNodes((nds) => [...nds, ...newNodes])

    toast({
      title: "Nodes duplicated",
      description: `Duplicated ${selectedNodeIds.length} node(s)`,
    })
  }

  const handleUndo = () => {
    toast({
      title: "Undo",
      description: "Undo functionality coming soon...",
    })
  }

  const handleRedo = () => {
    toast({
      title: "Redo",
      description: "Redo functionality coming soon...",
    })
  }

  const handleFitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 })
      setIsViewportOutOfCenter(false)
      toast({
        title: "View fitted",
        description: "Centered and zoomed to fit all nodes",
      })
    }
  }

  const handleZoomChange = (value: number[]) => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomTo(value[0] / 100)
      setZoomLevel(value)
    }
  }

  const handleGlobalPromptToggle = () => {
    setIsGlobalPromptEnabled(!isGlobalPromptEnabled)
    toast({
      title: isGlobalPromptEnabled ? "Global Prompt disabled" : "Global Prompt enabled",
      description: isGlobalPromptEnabled
        ? "Global prompt settings are now disabled"
        : "Global prompt settings are now active",
    })
  }

  const handleWebClientToggle = () => {
    setIsWebClientEnabled(!isWebClientEnabled)
    toast({
      title: isWebClientEnabled ? "Web Client disabled" : "Web Client enabled",
      description: isWebClientEnabled ? "Web client is now disabled" : "Web client is now active",
    })
  }

  // Handle node selection change - Fixed to prevent infinite loops
  const handleSelectionChange = useCallback((params: any) => {
    const nodeIds = params.nodes?.map((node: any) => node.id) || []
    setSelectedNodeIds(nodeIds)
  }, [])

  // ✅ FINAL: Comprehensive payload debugging and validation
  const handleUpdatePathway = async () => {
    if (!reactFlowInstance || !apiKey || !pathwayName || !existingPathwayId) {
      toast({
        title: "Missing required information",
        description: "Please ensure API key, pathway name, and pathway ID are available.",
        variant: "destructive",
      })
      return
    }

    setIsDeploying(true)

    try {
      const flow = reactFlowInstance.toObject()
      const startNodeId = nodes.find((node) => node.type === "greetingNode")?.id || nodes[0]?.id || ""

      const blandApiPayload = convertFlowchartToBlandFormat(
        flow.nodes,
        flow.edges,
        startNodeId,
        pathwayName,
        pathwayDescription || `Call flow for phone number ${phoneNumber}`,
      )

      const requestPayload = {
        apiKey,
        pathwayId: existingPathwayId,
        flowchart: blandApiPayload,
      }

      const response = await fetch("/api/bland-ai/update-pathway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      localStorage.setItem("bland-api-key", apiKey)

      toast({
        title: "✅ Pathway updated successfully",
        description: `Your pathway "${pathwayName}" has been updated on Bland.ai`,
      })

      setDeployDialogOpen(false)
      setDeploymentResult(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      toast({
        title: "Failed to update pathway",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeploying(false)
    }
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

  // Show loading state while auth is loading OR while loading flowchart
  if (authLoading || isLoadingFlowchart) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-300">
            {authLoading ? "Loading flowchart builder..." : "Loading saved flowchart..."}
          </p>
        </div>
      </div>
    )
  }

  // Show auth required state
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Authentication Required</h2>
          <p className="text-slate-300">Please log in to use the flowchart builder.</p>
        </div>
      </div>
    )
  }

  // Show load error if present (non-blocking)
  if (loadError && !authLoading) {
    console.warn("[FLOWCHART] ⚠️ Load error displayed:", loadError)
  }

  return (
    <>
      <div className="h-full w-full overflow-hidden bg-slate-900 relative">
        {/* Enhanced Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left: Friendly Title */}
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {formattedPhoneNumber ? `Pathway for ${formattedPhoneNumber}` : "Flowchart Builder"}
                </h1>
                {pathwayName && pathwayName !== `Pathway for ${formattedPhoneNumber}` && (
                  <p className="text-sm text-slate-400 mt-1">{pathwayName}</p>
                )}
              </div>
            </div>

            {/* Right: Action Buttons - Regrouped */}
            <div className="flex items-center gap-3">
              {/* Persistent State Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveFlowchart}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-md rounded-xl flex items-center gap-2"
                  size="sm"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  onClick={handleDeploy}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-md rounded-xl"
                  size="sm"
                >
                  {existingPathwayId ? "Update" : "Deploy"}
                </Button>
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-slate-600" />

              {/* Utility/Debug Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setTestPathwayOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 shadow-md rounded-xl"
                  size="sm"
                >
                  <Play className="h-4 w-4" />
                  Test
                </Button>
                {blandPayload && (
                  <JsonPreview
                    data={blandPayload}
                    title="Bland.ai Pathway JSON"
                    trigger={
                      <Button
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-xl flex items-center gap-2 bg-transparent"
                        size="sm"
                      >
                        <Code className="h-4 w-4" />
                        JSON
                      </Button>
                    }
                  />
                )}
              </div>

              {/* AI Generator */}
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-xl flex items-center gap-2 bg-transparent"
                size="sm"
                onClick={() => {
                  // Navigate to AI generator
                  window.location.href = `/dashboard/call-flows/generate${
                    phoneNumber ? `?phoneNumber=${phoneNumber}` : ""
                  }`
                }}
              >
                <Sparkles className="h-4 w-4" />
                AI Generator
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Collapsible Left Rail */}
        <div
          className={`absolute left-0 top-20 bottom-0 z-40 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700 transition-all duration-300 ${
            isLeftRailCollapsed ? "w-16" : "w-64"
          }`}
        >
          {/* Rail Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            {!isLeftRailCollapsed && <h3 className="text-sm font-medium text-slate-300">Controls</h3>}
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={() => setIsLeftRailCollapsed(!isLeftRailCollapsed)}
            >
              {isLeftRailCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Rail Content */}
          <div className="p-4 space-y-4">
            {/* Add Node Button */}
            <Button
              onClick={() => setIsAddNodePanelOpen(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center gap-3 justify-start"
              size={isLeftRailCollapsed ? "sm" : "default"}
            >
              <Plus className="h-5 w-5 flex-shrink-0" />
              {!isLeftRailCollapsed && <span>Add Node</span>}
            </Button>

            {/* Toggle Controls */}
            <div className="space-y-2">
              <Button
                onClick={handleGlobalPromptToggle}
                variant="outline"
                className={`w-full rounded-xl flex items-center gap-3 justify-start border-slate-600 hover:bg-slate-700 transition-all ${
                  isGlobalPromptEnabled ? "bg-slate-700 text-purple-400 border-purple-500" : "text-slate-300"
                }`}
                size={isLeftRailCollapsed ? "sm" : "default"}
                title={isLeftRailCollapsed ? "Global Prompt" : undefined}
              >
                <Globe className="h-4 w-4 flex-shrink-0" />
                {!isLeftRailCollapsed && <span>Global Prompt</span>}
                {!isLeftRailCollapsed && isGlobalPromptEnabled && (
                  <div className="ml-auto w-2 h-2 bg-purple-400 rounded-full" />
                )}
              </Button>

              <Button
                onClick={handleWebClientToggle}
                variant="outline"
                className={`w-full rounded-xl flex items-center gap-3 justify-start border-slate-600 hover:bg-slate-700 transition-all ${
                  isWebClientEnabled ? "bg-slate-700 text-purple-400 border-purple-500" : "text-slate-300"
                }`}
                size={isLeftRailCollapsed ? "sm" : "default"}
                title={isLeftRailCollapsed ? "Web Client" : undefined}
              >
                <Monitor className="h-4 w-4 flex-shrink-0" />
                {!isLeftRailCollapsed && <span>Web Client</span>}
                {!isLeftRailCollapsed && isWebClientEnabled && (
                  <div className="ml-auto w-2 h-2 bg-purple-400 rounded-full" />
                )}
              </Button>
            </div>

            {/* Separator */}
            <div className="border-t border-slate-700 pt-4">
              {!isLeftRailCollapsed && <p className="text-xs text-slate-500 mb-3">Canvas Controls</p>}

              {/* Canvas Control Grid */}
              <div className={`grid gap-2 ${isLeftRailCollapsed ? "grid-cols-1" : "grid-cols-2"}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg ${
                    isPanLocked ? "bg-slate-700 text-purple-400" : ""
                  }`}
                  onClick={handlePanLockToggle}
                  title={isPanLocked ? "Unlock Panning" : "Lock Panning"}
                >
                  {isPanLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className={`text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg ${
                    showOutlineView ? "bg-slate-700 text-purple-400" : ""
                  }`}
                  onClick={handleOutlineToggle}
                  title="Toggle Outline View"
                >
                  <List className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className={`text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg ${
                    showNodeSearch ? "bg-slate-700 text-purple-400" : ""
                  }`}
                  onClick={handleNodeSearch}
                  title="Search Nodes"
                >
                  <Search className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-300 hover:bg-red-600 hover:text-white rounded-lg"
                  onClick={handleDeleteSelected}
                  disabled={selectedNodeIds.length === 0}
                  title="Delete Selected"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg"
                  onClick={handleDuplicateSelected}
                  disabled={selectedNodeIds.length === 0}
                  title="Duplicate Selected"
                >
                  <Copy className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg"
                  onClick={handleUndo}
                  title="Undo"
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Zoom Control */}
            {!isLeftRailCollapsed && (
              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs text-slate-500 mb-3">Zoom: {zoomLevel[0]}%</p>
                <Slider
                  value={zoomLevel}
                  onValueChange={handleZoomChange}
                  max={200}
                  min={25}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg"
                    onClick={() => handleZoomChange([50])}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg ${
                      isViewportOutOfCenter ? "bg-purple-600 text-white" : ""
                    }`}
                    onClick={handleFitView}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg"
                    onClick={() => handleZoomChange([150])}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Screen ReactFlow Canvas */}
        <div
          className={`w-full h-full transition-all duration-300 ${isLeftRailCollapsed ? "pl-16" : "pl-64"} pt-20`}
          ref={reactFlowWrapper}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onNodeClick={handleNodeClick}
            onSelectionChange={handleSelectionChange}
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
            panOnDrag={!isPanLocked}
            snapToGrid={true}
            snapGrid={[20, 20]}
          >
            {/* Enhanced MiniMap */}
            {showMiniMap && (
              <MiniMap
                className="bg-slate-800/90 border border-slate-700 shadow-xl rounded-xl overflow-hidden backdrop-blur-sm"
                nodeColor="#8b5cf6"
                maskColor="rgba(0, 0, 0, 0.4)"
                pannable
                zoomable
                onClick={() => setShowMiniMap(false)}
              />
            )}

            {/* Enhanced Background with Ruler Grid */}
            <Background variant="dots" gap={20} size={1.5} color="#475569" />

            {/* Debug info panel - Enhanced */}
            <Panel
              position="bottom-left"
              className="flex flex-col gap-2 p-4 bg-slate-800/90 border border-slate-700 rounded-xl shadow-sm backdrop-blur-sm"
            >
              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Nodes:</span>
                  <span className="text-white">{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Edges:</span>
                  <span className="text-white">{edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Selected:</span>
                  <span className="text-white">{selectedNodeIds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Zoom:</span>
                  <span className="text-white">{zoomLevel[0]}%</span>
                </div>
                <div className="text-xs font-medium mt-2 text-purple-400">
                  {existingPathwayId ? "🔄 Will Update" : "🆕 Will Create New"}
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Enhanced Node Search Overlay */}
      {showNodeSearch && (
        <div className="absolute top-24 left-4 z-50 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl p-4 shadow-xl w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">Search Nodes</h3>
            <Button
              size="sm"
              variant="ghost"
              className="w-6 h-6 p-0 text-slate-400 hover:text-white"
              onClick={() => setShowNodeSearch(false)}
            >
              ✕
            </Button>
          </div>
          <Input
            placeholder="Search by node name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3 bg-slate-700 border-slate-600 text-white"
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {nodes
              .filter(
                (node) =>
                  node.data?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  node.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  node.data?.text?.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                  onClick={() => {
                    if (reactFlowInstance) {
                      reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.5 })
                      setSelectedNodeIds([node.id])
                      setShowNodeSearch(false)
                    }
                  }}
                >
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">
                      {node.data?.name || node.data?.text?.substring(0, 30) || node.id}
                    </div>
                    <div className="text-xs text-slate-400">{node.type}</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {Math.round(node.position.x)}, {Math.round(node.position.y)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Enhanced Outline View Overlay */}
      {showOutlineView && (
        <div className="absolute top-24 right-4 z-50 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl p-4 shadow-xl w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">Node Outline</h3>
            <Button
              size="sm"
              variant="ghost"
              className="w-6 h-6 p-0 text-slate-400 hover:text-white"
              onClick={() => setShowOutlineView(false)}
            >
              ✕
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  selectedNodeIds.includes(node.id)
                    ? "border-purple-500 bg-purple-500/10 shadow-purple-500/20"
                    : "border-slate-600 hover:border-slate-500 hover:bg-slate-700"
                }`}
                onClick={() => {
                  if (reactFlowInstance) {
                    reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.5 })
                    setSelectedNodeIds([node.id])
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm font-medium text-white truncate">
                    {node.data?.name || node.data?.text?.substring(0, 25) || node.id}
                  </div>
                  <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300 flex-shrink-0">
                    {node.type}
                  </span>
                </div>
                {node.data?.text && (
                  <div className="text-xs text-slate-400 truncate">{node.data.text.substring(0, 60)}...</div>
                )}
                <div className="text-xs text-slate-500 mt-1">
                  Position: {Math.round(node.position.x)}, {Math.round(node.position.y)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {existingPathwayId ? "Update Pathway" : "Deploy to Bland.ai"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {existingPathwayId
                ? `Update your existing pathway (${existingPathwayId}) with the current flowchart.`
                : "Enter your Bland.ai API key and pathway details to deploy your flowchart."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right text-slate-300">
                API Key
              </Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="org_..."
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pathwayName" className="text-right text-slate-300">
                Pathway Name
              </Label>
              <Input
                id="pathwayName"
                value={pathwayName}
                onChange={(e) => setPathwayName(e.target.value)}
                placeholder="My Pathway"
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pathwayDescription" className="text-right text-slate-300">
                Description
              </Label>
              <Input
                id="pathwayDescription"
                value={pathwayDescription}
                onChange={(e) => setPathwayDescription(e.target.value)}
                placeholder="A description of your pathway"
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Debug Payload Section */}
            <div className="col-span-4 border-t border-slate-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-slate-300">Debug Payload Preview</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleShowDebugPayload}
                  className="text-xs bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {showDebugPayload ? "Hide Debug Payload" : "Show Debug Payload"}
                </Button>
              </div>

              {showDebugPayload && debugPayload && (
                <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 max-h-96 overflow-auto">
                  <div className="text-xs text-slate-400 mb-2 font-medium">
                    Final payload that will be sent to Bland.ai:
                  </div>
                  <pre className="text-xs bg-slate-800 border border-slate-600 rounded p-3 overflow-auto whitespace-pre-wrap text-slate-300">
                    {JSON.stringify(debugPayload, null, 2)}
                  </pre>
                  <div className="text-xs text-slate-500 mt-2">
                    Nodes: {debugPayload?.nodes?.length || 0} | Edges: {debugPayload?.edges?.length || 0}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeployDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePathway}
              disabled={!apiKey || !pathwayName || isDeploying}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isDeploying ? "Updating..." : existingPathwayId ? "Update Pathway" : "Deploy Pathway"}
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
