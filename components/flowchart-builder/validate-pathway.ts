// Add defensive programming to the validatePathway function
export function validatePathway(nodes: any[], edges: any[]) {
  const issues: string[] = []
  let isValid = true

  // Filter out invalid nodes
  const validNodes = nodes.filter((node) => {
    if (!node || !node.id || typeof node.id !== "string") {
      issues.push("Found a node with an invalid or missing ID. This node will be skipped.")
      return false
    }
    return true
  })

  // Filter out invalid edges
  const validEdges = edges.filter((edge) => {
    if (!edge || !edge.source || !edge.target || typeof edge.source !== "string" || typeof edge.target !== "string") {
      issues.push("Found an edge with invalid source or target. This edge will be skipped.")
      return false
    }
    return true
  })

  // Find the start node
  const startNode = validNodes.find((node) => node.data?.isStart === true || node.type === "greetingNode")
  if (!startNode) {
    issues.push("No start node found. Please add a greeting node to begin your pathway.")
    isValid = false
  }

  // Find end call nodes
  const endNodes = validNodes.filter((node) => node.type === "endCallNode")
  if (endNodes.length === 0) {
    issues.push("No end call node found. Please add at least one end call node to complete your pathway.")
    isValid = false
  }

  // Check for path from start to end
  if (startNode && endNodes.length > 0) {
    const reachableNodes = findReachableNodes(startNode.id, validNodes, validEdges)
    const canReachEnd = endNodes.some((node) => reachableNodes.has(node.id))

    if (!canReachEnd) {
      issues.push(
        "No complete path from start to end. Please ensure there's at least one path from the greeting to an end call node.",
      )
      isValid = false
    }
  }

  // Check conditional nodes for both branches
  const conditionalNodes = validNodes.filter((node) => node.type === "conditionalNode")
  conditionalNodes.forEach((node) => {
    const outgoingEdges = validEdges.filter((edge) => edge.source === node.id)
    const hasTrueBranch = outgoingEdges.some((edge) => edge.sourceHandle === "true")
    const hasFalseBranch = outgoingEdges.some((edge) => edge.sourceHandle === "false")

    if (!hasTrueBranch && !hasFalseBranch) {
      issues.push(
        `Conditional node "${node.data?.text || node.id}" has no outgoing connections. Please connect both true and false paths.`,
      )
      isValid = false
    } else if (!hasTrueBranch) {
      issues.push(
        `Conditional node "${node.data?.text || node.id}" is missing the true path. Please connect the true (Age <= 65) path.`,
      )
      isValid = false
    } else if (!hasFalseBranch) {
      issues.push(
        `Conditional node "${node.data?.text || node.id}" is missing the false path. Please connect the false (Age > 65) path.`,
      )
      isValid = false
    }
  })

  // Check for orphaned nodes (no incoming or outgoing connections)
  validNodes.forEach((node) => {
    // Skip checking the start node for incoming connections
    const isStartNode = startNode && node.id === startNode.id

    const hasIncoming = isStartNode || validEdges.some((edge) => edge.target === node.id)
    const hasOutgoing = validEdges.some((edge) => edge.source === node.id)

    // End nodes don't need outgoing connections
    const isEndNode = node.type === "endCallNode"

    if (!hasIncoming && !hasOutgoing) {
      issues.push(
        `Node "${node.data?.text || node.id}" is orphaned (no connections). Please connect it to the pathway or remove it.`,
      )
      isValid = false
    } else if (!hasIncoming && !isStartNode) {
      issues.push(`Node "${node.data?.text || node.id}" has no incoming connections. Please connect it to the pathway.`)
      isValid = false
    } else if (!hasOutgoing && !isEndNode) {
      issues.push(
        `Node "${node.data?.text || node.id}" has no outgoing connections. Please connect it to another node.`,
      )
      isValid = false
    }
  })

  // Check for missing text fields and provide fallbacks
  const nodesWithFallbacks = validNodes.map((node) => {
    // Deep clone the node to avoid modifying the original
    const nodeCopy = JSON.parse(JSON.stringify(node))

    // Add fallback text based on node type
    if (!nodeCopy.data?.text) {
      switch (nodeCopy.type) {
        case "greetingNode":
          nodeCopy.data = nodeCopy.data || {}
          nodeCopy.data.text = "Hello! This is an AI assistant calling. How are you today?"
          issues.push(`Added fallback text to greeting node ${nodeCopy.id}`)
          break
        case "questionNode":
          nodeCopy.data = nodeCopy.data || {}
          nodeCopy.data.text = "What can I help you with today?"
          issues.push(`Added fallback text to question node ${nodeCopy.id}`)
          break
        case "responseNode":
          nodeCopy.data = nodeCopy.data || {}
          nodeCopy.data.text = "I understand. Let me help you with that."
          issues.push(`Added fallback text to response node ${nodeCopy.id}`)
          break
        case "conditionalNode":
          nodeCopy.data = nodeCopy.data || {}
          nodeCopy.data.text = "if (Age <= 65) { True } else { False }"
          issues.push(`Added fallback text to conditional node ${nodeCopy.id}`)
          break
        case "endCallNode":
          nodeCopy.data = nodeCopy.data || {}
          nodeCopy.data.text = "Thank you for your time. Goodbye!"
          issues.push(`Added fallback text to end call node ${nodeCopy.id}`)
          break
        case "transferNode":
          nodeCopy.data = nodeCopy.data || {}
          nodeCopy.data.text = "Transferring your call now..."
          issues.push(`Added fallback text to transfer node ${nodeCopy.id}`)
          break
        case "webhookNode":
          nodeCopy.data = nodeCopy.data || {}
          nodeCopy.data.text = "Processing your information..."
          issues.push(`Added fallback text to webhook node ${nodeCopy.id}`)
          break
        default:
          nodeCopy.data = nodeCopy.data || {}
          nodeCopy.data.text = "Processing your request..."
          issues.push(`Added fallback text to node ${nodeCopy.id}`)
      }
    }

    return nodeCopy
  })

  // Check for Age extractVar in start node
  if (startNode && (!startNode.data?.extractVars || !startNode.data.extractVars.some((v: any) => v[0] === "Age"))) {
    issues.push("Start node is missing Age extraction. Adding extractVars for Age.")
    // Note: We don't modify the original nodes here, just flag the issue
  }

  return {
    isValid,
    issues,
    nodesWithFallbacks,
    edges: validEdges,
  }
}

/**
 * Helper function to find all nodes reachable from a given start node
 */
function findReachableNodes(startNodeId: string, nodes: any[], edges: any[]): Set<string> {
  const reachable = new Set<string>()
  const queue: string[] = [startNodeId]

  while (queue.length > 0) {
    const currentNodeId = queue.shift()!

    if (reachable.has(currentNodeId)) continue
    reachable.add(currentNodeId)

    // Find all outgoing edges from this node
    const outgoingEdges = edges.filter((edge) => edge.source === currentNodeId)

    // Add all target nodes to the queue
    outgoingEdges.forEach((edge) => {
      if (!reachable.has(edge.target)) {
        queue.push(edge.target)
      }
    })
  }

  return reachable
}
