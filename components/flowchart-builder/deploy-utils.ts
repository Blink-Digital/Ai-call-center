// Utility functions for converting flowchart data to Bland.ai format

export function normalizeId(id: string): string {
  // Replace special characters with underscores and ensure it's a valid ID
  return id.replace(/[^a-zA-Z0-9_]/g, "_")
}

/**
 * Helper function to normalize node types to Bland.ai supported types
 * Bland.ai only accepts: "Default", "End Call", "Webhook", "Transfer Call", "Knowledge Base"
 */
export function normalizeNodeType(type: string): string {
  const supportedTypes = ["Default", "End Call", "Webhook", "Transfer Call", "Knowledge Base"]

  // If the type is already supported, return it as-is
  if (supportedTypes.includes(type)) {
    return type
  }

  // Map specific node types to appropriate Bland.ai types
  switch (type) {
    case "endCallNode":
    case "End Call Node":
      return "End Call"

    case "webhookNode":
    case "zapierNode":
    case "facebookLeadNode":
    case "googleLeadNode":
    case "Webhook Node":
      return "Webhook"

    case "transferNode":
    case "Transfer Node":
      return "Transfer Call"

    case "knowledgeBaseNode":
    case "Knowledge Base Node":
      return "Knowledge Base"

    // All other types (questionNode, responseNode, conditionalNode, greetingNode, etc.)
    // should be mapped to "Default"
    default:
      return "Default"
  }
}

/**
 * Clean and structure node data according to Bland.ai requirements
 * This function ensures proper field ordering and mutual exclusivity
 */
function cleanNodeData(data: any, nodeType: string, isStartNode: boolean): any {
  console.log(`[CLEAN_NODE_DATA] Processing node type: ${nodeType}, isStart: ${isStartNode}`)
  console.log(`[CLEAN_NODE_DATA] Input data:`, data)

  // Start with name as the first property (if it exists)
  const cleanedData: any = {}

  // 1. Always put name first if it exists
  if (data.name) {
    cleanedData.name = data.name
  }

  // 2. Handle isStart - ONLY for start nodes
  if (isStartNode) {
    cleanedData.isStart = true
  }
  // Note: We deliberately do NOT add isStart: false for non-start nodes

  // 3. Handle mutually exclusive text/prompt logic
  // Check if this node has static prompt toggle behavior
  const hasStaticPrompt = data.useStaticPrompt || data.staticPrompt || (data.prompt && !data.text)

  if (hasStaticPrompt && data.prompt) {
    // Static prompt mode - use prompt field only
    cleanedData.text = data.prompt // Bland.ai uses 'text' for static content
    console.log(`[CLEAN_NODE_DATA] Using static prompt -> text: "${data.prompt}"`)
  } else if (data.text) {
    // Dynamic AI mode - use text field for AI guidance
    cleanedData.prompt = data.text // Bland.ai uses 'prompt' for AI guidance
    console.log(`[CLEAN_NODE_DATA] Using dynamic text -> prompt: "${data.text}"`)
  } else if (data.prompt) {
    // Fallback: if only prompt exists, treat as static
    cleanedData.text = data.prompt
    console.log(`[CLEAN_NODE_DATA] Fallback prompt -> text: "${data.prompt}"`)
  }

  // 4. Handle node-type specific required fields
  switch (nodeType) {
    case "End Call":
      // End Call nodes need prompt field for the final message
      if (data.text && !cleanedData.prompt) {
        cleanedData.prompt = data.text
      }
      break

    case "Transfer Call":
      // Transfer Call nodes must have transferNumber
      if (data.transferNumber) {
        cleanedData.transferNumber = data.transferNumber
      } else if (data.phoneNumber) {
        cleanedData.transferNumber = data.phoneNumber
      } else {
        cleanedData.transferNumber = "+1234567890" // Default fallback
      }
      break

    case "Webhook":
      // Webhook nodes must have url and method
      cleanedData.url = data.url || "https://example.com/webhook"
      cleanedData.method = data.method || "POST"

      // Include additional webhook fields if present
      if (data.headers) cleanedData.headers = data.headers
      if (data.body) cleanedData.body = data.body
      break

    case "Knowledge Base":
      // Knowledge Base nodes must have kb field
      cleanedData.kb = data.kb || "default"
      break

    default:
      // Default nodes - ensure we have either text or prompt
      if (!cleanedData.text && !cleanedData.prompt) {
        cleanedData.text = data.text || data.prompt || "Default message"
      }
      break
  }

  // 5. Include other valid Bland.ai fields (but not legacy ones)
  const validFields = [
    "extractVars",
    "responseData",
    "responsePathways",
    "kb",
    "transferNumber",
    "url",
    "method",
    "headers",
    "body",
  ]

  for (const field of validFields) {
    if (data[field] !== undefined && !cleanedData[field]) {
      cleanedData[field] = data[field]
    }
  }

  console.log(`[CLEAN_NODE_DATA] Final cleaned data:`, cleanedData)
  return cleanedData
}

/**
 * Convert ReactFlow flowchart data to Bland.ai pathway format
 * This function ensures strict compliance with Bland.ai's API requirements
 */
export function convertFlowchartToBlandFormat(
  nodes: any[],
  edges: any[],
  startNodeId: string,
  pathwayName?: string,
  pathwayDescription?: string,
): any {
  console.log("[CONVERT] 🔄 Converting flowchart to Bland.ai format...")
  console.log("[CONVERT] - Input nodes:", nodes.length)
  console.log("[CONVERT] - Input edges:", edges.length)
  console.log("[CONVERT] - Start node ID:", startNodeId)

  // Convert nodes to Bland.ai format
  const blandNodes = nodes
    .filter((node) => {
      // Filter out invalid nodes
      if (!node || !node.id || !node.type) {
        console.warn("[CONVERT] ⚠️ Skipping invalid node:", node)
        return false
      }
      return true
    })
    .map((node) => {
      // Normalize the node type to Bland.ai supported types
      const normalizedType = normalizeNodeType(node.type)

      // Determine if this is the start node
      const isStartNode = node.id === startNodeId || node.type === "greetingNode"

      // Clean and structure the node data properly
      const cleanedData = cleanNodeData(node.data || {}, normalizedType, isStartNode)

      const blandNode = {
        id: normalizeId(node.id),
        type: normalizedType,
        data: cleanedData,
      }

      console.log(`[CONVERT] 📝 Node ${node.id}: ${node.type} → ${normalizedType} (start: ${isStartNode})`)
      console.log(`[CONVERT] 📝 Node data keys:`, Object.keys(cleanedData))

      return blandNode
    })

  // Convert edges to Bland.ai format
  const blandEdges = edges
    .filter((edge) => {
      // Filter out invalid edges
      if (!edge || !edge.id || !edge.source || !edge.target) {
        console.warn("[CONVERT] ⚠️ Skipping invalid edge:", edge)
        return false
      }
      return true
    })
    .map((edge) => {
      // Get label from edge data or default
      const label = edge.data?.label || edge.label || "next"

      const blandEdge = {
        id: normalizeId(edge.id),
        source: normalizeId(edge.source),
        target: normalizeId(edge.target),
        label: label,
      }

      console.log(`[CONVERT] 🔗 Edge ${edge.id}: ${edge.source} → ${edge.target} (${label})`)

      return blandEdge
    })

  // Create the final Bland.ai pathway object
  const blandPathway = {
    name: pathwayName || "Untitled Pathway",
    description: pathwayDescription || "Generated pathway",
    nodes: blandNodes,
    edges: blandEdges,
  }

  console.log("[CONVERT] ✅ Conversion complete:")
  console.log("[CONVERT] - Output nodes:", blandNodes.length)
  console.log("[CONVERT] - Output edges:", blandEdges.length)
  console.log("[CONVERT] - Pathway name:", blandPathway.name)

  return blandPathway
}
