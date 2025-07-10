import type { Node, Edge } from "reactflow"

export interface BlandPathwayNode {
  id: string
  type: string
  data: any
  position?: { x: number; y: number }
}

export interface BlandPathwayEdge {
  id: string
  source: string
  target: string
  data?: any
}

export interface BlandPathway {
  nodes: BlandPathwayNode[]
  edges: BlandPathwayEdge[]
  name?: string
  description?: string
}

/**
 * Convert Bland.ai pathway format to ReactFlow format
 */
export function convertBlandToFlowchart(blandData: any): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Handle different Bland.ai data structures
  if (blandData.pathway) {
    // If data has pathway property
    return convertPathwayNodes(blandData.pathway)
  } else if (blandData.nodes && blandData.edges) {
    // If data already has nodes and edges
    return {
      nodes: blandData.nodes.map(convertBlandNodeToReactFlow),
      edges: blandData.edges.map(convertBlandEdgeToReactFlow),
    }
  } else if (Array.isArray(blandData)) {
    // If data is an array of nodes
    return convertNodeArray(blandData)
  }

  return { nodes, edges }
}

function convertPathwayNodes(pathway: any): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Convert pathway structure to nodes and edges
  Object.entries(pathway).forEach(([nodeId, nodeData]: [string, any], index) => {
    const node: Node = {
      id: nodeId,
      type: mapBlandTypeToReactFlow(nodeData.type || "response"),
      position: { x: 200 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
      data: {
        text: nodeData.message || nodeData.text || `Node ${nodeId}`,
        ...nodeData,
      },
    }

    nodes.push(node)

    // Create edges based on next property
    if (nodeData.next) {
      if (typeof nodeData.next === "string") {
        edges.push({
          id: `${nodeId}-${nodeData.next}`,
          source: nodeId,
          target: nodeData.next,
          type: "default",
        })
      } else if (Array.isArray(nodeData.next)) {
        nodeData.next.forEach((nextId: string, idx: number) => {
          edges.push({
            id: `${nodeId}-${nextId}-${idx}`,
            source: nodeId,
            target: nextId,
            type: "default",
          })
        })
      }
    }
  })

  return { nodes, edges }
}

function convertNodeArray(nodeArray: any[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = nodeArray.map((nodeData, index) =>
    convertBlandNodeToReactFlow({
      ...nodeData,
      id: nodeData.id || `node-${index}`,
      position: nodeData.position || { x: 200 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
    }),
  )

  const edges: Edge[] = []
  // Extract edges from node connections
  nodeArray.forEach((nodeData, index) => {
    if (nodeData.next) {
      const sourceId = nodeData.id || `node-${index}`
      if (typeof nodeData.next === "string") {
        edges.push({
          id: `${sourceId}-${nodeData.next}`,
          source: sourceId,
          target: nodeData.next,
          type: "default",
        })
      }
    }
  })

  return { nodes, edges }
}

function convertBlandNodeToReactFlow(blandNode: any): Node {
  return {
    id: blandNode.id,
    type: mapBlandTypeToReactFlow(blandNode.type),
    position: blandNode.position || { x: 0, y: 0 },
    data: {
      text: blandNode.message || blandNode.text || blandNode.data?.text || "Node",
      ...blandNode.data,
      ...blandNode,
    },
  }
}

function convertBlandEdgeToReactFlow(blandEdge: any): Edge {
  return {
    id: blandEdge.id,
    source: blandEdge.source,
    target: blandEdge.target,
    type: "default",
    data: blandEdge.data,
  }
}

function mapBlandTypeToReactFlow(blandType: string): string {
  const typeMap: Record<string, string> = {
    greeting: "greetingNode",
    question: "questionNode",
    response: "responseNode",
    "customer-response": "customerResponseNode",
    "end-call": "endCallNode",
    transfer: "transferNode",
    webhook: "webhookNode",
    conditional: "conditionalNode",
    zapier: "zapierNode",
    "facebook-lead": "facebookLeadNode",
    "google-lead": "googleLeadNode",
  }

  return typeMap[blandType] || "responseNode"
}

// Backward compatibility
export const convertBlandFormatToFlowchart = convertBlandToFlowchart
