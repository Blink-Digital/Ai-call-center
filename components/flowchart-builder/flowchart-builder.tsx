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
import { Textarea } from "@/components/ui/textarea"
import { initialNodes } from "./initial-data"
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Copy, Play, Phone } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { JsonPreview } from "./json-preview"
import { ImportJsonDialog } from "./import-json-dialog"
import { convertBlandFormatToFlowchart } from "./convert-bland-to-flowchart"
import { preparePathwayForDeployment } from "./deploy-utils"
import { ValidationDialog } from "./validation-dialog"
import { TestPathwayDialog } from "./test-pathway-dialog"
import { getVariableTypeByName, getVariableDescription } from "@/config/flowchart-defaults"
import { SendTestCallDialog } from "./send-test-call-dialog"
import { DialogFooter } from "@/components/ui/dialog"
import { lookupPathwayIdClientSide } from "@/lib/client-pathway-lookup"

const initialEdges: Edge[] = []

// Helper function to normalize IDs
function normalizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_")
}

// [Previous helper functions remain the same - keeping them for brevity]
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

// Helper function to extract variables from customer response nodes
function extractVariablesFromCustomerResponseNodes(nodes: any[], edges: any[]) {
  const extractVars: any[] = []
  const customerResponseNodes = nodes.filter((node: any) => node.type === "customerResponseNode")

  customerResponseNodes.forEach((node: any) => {
    // If the node has a specific variable name in its data, use it
    if (node.data.variableName) {
      extractVars.push([
        node.data.variableName,
        node.data.variableType || getVariableTypeByName(node.data.variableName),
        node.data.variableDescription || getVariableDescription(node.data.variableName),
        false,
      ])
    } else if (node.data.options && node.data.options.length > 0) {
      // Otherwise use the first option as the variable name
      const variableName = node.data.options[0]
      extractVars.push([variableName, getVariableTypeByName(variableName), getVariableDescription(variableName), false])
    }
  })

  return extractVars
}

// FIXED: Update the convertFlowchartToBlandFormat function to put isStart inside data object
function convertFlowchartToBlandFormat(flowchart: any) {
  console.log("Converting flowchart to Bland format:", flowchart) // Debug log

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
          // CRITICAL FIX: Initialize isStart as false inside data object
          isStart: false,
        },
      }

      // Ensure required fields based on node type
      if (blandNode.type === "Default" && !blandNode.data.text) {
        blandNode.data.text = "Default response"
      }

      if (blandNode.type === "End Call" && !blandNode.data.prompt) {
        blandNode.data.prompt = blandNode.data.text || "Thank you for calling. Goodbye!"
      }

      return blandNode
    })

  // CRITICAL: Apply start node selection logic with isStart INSIDE data object
  let startNodeSelected = false
  let startNodeId = null

  // Priority 1: Look for a node with type "greetingNode" in the original flowchart
  for (let i = 0; i < flowchart.nodes.length; i++) {
    const originalNode = flowchart.nodes[i]
    if (originalNode.type === "greetingNode") {
      const correspondingBlandNode = blandNodes.find((bn) => bn.id === originalNode.id)
      if (correspondingBlandNode) {
        // FIXED: Set isStart inside data object
        correspondingBlandNode.data.isStart = true
        startNodeSelected = true
        startNodeId = correspondingBlandNode.id
        console.log(`[START NODE] Priority 1: Selected greetingNode as start: ${startNodeId}`)
        break
      }
    }
  }

  // Priority 2: If no greetingNode found, look for node with label "Start" or name "Start"
  if (!startNodeSelected) {
    for (let i = 0; i < flowchart.nodes.length; i++) {
      const originalNode = flowchart.nodes[i]
      if (originalNode.data?.label === "Start" || originalNode.data?.name === "Start") {
        const correspondingBlandNode = blandNodes.find((bn) => bn.id === originalNode.id)
        if (correspondingBlandNode) {
          // FIXED: Set isStart inside data object
          correspondingBlandNode.data.isStart = true
          startNodeSelected = true
          startNodeId = correspondingBlandNode.id
          console.log(`[START NODE] Priority 2: Selected node with Start label/name as start: ${startNodeId}`)
          break
        }
      }
    }
  }

  // Priority 3: Fallback to the first node in the array
  if (!startNodeSelected && blandNodes.length > 0) {
    // FIXED: Set isStart inside data object
    blandNodes[0].data.isStart = true
    startNodeSelected = true
    startNodeId = blandNodes[0].id
    console.log(`[START NODE] Priority 3: Fallback to first node as start: ${startNodeId}`)
  }

  // SAFETY CHECK: Ensure all other nodes explicitly have isStart: false inside data
  blandNodes.forEach((node, index) => {
    if (node.id !== startNodeId) {
      node.data.isStart = false
    }
  })

  // FINAL ENFORCEMENT: Ensure exactly one node has isStart: true inside data object
  let startNodeAssigned = false
  blandNodes.forEach((node) => {
    if (node.type === "Default" && !startNodeAssigned) {
      node.data.isStart = true
      startNodeAssigned = true
    } else {
      node.data.isStart = false
    }
  })

  // If no Default node was found to assign as start, create one
  if (!startNodeAssigned && blandNodes.length > 0) {
    // Find the first Default node if any exists
    const firstDefaultNode = blandNodes.find((node) => node.type === "Default")

    if (firstDefaultNode) {
      firstDefaultNode.data.isStart = true
      console.warn("[FIXED] Assigned first Default node as start:", firstDefaultNode.id)
    } else {
      // No Default node exists, create one
      const newDefaultNode = {
        id: `default_node_${Date.now()}`,
        type: "Default",
        data: {
          name: "Start",
          text: "Hello! This is the start of your conversation.",
          isStart: true, // FIXED: isStart inside data object
          modelOptions: { modelType: "smart", temperature: 0.2 },
        },
      }
      blandNodes.unshift(newDefaultNode) // Add to beginning of array
      console.warn("[FIXED] Created new Default node as start:", newDefaultNode.id)
    }
  }

  // Final validation check - look for isStart inside data objects
  console.log(
    "[VALIDATION] Final nodes with data.isStart === true:",
    blandNodes.filter((n) => n.data && n.data.isStart === true),
  )

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

  console.log("Converted Bland format:", result) // Debug log
  return result
}

// Helper function to find the start node ID
function findStartNodeId(nodes: any[], edges: any[]): string | null {
  // Filter out invalid nodes
  const validNodes = nodes.filter((node) => node && node.id && typeof node.id === "string")

  if (validNodes.length === 0) {
    console.warn("No valid nodes found")
    return null
  }

  // First, look for a greeting node
  const greetingNode = validNodes.find((node) => node.type === "greetingNode")
  if (greetingNode) return greetingNode.id

  // If no greeting node, find nodes with no incoming edges
  const validEdges = edges.filter((edge) => edge && edge.target && typeof edge.target === "string")
  const nodesWithIncomingEdges = new Set(validEdges.map((edge) => edge.target))
  const startNodes = validNodes.filter((node) => !nodesWithIncomingEdges.has(node.id))

  if (startNodes.length > 0) {
    return startNodes[0].id
  }

  // Enhanced fallback: if still no start node found, prefer greeting nodes, then any node
  if (validNodes.length > 0) {
    const greetingNodes = validNodes.filter((node) => node.type === "greetingNode")
    if (greetingNodes.length > 0) {
      return greetingNodes[0].id
    }
    return validNodes[0].id
  }

  // If all else fails, return the first node
  return validNodes.length > 0 ? validNodes[0].id : null
}

// Updated mapper function with correct Bland.ai node types
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

// Update the CustomEdge component to better handle edge labels

// Custom edge component to display labels and deletion controls
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
  const edgeRef = useRef<SVGPathElement>(null)
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
        ref={edgeRef}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = `translate(-50%, -50%) translate(${deleteButtonX}px, ${deleteButtonY}px) scale(1.1)`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = `translate(-50%, -50%) translate(${deleteButtonX}px, ${deleteButtonY}px)`
          }}
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

// Update the FlowchartBuilder component to accept initialData
export function FlowchartBuilder({ phoneNumber, initialData }: { phoneNumber?: string; initialData?: any }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || initialEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  // [Keep all state variables the same for brevity]
  const [deployDialogOpen, setDeployDialogOpen] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [pathwayName, setPathwayName] = useState("")
  const [pathwayDescription, setPathwayDescription] = useState("")
  const [isDeploying, setIsDeploying] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")
  const [connectionMessage, setConnectionMessage] = useState("")
  const [deploymentResult, setDeploymentResult] = useState<any>(null)
  const [deploymentError, setDeploymentError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [apiPayload, setApiPayload] = useState<any>(null)
  const [blandPayload, setBlandPayload] = useState<any>(null)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [testPathwayOpen, setTestPathwayOpen] = useState(false)
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null)
  const [sendTestCallOpen, setSendTestCallOpen] = useState(false)
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState<any>(null)
  const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false)
  const [existingPathwayId, setExistingPathwayId] = useState<string | null>(null)
  const [isLoadingPathway, setIsLoadingPathway] = useState(false)

  // Load saved flowchart on component mount
  useEffect(() => {
    try {
      if (initialData) {
        if (initialData.name) setPathwayName(initialData.name)
        if (initialData.description) setPathwayDescription(initialData.description)
        return
      }

      const storageKey = phoneNumber ? `bland-flowchart-${phoneNumber}` : "bland-flowchart"

      if (phoneNumber) {
        const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber}`
        setPathwayName(`Pathway for ${formattedNumber}`)
        setPathwayDescription(`Call flow for phone number ${formattedNumber}`)
      }

      const savedFlow = localStorage.getItem(storageKey)
      if (savedFlow) {
        const flow = JSON.parse(savedFlow)
        if (flow.nodes && flow.edges) {
          setNodes(flow.nodes)
          setEdges(flow.edges)

          if (flow.name) setPathwayName(flow.name)
          if (flow.description) setPathwayDescription(flow.description)

          toast({
            title: "Flowchart loaded",
            description: "Your saved flowchart has been loaded successfully.",
          })
        }
      }

      const savedApiKey = localStorage.getItem("bland-api-key")
      if (savedApiKey) {
        setApiKey(savedApiKey)
      }
    } catch (error) {
      console.error("Error loading flowchart:", error)
    }
  }, [setNodes, setEdges, phoneNumber, initialData])

  // Update Bland.ai payload preview whenever nodes or edges change
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

  // Effect to handle node highlighting during testing
  useEffect(() => {
    if (!reactFlowInstance) return

    const updatedNodes = nodes.map((node) => ({
      ...node,
      style: {
        ...node.style,
        boxShadow: node.id === highlightedNodeId ? "0 0 0 2px #3b82f6" : undefined,
        borderColor: node.id === highlightedNodeId ? "#3b82f6" : undefined,
        borderWidth: node.id === highlightedNodeId ? "2px" : undefined,
      },
    }))

    const hasStyleChanges = updatedNodes.some((updatedNode, index) => {
      const currentNode = nodes[index]
      return JSON.stringify(updatedNode.style) !== JSON.stringify(currentNode.style)
    })

    if (hasStyleChanges) {
      setNodes(updatedNodes)

      if (highlightedNodeId) {
        const node = updatedNodes.find((n) => n.id === highlightedNodeId)
        if (node) {
          reactFlowInstance.setCenter(node.position.x, node.position.y, { duration: 800 })
        }
      }
    }
  }, [highlightedNodeId, reactFlowInstance, nodes, setNodes])

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
            console.log(`Created edge with label: User responded ${responseText} from customer response node`)
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
        case "transferNode":
          nodeData = {
            text: "Transferring your call now...",
            transferNumber: "+18445940353",
            transferType: "warm",
            webhookUrl: "https://example.com/webhook",
            webhookMethod: "POST",
            webhookBody: JSON.stringify(
              {
                campaignId: "{{campaign_id}}",
                callId: "{{call_id}}",
                customerPhone: "{{customer_phone}}",
              },
              null,
              2,
            ),
          }
          break
        case "webhookNode":
          nodeData = {
            text: "Send data to external API",
            url: "https://example.com/webhook",
            method: "POST",
            body: JSON.stringify(
              {
                event: "call_progress",
                data: {},
              },
              null,
              2,
            ),
            extractVars: [
              ["response", "string", "The response from the webhook"],
              ["status", "number", "The HTTP status code"],
            ],
          }
          break
        case "conditionalNode":
          nodeData = {
            conditions: [
              { id: normalizeId("cond_1"), text: "Yes" },
              { id: normalizeId("cond_2"), text: "No" },
              { id: normalizeId("cond_3"), text: "Maybe" },
            ],
          }
          break
        case "facebookLeadNode":
          nodeData = {
            text: "Track Facebook conversion",
            pixelId: "",
            eventName: "Lead",
            description: "Track Facebook conversion",
          }
          break
        case "googleLeadNode":
          nodeData = {
            text: "Track Google conversion",
            trackingId: "",
            conversionId: "",
            description: "Track Google conversion",
          }
          break
        case "zapierNode":
          nodeData = {
            text: "Send data to Zapier",
            webhookUrl: "",
            description: "Send data to Zapier",
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

  const saveFlowchart = () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject()
      flow.name = pathwayName || "Bland.ai Pathway"
      flow.description = pathwayDescription || `Pathway created on ${new Date().toLocaleString()}`

      const storageKey = phoneNumber ? `bland-flowchart-${phoneNumber}` : "bland-flowchart"
      localStorage.setItem(storageKey, JSON.stringify(flow))
      localStorage.setItem("flowchartData", JSON.stringify(flow))

      toast({
        title: "Flowchart saved",
        description: "Your flowchart has been saved successfully.",
      })
    } else {
      toast({
        title: "Error saving flowchart",
        description: "There was an error saving your flowchart. Please try again.",
        variant: "destructive",
      })
    }
  }

  const testConnection = async () => {
    if (!apiKey) {
      toast({
        title: "Missing API key",
        description: "Please provide your Bland.ai API key.",
        variant: "destructive",
      })
      return
    }

    setIsTesting(true)
    setConnectionStatus("idle")
    setConnectionMessage("")
    setDebugInfo(null)

    try {
      const response = await fetch("/api/bland-ai/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
        }),
      })

      const data = await response.json()
      setDebugInfo(data)

      if (response.ok && data.status === "success") {
        setConnectionStatus("success")
        setConnectionMessage("Successfully connected to Bland.ai API")
        localStorage.setItem("bland-api-key", apiKey)

        toast({
          title: "Connection successful",
          description: "Successfully connected to Bland.ai API.",
        })
      } else {
        setConnectionStatus("error")
        setConnectionMessage(data.message || "Failed to connect to Bland.ai API")

        toast({
          title: "Connection failed",
          description: data.message || "Failed to connect to Bland.ai API",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error testing connection:", error)
      setConnectionStatus("error")
      setConnectionMessage(error instanceof Error ? error.message : "Unknown error occurred")

      toast({
        title: "Connection error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleDeploy = async () => {
    console.log("[DEBUG] Deploy button clicked!") // Add this line
    console.log("[DEBUG] reactFlowInstance:", reactFlowInstance) // Add this line
    console.log("[DEBUG] pathwayName:", pathwayName) // Add this line

    if (!reactFlowInstance) {
      console.log("[DEBUG] No reactFlowInstance - showing error") // Add this line
      toast({
        title: "Error",
        description: "Flowchart not ready. Please wait a moment and try again.",
        variant: "destructive",
      })
      return
    }

    if (!pathwayName.trim()) {
      console.log("[DEBUG] No pathway name - showing error") // Add this line
      toast({
        title: "Missing pathway name",
        description: "Please provide a name for your pathway.",
        variant: "destructive",
      })
      return
    }

    console.log("[DEBUG] Opening deployment dialog") // Add this line
    // Open the deployment dialog instead
    setDeployDialogOpen(true)
  }

  // 🔥 FIXED: Secure API route to fetch existing pathway with proper credentials
  const fetchExistingPathway = async () => {
    if (!phoneNumber) {
      console.log("[FLOWCHART-BUILDER] ❌ No phone number provided")
      return
    }

    console.log("[FLOWCHART-BUILDER] 🚀 Starting secure fetchExistingPathway...")
    console.log("[FLOWCHART-BUILDER] Input phone number:", phoneNumber)

    setIsLoadingPathway(true)

    try {
      // First try the API route approach
      const response = await fetch(`/api/pathway-id?phone=${encodeURIComponent(phoneNumber)}`, {
        method: "GET",
        credentials: "include", // 👈 CRITICAL: Include auth cookies
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("[FLOWCHART-BUILDER] 📡 Response status:", response.status)

      // If API route fails with auth error, try client-side fallback
      if (response.status === 401) {
        console.log("[FLOWCHART-BUILDER] ⚠️ API route auth failed, trying client-side fallback...")
        const clientResult = await lookupPathwayIdClientSide(phoneNumber)

        if (clientResult.pathway_id) {
          console.log("[FLOWCHART-BUILDER] 🎯 CLIENT FALLBACK: Found pathway:", clientResult.pathway_id)
          setExistingPathwayId(clientResult.pathway_id)

          if (clientResult.pathway_name) {
            setPathwayName(clientResult.pathway_name)
          }

          if (clientResult.pathway_description) {
            setPathwayDescription(clientResult.pathway_description)
          }

          toast({
            title: "✅ Existing pathway found",
            description: `Loaded pathway: ${clientResult.pathway_name || clientResult.pathway_id}`,
          })

          return
        } else {
          console.log("[FLOWCHART-BUILDER] ❌ CLIENT FALLBACK: No pathway found")
        }
      }

      // Continue with normal API response handling
      if (!response.ok) {
        const errorData = await response.json()
        console.error("[FLOWCHART-BUILDER] ❌ API error:", errorData.error)
        toast({
          title: "Error loading pathway",
          description: errorData.error || "Failed to fetch pathway information.",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      console.log("[FLOWCHART-BUILDER] 📊 API response:", data)

      if (data.pathway_id) {
        console.log("[FLOWCHART-BUILDER] 🎯 EXISTING PATHWAY FOUND:", data.pathway_id)
        setExistingPathwayId(data.pathway_id)

        if (data.pathway_name) {
          console.log("[FLOWCHART-BUILDER] 📝 Setting pathway name:", data.pathway_name)
          setPathwayName(data.pathway_name)
        }

        if (data.pathway_description) {
          console.log("[FLOWCHART-BUILDER] 📝 Setting pathway description:", data.pathway_description)
          setPathwayDescription(data.pathway_description)
        }

        toast({
          title: "✅ Existing pathway found",
          description: `Loaded pathway: ${data.pathway_name || data.pathway_id}`,
        })
      } else {
        console.log("[FLOWCHART-BUILDER] ❌ No existing pathway found for this phone number")
      }
    } catch (error) {
      console.error("[FLOWCHART-BUILDER] ❌ Unexpected error in fetchExistingPathway:", error)

      // Try client-side fallback on any error
      console.log("[FLOWCHART-BUILDER] ⚠️ API error, trying client-side fallback...")
      try {
        const clientResult = await lookupPathwayIdClientSide(phoneNumber)

        if (clientResult.pathway_id) {
          console.log("[FLOWCHART-BUILDER] 🎯 CLIENT FALLBACK: Found pathway:", clientResult.pathway_id)
          setExistingPathwayId(clientResult.pathway_id)

          if (clientResult.pathway_name) {
            setPathwayName(clientResult.pathway_name)
          }

          if (clientResult.pathway_description) {
            setPathwayDescription(clientResult.pathway_description)
          }

          toast({
            title: "✅ Existing pathway found",
            description: `Loaded pathway: ${clientResult.pathway_name || clientResult.pathway_id}`,
          })

          return
        }
      } catch (fallbackError) {
        console.error("[FLOWCHART-BUILDER] ❌ Client fallback also failed:", fallbackError)
      }

      toast({
        title: "Error loading pathway",
        description: "Please refresh the page and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPathway(false)
      console.log("[FLOWCHART-BUILDER] 🏁 fetchExistingPathway completed")
    }
  }

  useEffect(() => {
    if (phoneNumber) {
      // Add a small delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        fetchExistingPathway()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [phoneNumber])

  // 🔍 DEBUG: Monitor existingPathwayId state changes
  useEffect(() => {
    console.log("[FLOWCHART-BUILDER] 🔄 existingPathwayId state changed:", existingPathwayId)
  }, [existingPathwayId])

  // 🔍 DEBUG: Monitor phoneNumber changes
  useEffect(() => {
    console.log("[FLOWCHART-BUILDER] 📞 phoneNumber prop changed:", phoneNumber)
  }, [phoneNumber])

  const savePathwayToDatabase = async (pathwayId: string) => {
    if (!phoneNumber) return false

    try {
      const response = await fetch(`/api/phone-numbers/${encodeURIComponent(phoneNumber)}/pathway`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pathwayId,
          pathwayName,
          pathwayDescription,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setExistingPathwayId(pathwayId)
        console.log("[PATHWAY-SAVE] ✅ Successfully saved pathway")
        toast({
          title: "Pathway linked successfully",
          description: "Phone number is now linked to this pathway",
        })
        return true
      } else {
        console.error("[PATHWAY-SAVE] ❌ Failed to save pathway:", result.error)
        return false
      }
    } catch (error) {
      console.error("Error saving pathway to database:", error)
      return false
    }
  }

  const handleActualDeploy = async () => {
    console.log("[DEBUG] handleActualDeploy called") // Add this line
    console.log("[DEBUG] apiKey:", apiKey ? "Set" : "Missing") // Add this line
    console.log("[DEBUG] pathwayName:", pathwayName) // Add this line

    if (!apiKey || !pathwayName) {
      console.log("[DEBUG] Missing API key or pathway name") // Add this line
      toast({
        title: "Missing information",
        description: "Please provide your API key and pathway name.",
        variant: "destructive",
      })
      return
    }

    const flow = reactFlowInstance.toObject()
    flow.name = pathwayName
    flow.description = pathwayDescription || `Pathway created on ${new Date().toLocaleString()}`

    console.log("Preparing pathway for deployment:", flow) // Debug log

    const result = preparePathwayForDeployment(flow)
    setValidationResult(result.validationResult)
    setShowValidationDialog(true)
    setDeployDialogOpen(false) // Close the main dialog
  }

  const handleDeployAfterValidation = async () => {
    console.log("Starting deployment after validation...")
    console.log("Existing pathway ID:", existingPathwayId)
    console.log("Phone number:", phoneNumber)

    setIsDeploying(true)
    setDeploymentResult(null)
    setDeploymentError(null)
    setDebugInfo(null)

    try {
      setShowValidationDialog(false)

      const flow = reactFlowInstance.toObject()
      flow.name = pathwayName
      flow.description = pathwayDescription || `Pathway created on ${new Date().toLocaleString()}`

      const blandFormat = convertFlowchartToBlandFormat(flow)

      // Process edges for Bland.ai format
      if (blandFormat.edges && Array.isArray(blandFormat.edges)) {
        blandFormat.edges = blandFormat.edges.map((edge: any) => {
          const newEdge: any = {
            id: edge.id,
            source: edge.source,
            target: edge.target,
          }

          if (edge.data && edge.data.label) {
            newEdge.label = edge.data.label
          } else if (edge.label) {
            newEdge.label = edge.label
          } else {
            const sourceNode = reactFlowInstance.getNodes().find((n: any) => n.id === edge.source)
            if (
              sourceNode &&
              sourceNode.type === "customerResponseNode" &&
              edge.sourceHandle?.startsWith("response-")
            ) {
              const responseIndex = Number.parseInt(edge.sourceHandle.split("-")[1], 10)
              const options = sourceNode.data?.options || sourceNode.data?.responses || []
              if (options.length > responseIndex) {
                newEdge.label = options[responseIndex]
              } else {
                newEdge.label = "next"
              }
            } else {
              newEdge.label = "next"
            }
          }

          delete newEdge.type
          delete newEdge.data
          return newEdge
        })
      }

      setApiPayload(blandFormat)

      // Ensure we have a start node
      if (!blandFormat.nodes.some((node) => node.data && node.data.isStart === true)) {
        const firstDefaultNode = blandFormat.nodes.find((node) => node.type === "Default")
        if (firstDefaultNode) {
          firstDefaultNode.data.isStart = true
        } else if (blandFormat.nodes.length > 0) {
          if (!blandFormat.nodes[0].data) blandFormat.nodes[0].data = {}
          blandFormat.nodes[0].data.isStart = true
        } else {
          throw new Error("No nodes found in pathway. Cannot deploy empty pathway.")
        }
      }

      // CRITICAL FIX: Proper pathway ID logic
      let pathwayId = existingPathwayId
      let isFirstTimeDeployment = false

      // Check if we have an existing pathway ID
      if (!pathwayId) {
        // FIRST TIME DEPLOYMENT - Create new pathway
        console.log("[DEPLOYMENT] 🆕 No existing pathway ID - creating new pathway")
        isFirstTimeDeployment = true

        const createResponse = await fetch("/api/bland-ai/create-pathway", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey,
            name: pathwayName,
            description: pathwayDescription || `Pathway created on ${new Date().toLocaleString()}`,
          }),
        })

        const createData = await createResponse.json()
        setDebugInfo((prev: any) => ({ ...prev, createResponse: createData }))

        if (!createResponse.ok) {
          throw new Error(createData.message || "Failed to create pathway")
        }

        pathwayId = createData.data?.data?.pathway_id

        if (!pathwayId) {
          throw new Error("No pathway ID returned from create API: " + JSON.stringify(createData))
        }

        console.log("[DEPLOYMENT] ✅ New pathway created with ID:", pathwayId)

        // Save the new pathway_id to our database
        if (phoneNumber) {
          const saveSuccess = await savePathwayToDatabase(pathwayId)
          if (saveSuccess) {
            setExistingPathwayId(pathwayId) // Update state immediately
            console.log("[DEPLOYMENT] 🔗 Pathway linked to phone number in database")
          }
        }
      } else {
        // EXISTING PATHWAY - Update existing pathway
        console.log("[DEPLOYMENT] 🔄 Existing pathway ID found - updating pathway:", pathwayId)
        isFirstTimeDeployment = false
      }

      // Now update the pathway with flowchart data (for both new and existing pathways)
      console.log("[DEPLOYMENT] 📤 Sending flowchart data to pathway:", pathwayId)

      const updateResponse = await fetch("/api/bland-ai/update-pathway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
          pathwayId,
          flowchart: blandFormat,
        }),
      })

      const rawUpdateResponse = await updateResponse.text()
      let updateData

      try {
        updateData = JSON.parse(rawUpdateResponse)
      } catch (e) {
        console.error("Failed to parse update response as JSON:", rawUpdateResponse)
        throw new Error(`Invalid response from API: ${rawUpdateResponse.substring(0, 200)}...`)
      }

      setDebugInfo((prev: any) => ({
        ...prev,
        updateResponse: updateData,
        rawUpdateResponse:
          rawUpdateResponse.length > 1000 ? rawUpdateResponse.substring(0, 1000) + "..." : rawUpdateResponse,
      }))

      if (!updateResponse.ok) {
        if (updateData.validationErrors) {
          const errorMessage = "Validation errors: " + updateData.validationErrors.join(", ")
          throw new Error(errorMessage)
        } else if (updateData.responseData) {
          const apiErrorMessage = updateData.responseData.message || updateData.message || "Unknown API error"
          throw new Error(`API Error: ${apiErrorMessage}`)
        } else {
          throw new Error(updateData.message || "Failed to update pathway")
        }
      }

      // Update deployment timestamp in database
      if (phoneNumber && !isFirstTimeDeployment) {
        await updateDeploymentTimestamp(pathwayId)
      }

      setDeploymentResult({
        createResponse: isFirstTimeDeployment ? updateData : null,
        updateResponse: updateData,
        pathwayId,
        isFirstTimeDeployment,
      })

      const deploymentMessage = isFirstTimeDeployment
        ? `✅ New pathway created and deployed with ID: ${pathwayId}`
        : `✅ Existing pathway updated successfully: ${pathwayId}`

      toast({
        title: "Deployment successful",
        description: deploymentMessage,
      })

      console.log("[DEPLOYMENT] 🎉 Success:", deploymentMessage)
    } catch (error) {
      console.error("Deployment error:", error)
      setDeploymentError(error instanceof Error ? error.message : "Unknown error occurred")

      toast({
        title: "Deployment failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const updateDeploymentTimestamp = async (pathwayId: string) => {
    if (!phoneNumber) return false

    try {
      const response = await fetch(`/api/phone-numbers/${phoneNumber}/pathway`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pathwayId,
          pathwayName,
          pathwayDescription,
          updateTimestamp: true,
        }),
      })

      const result = await response.json()
      if (result.success) {
        console.log("[DEPLOYMENT] 🕒 Deployment timestamp updated")
      }
      return result.success
    } catch (error) {
      console.error("Error updating deployment timestamp:", error)
      return false
    }
  }

  const handleImportJson = (jsonData: any) => {
    try {
      const flowchartData = convertBlandFormatToFlowchart(jsonData)

      setNodes(flowchartData.nodes)
      setEdges(flowchartData.edges)

      if (flowchartData.name) setPathwayName(flowchartData.name)
      if (flowchartData.description) setPathwayDescription(flowchartData.description)

      if (reactFlowInstance) {
        setTimeout(() => {
          reactFlowInstance.fitView({ padding: 0.2 })
        }, 100)
      }

      toast({
        title: "Import successful",
        description: "The flowchart has been rebuilt from the imported JSON.",
      })
    } catch (error) {
      console.error("Error importing JSON:", error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import JSON",
        variant: "destructive",
      })
    }
  }

  const copyPayloadToClipboard = () => {
    if (apiPayload) {
      navigator.clipboard.writeText(JSON.stringify(apiPayload, null, 2))
      toast({
        title: "Copied to clipboard",
        description: "The API payload has been copied to your clipboard.",
      })
    }
  }

  // Add keyboard event handler for deleting selected edges
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        if (reactFlowInstance) {
          const selectedEdges = edges.filter((edge) => edge.selected)

          if (selectedEdges.length > 0) {
            setEdges((edges) => edges.filter((edge) => !edge.selected))

            toast({
              title: `${selectedEdges.length > 1 ? "Connections" : "Connection"} removed`,
              description: `${selectedEdges.length} ${selectedEdges.length > 1 ? "connections have" : "connection has"} been deleted.`,
            })

            event.preventDefault()
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [reactFlowInstance, setEdges, edges])

  const handleHighlightNode = useCallback((nodeId: string | null) => {
    setHighlightedNodeId(nodeId)
  }, [])

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

  return (
    <>
      {/* Main Layout - Full Screen Flex Container */}
      <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
        {/* Node Sidebar - Fixed Width */}
        <NodeSidebar />

        {/* Canvas Area - Flex 1 to take remaining space */}
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
                <Button onClick={saveFlowchart} className="bg-green-600 hover:bg-green-700 shadow-md" size="sm">
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
                <ImportJsonDialog onImport={handleImportJson} />
                {blandPayload && <JsonPreview data={blandPayload} title="Bland.ai Pathway JSON" />}
                <Button onClick={handleDeploy} className="bg-blue-600 hover:bg-blue-700 shadow-md" size="sm">
                  {existingPathwayId ? "Update Pathway" : "Deploy to Bland.ai"}
                </Button>
                <Button
                  onClick={() => setSendTestCallOpen(true)}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2 shadow-md"
                  size="sm"
                  disabled={!deploymentResult?.pathwayId}
                >
                  <Phone className="h-4 w-4" />
                  Send Test Call
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
                  <div className="text-xs font-medium mt-1">
                    Status: {existingPathwayId ? "🔄 Will Update" : "🆕 Will Create New"}
                  </div>
                  {isLoadingPathway && <div className="text-xs text-blue-600 mt-1">🔍 Loading pathway...</div>}
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>
      </div>

      {/* Node Editor Drawer - Fixed Overlay */}
      <NodeEditorDrawer
        isOpen={isNodeEditorOpen}
        onClose={handleCloseNodeEditor}
        selectedNode={selectedNodeForEdit}
        onUpdateNode={handleUpdateNode}
      />

      {/* Test Pathway Dialog */}
      {testPathwayOpen && reactFlowInstance && (
        <TestPathwayDialog
          isOpen={testPathwayOpen}
          onClose={() => {
            setTestPathwayOpen(false)
            setHighlightedNodeId(null)
          }}
          flowchartData={reactFlowInstance.toObject()}
          onHighlightNode={handleHighlightNode}
        />
      )}

      {sendTestCallOpen && (
        <SendTestCallDialog
          isOpen={sendTestCallOpen}
          onClose={() => setSendTestCallOpen(false)}
          pathwayId={deploymentResult?.pathwayId || null}
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
              <div className="col-span-3 flex gap-2">
                <Input
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="org_..."
                  className="flex-1"
                />
                <Button onClick={testConnection} disabled={isTesting || !apiKey} variant="outline" size="sm">
                  {isTesting ? "Testing..." : "Test Connection"}
                </Button>
              </div>
            </div>

            {connectionStatus === "success" && (
              <Alert className="col-start-2 col-span-3 bg-green-50 border-green-200 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Connection Successful</AlertTitle>
                <AlertDescription>{connectionMessage}</AlertDescription>
              </Alert>
            )}

            {connectionStatus === "error" && (
              <Alert className="col-start-2 col-span-3 bg-red-50 border-red-200 text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>{connectionMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pathwayName" className="text-right">
                Pathway Name
              </Label>
              <Input
                id="pathwayName"
                value={pathwayName}
                onChange={(e) => setPathwayName(e.target.value)}
                placeholder="My Awesome Pathway"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pathwayDescription" className="text-right">
                Description
              </Label>
              <Textarea
                id="pathwayDescription"
                value={pathwayDescription}
                onChange={(e) => setPathwayDescription(e.target.value)}
                placeholder="Describe your pathway..."
                className="col-span-3"
              />
            </div>

            {existingPathwayId && (
              <Alert className="col-start-2 col-span-3 bg-blue-50 border-blue-200 text-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle>Updating Existing Pathway</AlertTitle>
                <AlertDescription>
                  This will update your existing pathway ({existingPathwayId}) instead of creating a new one.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {deploymentError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
              <p className="font-semibold">Deployment Error:</p>
              <p>{deploymentError}</p>
            </div>
          )}

          {deploymentResult && (
            <div className="bg-green-50 border border-green-200 rounded-md mb-4 overflow-hidden">
              <div className="bg-green-600 text-white px-4 py-3 flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                <h3 className="font-medium">
                  {deploymentResult.isFirstTimeDeployment ? "Deployment Successful!" : "Update Successful!"}
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pathway ID:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-green-50 px-2 py-1 rounded text-sm">{deploymentResult.pathwayId}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        navigator.clipboard.writeText(deploymentResult.pathwayId)
                        toast({
                          title: "Copied",
                          description: "Pathway ID copied to clipboard",
                        })
                      }}
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>

                {phoneNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Linked Phone Number:</span>
                    <code className="bg-green-50 px-2 py-1 rounded text-sm">{phoneNumber}</code>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeployDialogOpen(false)
                      window.location.href = "/dashboard/pathway"
                    }}
                  >
                    View All Pathways
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeployDialogOpen(false)
                      window.location.href = "/dashboard/call-history"
                    }}
                  >
                    View Call History
                  </Button>
                </div>
              </div>
            </div>
          )}

          {apiPayload && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="w-full flex items-center justify-between"
              >
                <span>Technical Details</span>
                {showDebugInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showDebugInfo && (
                <div className="mt-2 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">API Payload:</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyPayloadToClipboard}
                        className="flex items-center gap-1 h-7"
                      >
                        <Copy size={14} />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-md overflow-auto max-h-60">
                      <pre className="text-xs">{JSON.stringify(apiPayload, null, 2)}</pre>
                    </div>
                  </div>

                  {debugInfo && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Debug Information:</h3>
                      <div className="bg-gray-50 border border-gray-200 p-3 rounded-md overflow-auto max-h-40">
                        <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeployDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleActualDeploy}
              disabled={isDeploying || !apiKey || !pathwayName || connectionStatus === "error"}
            >
              {isDeploying ? "Deploying..." : existingPathwayId ? "Update Pathway" : "Deploy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showValidationDialog && (
        <ValidationDialog
          isOpen={showValidationDialog}
          onClose={() => setShowValidationDialog(false)}
          validationResult={validationResult}
          onProceed={handleDeployAfterValidation}
          isDeploying={isDeploying}
        />
      )}
    </>
  )
}
