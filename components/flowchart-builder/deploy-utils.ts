import type { Node, Edge } from "reactflow"

export function normalizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()
}

// Helper function to create clean data object with only supported fields
function createCleanDataObject(node: Node, nodeType: string, isStart: boolean) {
  const cleanData: any = {}

  // Set isStart based on calculation - REQUIRED for all nodes
  cleanData.isStart = isStart

  // Always include name if available
  if (node.data?.name) {
    cleanData.name = node.data.name
  }

  // Node-type specific required fields
  switch (nodeType) {
    case "greetingNode":
    case "responseNode":
    case "Default":
      // Default nodes require 'text' field
      cleanData.text = node.data?.greeting || node.data?.text || node.data?.prompt || ""
      if (!cleanData.name) cleanData.name = "Default Node"
      break

    case "questionNode":
    case "customerResponseNode":
    case "Question":
      // Question nodes require 'text' field and optional 'responses'
      cleanData.text = node.data?.question || node.data?.text || node.data?.prompt || ""
      if (!cleanData.name) cleanData.name = "Question"

      // Add responses if they exist
      if (node.data?.responses && Array.isArray(node.data.responses)) {
        cleanData.responses = node.data.responses
      } else if (node.data?.options && Array.isArray(node.data.options)) {
        cleanData.responses = node.data.options
      }
      break

    case "conditionalNode":
    case "Conditional":
      // Conditional nodes require 'condition' field
      cleanData.condition = node.data?.condition || ""
      cleanData.trueLabel = node.data?.trueLabel || "Yes"
      cleanData.falseLabel = node.data?.falseLabel || "No"
      if (!cleanData.name) cleanData.name = "Conditional"
      break

    case "transferNode":
    case "Transfer Call":
      // Transfer nodes require 'transferNumber' field
      cleanData.transferNumber = node.data?.phoneNumber || node.data?.transferNumber || ""
      if (node.data?.message || node.data?.text) {
        cleanData.text = node.data.message || node.data.text
      }
      if (!cleanData.name) cleanData.name = "Transfer Call"
      break

    case "endCallNode":
    case "End Call":
      // End Call nodes require 'prompt' field (NOT 'text')
      cleanData.prompt = node.data?.message || node.data?.prompt || "Thank you for calling. Goodbye!"
      if (!cleanData.name) cleanData.name = "End Call"
      break

    case "webhookNode":
    case "Webhook":
      // Webhook nodes require 'url' and 'method' fields
      cleanData.url = node.data?.url || node.data?.webhookUrl || ""
      cleanData.method = node.data?.method || "POST"
      if (!cleanData.name) cleanData.name = "Webhook"

      // Optional webhook fields
      if (node.data?.headers) cleanData.headers = node.data.headers
      if (node.data?.body) cleanData.body = node.data.body
      if (node.data?.extractVars && Array.isArray(node.data.extractVars)) {
        cleanData.extractVars = node.data.extractVars
      }
      if (node.data?.responseData) cleanData.responseData = node.data.responseData
      if (node.data?.responsePathways) cleanData.responsePathways = node.data.responsePathways
      break

    case "zapierNode":
    case "facebookLeadNode":
    case "googleLeadNode":
      // These are treated as webhook nodes
      cleanData.url = node.data?.webhookUrl || node.data?.url || ""
      cleanData.method = "POST"
      if (!cleanData.name)
        cleanData.name = nodeType.includes("zapier")
          ? "Zapier Integration"
          : nodeType.includes("facebook")
            ? "Facebook Lead"
            : "Google Lead"
      break

    default:
      // Unknown node types default to Default behavior
      cleanData.text = node.data?.text || node.data?.prompt || ""
      if (!cleanData.name) cleanData.name = `Unknown Node (${nodeType})`
      console.warn(`[CONVERT] ⚠️ Unknown node type: ${nodeType}`)
      break
  }

  // Optional global fields (only include if they exist)
  if (node.data?.isGlobal !== undefined) cleanData.isGlobal = node.data.isGlobal
  if (node.data?.globalLabel) cleanData.globalLabel = node.data.globalLabel
  if (node.data?.voice) cleanData.voice = node.data.voice
  if (node.data?.language) cleanData.language = node.data.language
  if (node.data?.temperature !== undefined) cleanData.temperature = node.data.temperature
  if (node.data?.model) cleanData.model = node.data.model
  if (node.data?.skipUserResponse !== undefined) cleanData.skipUserResponse = node.data.skipUserResponse
  if (node.data?.disableRepeatOnSilence !== undefined)
    cleanData.disableRepeatOnSilence = node.data.disableRepeatOnSilence
  if (node.data?.enableSmsReturnNode !== undefined) cleanData.enableSmsReturnNode = node.data.enableSmsReturnNode

  // Arrays - only include if they exist and have content
  if (node.data?.variables && Array.isArray(node.data.variables)) cleanData.variables = node.data.variables
  if (node.data?.pathwayExamples && Array.isArray(node.data.pathwayExamples))
    cleanData.pathwayExamples = node.data.pathwayExamples
  if (node.data?.conditionExamples && Array.isArray(node.data.conditionExamples))
    cleanData.conditionExamples = node.data.conditionExamples
  if (node.data?.dialogueExamples && Array.isArray(node.data.dialogueExamples))
    cleanData.dialogueExamples = node.data.dialogueExamples

  return cleanData
}

export function convertFlowchartToBlandFormat(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  pathwayName?: string,
  pathwayDescription?: string,
) {
  console.log("[CONVERT] 🔄 Starting conversion to Bland.ai format...")
  console.log("[CONVERT] 📊 Input data:", {
    nodesCount: nodes.length,
    edgesCount: edges.length,
    startNodeId,
    pathwayName,
    pathwayDescription,
  })

  const blandNodes = nodes.map((node) => {
    console.log(`[CONVERT] 🔍 Processing node: ${node.id} (type: ${node.type})`)

    const isStart = node.id === startNodeId
    let blandNodeType = "Default"

    // Map ReactFlow node types to Bland.ai node types
    switch (node.type) {
      case "greetingNode":
      case "responseNode":
        blandNodeType = "Default"
        break
      case "questionNode":
      case "customerResponseNode":
        blandNodeType = "Question"
        break
      case "conditionalNode":
        blandNodeType = "Conditional"
        break
      case "transferNode":
        blandNodeType = "Transfer Call"
        break
      case "endCallNode":
        blandNodeType = "End Call"
        break
      case "webhookNode":
      case "zapierNode":
      case "facebookLeadNode":
      case "googleLeadNode":
        blandNodeType = "Webhook"
        break
      default:
        blandNodeType = "Default"
        console.warn(`[CONVERT] ⚠️ Unknown node type: ${node.type}, defaulting to Default`)
        break
    }

    // Create clean data object with only supported fields
    const nodeData = createCleanDataObject(node, node.type, isStart)

    const blandNode = {
      id: normalizeId(node.id),
      type: blandNodeType,
      data: nodeData,
    }

    console.log(`[CONVERT] ✅ Converted node ${node.id}:`, {
      id: blandNode.id,
      type: blandNode.type,
      dataKeys: Object.keys(blandNode.data),
      isStart: blandNode.data.isStart,
      hasRequiredFields: validateNodeRequiredFields(blandNode),
    })

    return blandNode
  })

  const blandEdges = edges.map((edge) => {
    console.log(`[CONVERT] 🔗 Processing edge: ${edge.id}`)

    const blandEdge = {
      id: normalizeId(edge.id),
      source: normalizeId(edge.source),
      target: normalizeId(edge.target),
      label: edge.data?.label || "Proceed",
    }

    // Only include optional fields if they exist and are supported
    if (edge.data?.description) {
      blandEdge.description = edge.data.description
    }
    if (edge.data?.alwaysPick !== undefined) {
      blandEdge.alwaysPick = edge.data.alwaysPick
    }

    console.log(`[CONVERT] ✅ Converted edge ${edge.id}:`, blandEdge)
    return blandEdge
  })

  // ✅ CRITICAL: Return ONLY the 4 fields that Bland.ai expects
  const result = {
    name: pathwayName || "Bland.ai Pathway",
    description: pathwayDescription || `Pathway created on ${new Date().toLocaleString()}`,
    nodes: blandNodes,
    edges: blandEdges,
  }

  console.log("[CONVERT] 🎉 Conversion complete - FINAL PAYLOAD STRUCTURE:")
  console.log("[CONVERT] 📋 Result keys:", Object.keys(result))
  console.log("[CONVERT] 📊 Result summary:", {
    name: result.name,
    description: result.description,
    nodesCount: result.nodes.length,
    edgesCount: result.edges.length,
  })

  // Validate final payload structure
  const validationErrors = validateBlandPayload(result)
  if (validationErrors.length > 0) {
    console.error("[CONVERT] ❌ Validation errors:", validationErrors)
  } else {
    console.log("[CONVERT] ✅ Payload validation passed")
  }

  // Log first node structure for debugging
  if (result.nodes.length > 0) {
    console.log("[CONVERT] 🔍 First node structure:", JSON.stringify(result.nodes[0], null, 2))
  }

  // Log first edge structure for debugging
  if (result.edges.length > 0) {
    console.log("[CONVERT] 🔗 First edge structure:", JSON.stringify(result.edges[0], null, 2))
  }

  return result
}

// Validate that a node has all required fields for its type
function validateNodeRequiredFields(node: any): boolean {
  if (!node.id || !node.type || !node.data) return false

  switch (node.type) {
    case "Default":
      return !!node.data.text && node.data.isStart !== undefined
    case "Question":
      return !!node.data.text && node.data.isStart !== undefined
    case "Conditional":
      return !!node.data.condition && node.data.isStart !== undefined
    case "Transfer Call":
      return !!node.data.transferNumber && node.data.isStart !== undefined
    case "End Call":
      return !!node.data.prompt && node.data.isStart !== undefined
    case "Webhook":
      return !!node.data.url && !!node.data.method && node.data.isStart !== undefined
    default:
      return node.data.isStart !== undefined
  }
}

// Validate the entire Bland.ai payload
function validateBlandPayload(payload: any): string[] {
  const errors: string[] = []

  // Check top-level structure
  if (!payload.name || typeof payload.name !== "string") {
    errors.push("Missing or invalid 'name' field")
  }
  if (!payload.description || typeof payload.description !== "string") {
    errors.push("Missing or invalid 'description' field")
  }
  if (!Array.isArray(payload.nodes)) {
    errors.push("'nodes' must be an array")
  }
  if (!Array.isArray(payload.edges)) {
    errors.push("'edges' must be an array")
  }

  // Check for disallowed top-level fields
  const allowedTopLevelFields = ["name", "description", "nodes", "edges"]
  const actualFields = Object.keys(payload)
  const disallowedFields = actualFields.filter((field) => !allowedTopLevelFields.includes(field))
  if (disallowedFields.length > 0) {
    errors.push(`Disallowed top-level fields found: ${disallowedFields.join(", ")}`)
  }

  // Validate nodes
  if (Array.isArray(payload.nodes)) {
    payload.nodes.forEach((node: any, index: number) => {
      if (!validateNodeRequiredFields(node)) {
        errors.push(`Node at index ${index} (${node.id}) is missing required fields for type ${node.type}`)
      }
    })
  }

  // Validate edges
  if (Array.isArray(payload.edges)) {
    payload.edges.forEach((edge: any, index: number) => {
      if (!edge.id || !edge.source || !edge.target || !edge.label) {
        errors.push(`Edge at index ${index} is missing required fields (id, source, target, label)`)
      }
    })
  }

  return errors
}

// Validate flowchart for deployment
export function validateFlowchartForDeployment(nodes: Node[], edges: Edge[]): string[] {
  const errors: string[] = []

  // Check for empty flowchart
  if (nodes.length === 0) {
    errors.push("Flowchart must contain at least one node.")
    return errors
  }

  // Validate each node
  for (const node of nodes) {
    switch (node.type) {
      case "greetingNode":
        if (!node.data?.greeting?.trim() && !node.data?.text?.trim()) {
          errors.push(`Greeting Node "${node.id}" must contain a greeting message.`)
        }
        break
      case "responseNode":
        if (!node.data?.text?.trim() && !node.data?.prompt?.trim()) {
          errors.push(`Response Node "${node.id}" must contain a response prompt.`)
        }
        break
      case "questionNode":
        if (!node.data?.question?.trim() && !node.data?.text?.trim()) {
          errors.push(`Question Node "${node.id}" must contain a question.`)
        }
        break
      case "conditionalNode":
        if (!node.data?.condition?.trim()) {
          errors.push(`Conditional Node "${node.id}" must contain a condition.`)
        }
        break
      case "transferNode":
        if (!node.data?.phoneNumber?.trim()) {
          errors.push(`Transfer Node "${node.id}" must contain a phone number.`)
        }
        break
      case "webhookNode":
        if (!node.data?.url?.trim()) {
          errors.push(`Webhook Node "${node.id}" must contain a URL.`)
        }
        break
      case "zapierNode":
        if (!node.data?.webhookUrl?.trim()) {
          errors.push(`Zapier Node "${node.id}" must contain a webhook URL.`)
        }
        break
    }
  }

  // Check for orphaned nodes (nodes with no connections)
  const connectedNodeIds = new Set<string>()
  for (const edge of edges) {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  }

  const orphanedNodes = nodes.filter((node) => !connectedNodeIds.has(node.id) && nodes.length > 1)
  if (orphanedNodes.length > 0) {
    errors.push(`Found ${orphanedNodes.length} disconnected node(s). All nodes should be connected to the flow.`)
  }

  // Check for start node
  const hasGreetingNode = nodes.some((node) => node.type === "greetingNode")
  if (!hasGreetingNode && nodes.length > 1) {
    errors.push("Flowchart should have a Greeting Node as the starting point.")
  }

  return errors
}
