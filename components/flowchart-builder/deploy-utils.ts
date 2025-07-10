import type { Node, Edge } from "reactflow"

// Map flowchart node types to Bland.ai node types
export function mapNodeTypeToBland(nodeType: string): string {
  switch (nodeType) {
    case "greetingNode":
      return "Default"
    case "responseNode":
      return "Default"
    case "questionNode":
      return "Question"
    case "conditionalNode":
      return "Conditional"
    case "transferNode":
      return "Transfer"
    case "endCallNode":
      return "End Call"
    case "webhookNode":
      return "Webhook"
    case "zapierNode":
      return "Zapier"
    case "customerResponseNode":
      return "Customer Response"
    case "facebookLeadNode":
      return "Facebook Lead"
    case "googleLeadNode":
      return "Google Lead"
    default:
      return "Default"
  }
}

// Normalize node IDs to be Bland.ai compatible
export function normalizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()
}

// Convert flowchart format to Bland.ai pathway format
export function convertFlowchartToBlandFormat(nodes: Node[], edges: Edge[], startNodeId: string) {
  const blandNodes: any[] = []
  const blandEdges: any[] = []

  // Convert nodes
  for (const node of nodes) {
    const blandNodeType = mapNodeTypeToBland(node.type || "responseNode")

    let blandNode: any = {
      id: normalizeId(node.id),
      type: blandNodeType,
    }

    // Handle ResponseNode specifically to export as Default
    if (node.type === "responseNode") {
      blandNode = {
        id: normalizeId(node.id),
        type: "Default",
        text: node.data?.text || node.data?.prompt || "",
        isGlobal: node.data?.isGlobal || false,
        globalLabel: node.data?.globalLabel || "",
        temperature: node.data?.temperature || 0.7,
        skipUserResponse: node.data?.skipUserResponse || false,
        disableRepeatOnSilence: node.data?.disableRepeatOnSilence || false,
        enableSmsReturnNode: node.data?.enableSmsReturnNode || false,
        disableEndCallTool: node.data?.disableEndCallTool || false,
        variables: node.data?.variables || [],
        conditionExamples: node.data?.conditionExamples || [],
        dialogueExamples: node.data?.dialogueExamples || [],
        pathwayExamples: node.data?.pathwayExamples || [],
      }
    } else {
      // Handle other node types
      switch (node.type) {
        case "greetingNode":
          blandNode.text = node.data?.greeting || node.data?.text || ""
          break
        case "questionNode":
          blandNode.text = node.data?.question || node.data?.text || ""
          blandNode.responses = node.data?.responses || []
          break
        case "conditionalNode":
          blandNode.condition = node.data?.condition || ""
          blandNode.trueLabel = node.data?.trueLabel || "Yes"
          blandNode.falseLabel = node.data?.falseLabel || "No"
          break
        case "transferNode":
          blandNode.phoneNumber = node.data?.phoneNumber || ""
          blandNode.message = node.data?.message || ""
          break
        case "endCallNode":
          blandNode.message = node.data?.message || "Thank you for calling. Goodbye!"
          break
        case "webhookNode":
          blandNode.url = node.data?.url || ""
          blandNode.method = node.data?.method || "POST"
          blandNode.headers = node.data?.headers || {}
          blandNode.body = node.data?.body || {}
          break
        case "zapierNode":
          blandNode.webhookUrl = node.data?.webhookUrl || ""
          blandNode.triggerPhrase = node.data?.triggerPhrase || ""
          break
        case "customerResponseNode":
          blandNode.responses = node.data?.responses || node.data?.options || []
          blandNode.allowOther = node.data?.allowOther || false
          break
        case "facebookLeadNode":
          blandNode.leadFormId = node.data?.leadFormId || ""
          blandNode.accessToken = node.data?.accessToken || ""
          break
        case "googleLeadNode":
          blandNode.formId = node.data?.formId || ""
          blandNode.spreadsheetId = node.data?.spreadsheetId || ""
          break
        default:
          blandNode.text = node.data?.text || node.data?.prompt || ""
      }
    }

    blandNodes.push(blandNode)
  }

  // Convert edges
  for (const edge of edges) {
    const blandEdge = {
      id: normalizeId(edge.id),
      source: normalizeId(edge.source),
      target: normalizeId(edge.target),
      label: edge.data?.label || "Proceed",
      description: edge.data?.description || "",
      alwaysPick: edge.data?.alwaysPick || false,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
    }

    blandEdges.push(blandEdge)
  }

  return {
    nodes: blandNodes,
    edges: blandEdges,
    startNodeId: normalizeId(startNodeId),
    name: "",
    description: "",
  }
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
