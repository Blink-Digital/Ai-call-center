import type { Node, Edge } from "reactflow"

// Map Bland.ai node types to our custom node types
function mapBlandTypeToNodeType(blandType: string): string {
  switch (blandType) {
    case "Default":
      return "greetingNode" // We'll determine if it's greeting, question, or response later
    case "End Call":
      return "endCallNode"
    case "Transfer Node":
      return "transferNode"
    case "Webhook":
      return "webhookNode"
    default:
      return "responseNode" // Default fallback
  }
}

// Refine node type based on data and connections
function refineNodeType(node: any, blandNodes: any[], blandEdges: any[]): string {
  const baseType = mapBlandTypeToNodeType(node.type || "Default")

  // If it's already a specific type, return it
  if (baseType !== "greetingNode") {
    return baseType
  }

  // Check if this is a start node
  if (node.data?.isStart) {
    return "greetingNode"
  }

  // Check incoming edges to determine if it's a customer response node
  const incomingEdges = blandEdges.filter((edge) => edge.target === node.id)
  const outgoingEdges = blandEdges.filter((edge) => edge.source === node.id)

  // If it has multiple outgoing edges with different conditions, it's likely a customer response node
  if (outgoingEdges.length > 1) {
    const uniqueConditions = new Set(outgoingEdges.map((edge) => edge.condition || edge.label))
    if (uniqueConditions.size > 1) {
      return "customerResponseNode"
    }
  }

  // If it has no incoming edges, it's likely a greeting node
  if (incomingEdges.length === 0) {
    return "greetingNode"
  }

  // If it has incoming edges from a customer response node, it's likely a response node
  if (
    incomingEdges.some((edge) => {
      const sourceNode = blandNodes.find((n) => n.id === edge.source)
      return sourceNode && mapBlandTypeToNodeType(sourceNode.type || "") === "customerResponseNode"
    })
  ) {
    return "responseNode"
  }

  // If it has outgoing edges to a customer response node, it's likely a question node
  if (
    outgoingEdges.some((edge) => {
      const targetNode = blandNodes.find((n) => n.id === edge.target)
      return targetNode && mapBlandTypeToNodeType(targetNode.type || "") === "customerResponseNode"
    })
  ) {
    return "questionNode"
  }

  // Default to response node if we can't determine
  return "responseNode"
}

export function convertBlandFormatToFlowchart(blandData: any) {
  // Ensure we have valid data
  if (!blandData || !blandData.nodes || !Array.isArray(blandData.nodes)) {
    throw new Error("Invalid JSON format: Missing or invalid nodes array")
  }

  if (!blandData.edges || !Array.isArray(blandData.edges)) {
    // If edges are missing, create an empty array
    blandData.edges = []
  }

  const { nodes: blandNodes, edges: blandEdges } = blandData

  // Initial position variables for layout
  const xPos = 50
  const yPos = 50
  const xOffset = 300
  const yOffset = 200

  // Convert nodes
  const reactFlowNodes: Node[] = blandNodes.map((node: any, index: number) => {
    // Ensure node has required properties
    if (!node.id) {
      node.id = `node_${index}`
    }

    if (!node.type) {
      node.type = "Default"
    }

    if (!node.data) {
      node.data = {}
    }

    // Determine node type
    const initialType = mapBlandTypeToNodeType(node.type)

    // Create base node data with safe access to properties
    let nodeData: any = {
      text: node.data?.text || `Node ${index + 1}`,
    }

    // Add type-specific data
    switch (node.type) {
      case "Webhook":
        nodeData = {
          ...nodeData,
          url: node.data?.url || "https://example.com/webhook",
          method: node.data?.method || "POST",
          body: node.data?.body || "{}",
          extractVars: node.data?.extractVars || [
            ["response", "string", "The response from the webhook"],
            ["status", "number", "The HTTP status code"],
          ],
        }
        break
      case "Transfer Node":
        nodeData = {
          ...nodeData,
          transferNumber: node.data?.transferNumber || "+1234567890",
          phoneNumber: node.data?.transferNumber || "+1234567890", // For compatibility
          transferType: node.data?.transferType || "warm",
        }
        break
    }

    // Calculate position (simple grid layout)
    const position = {
      x: xPos + (index % 3) * xOffset,
      y: yPos + Math.floor(index / 3) * yOffset,
    }

    return {
      id: node.id,
      type: initialType, // We'll refine this later
      position,
      data: nodeData,
    }
  })

  // Refine node types based on connections
  reactFlowNodes.forEach((node: any) => {
    node.type = refineNodeType(node, blandNodes, blandEdges)

    // Special handling for customer response nodes
    if (node.type === "customerResponseNode") {
      // Extract response options from outgoing edges
      const outgoingEdges = blandEdges.filter((edge: any) => edge.source === node.id)
      const responseOptions = outgoingEdges.map((edge: any) => edge.label || edge.condition || "Option").filter(Boolean) // Filter out undefined/null values

      // If no response options found, provide defaults
      if (!responseOptions.length) {
        responseOptions.push("Yes", "No", "Maybe")
      }

      // Update node data with response options
      node.data.responses = responseOptions
      node.data.options = responseOptions
    }

    // If this is a start node with extractVars, set the variableName
    if (node.data.isStart && node.data.extractVars && Array.isArray(node.data.extractVars)) {
      const ageVar = node.data.extractVars.find((v: any) => v[0] === "Age" || v[0].toLowerCase() === "age")
      if (ageVar) {
        node.data.variableName = "Age"
        node.data.variableType = ageVar[1] || "integer"
        node.data.variableDescription = ageVar[2] || "Extract the age"
      }
    }
  })

  // Convert edges
  const reactFlowEdges: Edge[] = blandEdges
    .map((edge: any, index: number) => {
      // Ensure edge has required properties
      if (!edge.source || !edge.target) {
        console.warn(`Edge at index ${index} is missing source or target`)
        return null
      }

      // Find source and target nodes
      const sourceNode = reactFlowNodes.find((n) => n.id === edge.source)
      const targetNode = reactFlowNodes.find((n) => n.id === edge.target)

      if (!sourceNode || !targetNode) {
        console.warn(`Edge ${edge.id || index} references non-existent node(s)`)
        return null
      }

      // Determine source handle for customer response nodes
      let sourceHandle = undefined
      if (sourceNode.type === "customerResponseNode") {
        const responseOptions = sourceNode.data.options || sourceNode.data.responses || []
        // Look for a match between the edge label and response options
        const responseIndex = responseOptions.findIndex(
          (option: string) => option === edge.label || option === edge.condition,
        )
        if (responseIndex >= 0) {
          sourceHandle = `response-${responseIndex}`
        }
      } else if (sourceNode.type === "conditionalNode") {
        // Determine source handle for conditional nodes
        if (
          edge.label === "Yes" ||
          edge.condition === "Yes" ||
          (edge.label && edge.label.includes("<=")) ||
          (edge.condition && edge.condition.includes("<="))
        ) {
          sourceHandle = "true"
        } else if (
          edge.label === "No" ||
          edge.condition === "No" ||
          (edge.label && edge.label.includes(">")) ||
          (edge.condition && edge.condition.includes(">"))
        ) {
          sourceHandle = "false"
        }
      }

      return {
        id: edge.id || `edge-${index}`,
        source: edge.source,
        target: edge.target,
        sourceHandle,
        type: "custom",
        data: {
          label: edge.label || edge.condition || "next",
        },
      }
    })
    .filter(Boolean) as Edge[]

  return {
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
    name: blandData.name || "Imported Flowchart",
    description: blandData.description || "Imported from Bland.ai JSON",
  }
}
