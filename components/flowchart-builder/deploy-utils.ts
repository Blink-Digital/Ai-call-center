import { validatePathway } from "./validate-pathway"

export function preparePathwayForDeployment(flowchart: any) {
  if (!flowchart || !flowchart.nodes || !Array.isArray(flowchart.nodes)) {
    console.warn("Invalid flowchart structure:", flowchart)
    return {
      name: "Invalid Flowchart",
      description: "The flowchart structure is invalid",
      nodes: [],
      edges: [],
      validationResult: {
        isValid: false,
        issues: ["Invalid flowchart structure. Please create a valid flowchart."],
      },
    }
  }

  const { nodes: reactFlowNodes, edges: reactFlowEdges } = flowchart
  const validNodes = reactFlowNodes.filter((node: any) => node && node.id && typeof node.id === "string")
  const validEdges = Array.isArray(reactFlowEdges)
    ? reactFlowEdges.filter(
        (edge: any) =>
          edge && edge.source && edge.target && typeof edge.source === "string" && typeof edge.target === "string",
      )
    : []

  const startNodeId = findStartNodeId(validNodes, validEdges)
  const validationResult = validatePathway(validNodes, validEdges)
  const nodesToUse = validationResult.isValid ? validNodes : validationResult.nodesWithFallbacks

  // Use the exact same conversion logic as the preview JSON
  const blandFormat = convertFlowchartToBlandFormat(nodesToUse, validationResult.edges, startNodeId)

  console.log("[DEPLOY-UTILS] Bland format from conversion:", blandFormat)
  console.log(
    "[DEPLOY-UTILS] Start nodes found:",
    blandFormat.nodes.filter((n) => n.data && n.data.isStart),
  )

  return {
    name: flowchart.name || "Bland.ai Pathway",
    description: flowchart.description || `Pathway created on ${new Date().toISOString()}`,
    nodes: blandFormat.nodes,
    edges: blandFormat.edges,
    validationResult,
  }
}

function findStartNodeId(nodes: any[], edges: any[]): string | null {
  const validNodes = nodes.filter((node) => node && node.id && typeof node.id === "string")
  if (validNodes.length === 0) return null
  const startNode = validNodes.find((node) => node.data?.isStart === true)
  if (startNode) return startNode.id
  const greetingNode = validNodes.find((node) => node.type === "greetingNode")
  if (greetingNode) return greetingNode.id
  const validEdges = edges.filter((edge) => edge && edge.target && typeof edge.target === "string")
  const nodesWithIncomingEdges = new Set(validEdges.map((edge) => edge.target))
  const startNodes = validNodes.filter((node) => !nodesWithIncomingEdges.has(node.id))
  return startNodes.length > 0 ? startNodes[0].id : validNodes[0]?.id || null
}

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

// Updated function to parse conditional expressions with any variable
function parseConditionExpression(text: string) {
  // More flexible regex that captures any variable name, not just "Age"
  const pattern = /if\s*$$\s*([a-zA-Z0-9_]+)\s*([<>=!]=?)\s*([^\s$$]+)\s*\)\s*\{/
  const match = text.match(pattern)
  if (!match) return null

  const [, variable, operator, value] = match

  // Create the true label using the actual variable name
  const trueLabel = `${variable}${operator}${value}`

  // Create the false label by inverting the operator for the actual variable
  const falseLabel =
    operator === "<="
      ? `${variable}>${value}`
      : operator === ">="
        ? `${variable}<${value}`
        : operator === "<"
          ? `${variable}>=${value}`
          : operator === ">"
            ? `${variable}<=${value}`
            : operator === "=="
              ? `${variable}!=${value}`
              : operator === "!="
                ? `${variable}==${value}`
                : "Else"

  return { variable, operator, value, trueLabel, falseLabel }
}

function convertFlowchartToBlandFormat(reactFlowNodes: any[], reactFlowEdges: any[], startNodeId: string | null) {
  const blandNodes: any[] = []
  const blandEdges: any[] = []
  const nodesToSkip = new Set()
  const extractedVars = new Set(["Age"]) // Default to Age, but we'll add more as we find them
  const nodeConnections = new Map()

  // Filter out invalid nodes and edges
  const validNodes = reactFlowNodes.filter((node: any) => node && node.id && typeof node.id === "string")
  const validEdges = reactFlowEdges.filter(
    (edge: any) =>
      edge && edge.source && edge.target && typeof edge.source === "string" && typeof edge.target === "string",
  )

  // Find extracted vars from start node
  const startNode = validNodes.find((n) => n.id === startNodeId)
  if (startNode && startNode.data?.extractVariables) {
    startNode.data.extractVariables.forEach((varName: string) => extractedVars.add(varName))
  }

  // First pass: identify customer response nodes and their variables
  validNodes.forEach((node) => {
    if (node.type === "customerResponseNode" && node.data?.variableName) {
      extractedVars.add(node.data.variableName)
    }

    // Add this section to collect variables from Response nodes
    if (node.type === "responseNode" && node.data?.extractVariables && Array.isArray(node.data.extractVariables)) {
      node.data.extractVariables.forEach((variable: string) => {
        extractedVars.add(variable)
      })
    }
  })

  // Map conditional node → parsed expression
  const conditionalMap = new Map()

  // Second pass: identify conditional nodes and their conditions
  validNodes.forEach((node) => {
    if (node.type === "conditionalNode") {
      // Get the condition text from the appropriate field
      const conditionText = node.data?.condition || node.data?.text || "if (Age <= 65) { True } else { False }"

      // Parse the condition to extract variable, operator, and value
      const parsed = parseConditionExpression(conditionText)

      if (parsed) {
        // Add the variable to our set of extracted variables
        extractedVars.add(parsed.variable)

        // Store the parsed condition for this node
        conditionalMap.set(node.id, parsed)
        nodesToSkip.add(node.id) // We'll remove this node later
      }
    }

    // Skip customer response nodes for variables that are already extracted
    if (node.type === "customerResponseNode") {
      const variableName =
        node.data?.variableName ||
        (node.data?.options && node.data.options[0]) ||
        (node.data?.responses && node.data.responses[0])

      if (variableName && extractedVars.has(variableName)) {
        console.log(`Skipping customer response node for already extracted variable: ${variableName}`)
        nodesToSkip.add(node.id)
      }
    }
  })

  // Update the section where we rewrite edges that connect through conditional node
  validEdges.forEach((edge) => {
    const sourceCondNode = conditionalMap.get(edge.source)
    if (sourceCondNode) {
      const isTrue = edge.sourceHandle === "true"

      // Use the actual parsed variable and condition from the conditional node
      const label = isTrue ? sourceCondNode.trueLabel : sourceCondNode.falseLabel

      const targetId = edge.target.replace(/[^a-zA-Z0-9_]/g, "_")
      const sourceId = startNodeId?.replace(/[^a-zA-Z0-9_]/g, "_") || ""

      if (sourceId) {
        // Store this connection to create later
        if (!nodeConnections.has(sourceId)) {
          nodeConnections.set(sourceId, [])
        }

        nodeConnections.get(sourceId).push({
          targetId,
          condition: label,
          description: `Condition: ${label}`,
          edgeId: `edge_${sourceId}_${label.replace(/[^a-zA-Z0-9]/g, "_")}_to_${targetId}`,
        })

        console.log(`Created direct edge from start node to ${targetId} with condition: ${label}`)
      }
    }
  })

  // Process nodes - Initialize all with data.isStart: false
  validNodes.forEach((node, index) => {
    if (nodesToSkip.has(node.id)) {
      return
    }

    const nodeId = node.id.replace(/[^a-zA-Z0-9_]/g, "_")
    const text = node.data?.text || node.data?.intentDescription || node.data?.description || `Node ${index + 1}`

    if (node.type === "transferNode") {
      blandNodes.push({
        id: nodeId,
        type: "Transfer Call",
        data: {
          name: "Transfer Call",
          text,
          transferNumber: node.data?.transferNumber || "+18445940353",
          warmTransferFields: {
            isEnabled: node.data?.transferType === "warm",
            userHandling: "on-hold",
            optimizeForIVR: true,
          },
          modelOptions: { modelType: "smart", temperature: 0.2 },
          isStart: false, // Initialize inside data object
        },
      })
    } else if (node.type === "endCallNode") {
      blandNodes.push({
        id: nodeId,
        type: "End Call",
        data: {
          name: "End Call",
          prompt: text,
          modelOptions: { modelType: "smart", temperature: 0.2 },
          isStart: false, // Initialize inside data object
        },
      })
    } else if (node.type === "webhookNode") {
      blandNodes.push({
        id: nodeId,
        type: "Webhook",
        data: {
          name: node.data?.name || `Webhook ${index + 1}`,
          text: text || `Webhook ${index + 1}`,
          url: node.data?.url || "https://example.com",
          method: node.data?.method || "POST",
          body: node.data?.body || "{}",
          extractVars: node.data?.extractVars || [
            ["response", "string", "The response from the webhook"],
            ["status", "number", "The HTTP status code"],
          ],
          isStart: false, // Initialize inside data object
        },
      })
    } else {
      const nodeType = mapNodeTypeToBlandType(node.type)
      const nodeData: any = {
        name: node.type,
        text,
        modelOptions: {
          modelType: "smart",
          temperature: 0.2,
        },
        isStart: false, // Initialize inside data object
      }

      // Create the node object
      const blandNode = {
        id: nodeId,
        type: nodeType,
        data: nodeData,
      }

      blandNodes.push(blandNode)
    }
  })

  // CRITICAL: Apply start node selection logic with isStart INSIDE data object
  let startNodeSelected = false
  let selectedStartNodeId = null

  // Priority 1: Look for a node with type "greetingNode"
  for (let i = 0; i < validNodes.length; i++) {
    const originalNode = validNodes[i]
    if (originalNode.type === "greetingNode") {
      const correspondingBlandNode = blandNodes.find((bn) => bn.id === originalNode.id.replace(/[^a-zA-Z0-9_]/g, "_"))
      if (correspondingBlandNode) {
        correspondingBlandNode.data.isStart = true // Set inside data object
        correspondingBlandNode.data.name = "Start" // Set name to Start for start node
        correspondingBlandNode.data.modelOptions = {
          ...correspondingBlandNode.data.modelOptions,
          isSMSReturnNode: false,
          skipUserResponse: false,
          disableEndCallTool: false,
          block_interruptions: false,
          disableSilenceRepeat: false,
        }

        // Add extractVars to the start node
        correspondingBlandNode.data.extractVars = Array.from(extractedVars).map((variable) => {
          let type = "string"
          if (variable === "Age") type = "integer"
          if (variable === "Zip") type = "integer"
          return [variable, type, `Extract the ${variable.toLowerCase()}`, false]
        })
        correspondingBlandNode.data.extractVarSettings = {}

        startNodeSelected = true
        selectedStartNodeId = correspondingBlandNode.id
        console.log(`[DEPLOY-UTILS START NODE] Priority 1: Selected greetingNode as start: ${selectedStartNodeId}`)
        break
      }
    }
  }

  // Priority 2: If no greetingNode found, look for node with label "Start" or name "Start"
  if (!startNodeSelected) {
    for (let i = 0; i < validNodes.length; i++) {
      const originalNode = validNodes[i]
      if (originalNode.data?.label === "Start" || originalNode.data?.name === "Start") {
        const correspondingBlandNode = blandNodes.find((bn) => bn.id === originalNode.id.replace(/[^a-zA-Z0-9_]/g, "_"))
        if (correspondingBlandNode) {
          correspondingBlandNode.data.isStart = true // Set inside data object
          correspondingBlandNode.data.name = "Start"
          correspondingBlandNode.data.modelOptions = {
            ...correspondingBlandNode.data.modelOptions,
            isSMSReturnNode: false,
            skipUserResponse: false,
            disableEndCallTool: false,
            block_interruptions: false,
            disableSilenceRepeat: false,
          }

          // Add extractVars to the start node
          correspondingBlandNode.data.extractVars = Array.from(extractedVars).map((variable) => {
            let type = "string"
            if (variable === "Age") type = "integer"
            if (variable === "Zip") type = "integer"
            return [variable, type, `Extract the ${variable.toLowerCase()}`, false]
          })
          correspondingBlandNode.data.extractVarSettings = {}

          startNodeSelected = true
          selectedStartNodeId = correspondingBlandNode.id
          console.log(
            `[DEPLOY-UTILS START NODE] Priority 2: Selected node with Start label/name as start: ${selectedStartNodeId}`,
          )
          break
        }
      }
    }
  }

  // Priority 3: Fallback to the first node in the array
  if (!startNodeSelected && blandNodes.length > 0) {
    blandNodes[0].data.isStart = true // Set inside data object
    blandNodes[0].data.name = "Start"
    blandNodes[0].data.modelOptions = {
      ...blandNodes[0].data.modelOptions,
      isSMSReturnNode: false,
      skipUserResponse: false,
      disableEndCallTool: false,
      block_interruptions: false,
      disableSilenceRepeat: false,
    }

    // Add extractVars to the start node
    blandNodes[0].data.extractVars = Array.from(extractedVars).map((variable) => {
      let type = "string"
      if (variable === "Age") type = "integer"
      if (variable === "Zip") type = "integer"
      return [variable, type, `Extract the ${variable.toLowerCase()}`, false]
    })
    blandNodes[0].data.extractVarSettings = {}

    startNodeSelected = true
    selectedStartNodeId = blandNodes[0].id
    console.log(`[DEPLOY-UTILS START NODE] Priority 3: Fallback to first node as start: ${selectedStartNodeId}`)
  }

  // SAFETY CHECK: Ensure all other nodes explicitly have data.isStart: false
  blandNodes.forEach((node) => {
    if (node.id !== selectedStartNodeId) {
      node.data.isStart = false
    }
  })

  // FINAL ENFORCEMENT: Ensure exactly one node has data.isStart: true
  const startNodes = blandNodes.filter((n) => n.data && n.data.isStart === true)

  if (startNodes.length === 0 && blandNodes.length > 0) {
    // Forcefully assign the first Greeting node or fallback to first node
    const greetingNode = blandNodes.find((n) => n.type === "Default" && n.data?.text?.toLowerCase()?.includes("hello"))
    if (greetingNode) {
      greetingNode.data.isStart = true
      console.warn("[DEPLOY-UTILS FIXED] No start node found. Assigned Greeting node as isStart:", greetingNode.id)
    } else {
      blandNodes[0].data.isStart = true
      console.warn("[DEPLOY-UTILS FIXED] No start node found. Fallback to first node:", blandNodes[0].id)
    }
  } else if (startNodes.length > 1) {
    // More than one node marked as start — keep only the first
    startNodes.forEach((node, index) => {
      node.data.isStart = index === 0
    })
    console.warn("[DEPLOY-UTILS FIXED] Multiple start nodes detected. Only the first one kept as isStart.")
  }

  // Final sanity check log
  console.log(
    "✅ [DEPLOY-UTILS] Final nodes before deploy:",
    blandNodes.map((n) => ({ id: n.id, type: n.type, isStart: n.data?.isStart })),
  )

  // Process regular edges (not involving skipped nodes)
  validEdges.forEach((edge, index) => {
    if (nodesToSkip.has(edge.source) || nodesToSkip.has(edge.target)) {
      return
    }

    const sourceId = edge.source.replace(/[^a-zA-Z0-9_]/g, "_")
    const targetId = edge.target.replace(/[^a-zA-Z0-9_]/g, "_")

    // Improved label handling for customer response nodes
    let label = "next"

    // First check if the edge has a data.label property
    if (edge.data?.label) {
      label = edge.data.label
    }
    // Then check if it has a direct label property
    else if (edge.label) {
      label = edge.label
    }
    // Finally, check if it's from a customer response node with a sourceHandle
    else if (edge.sourceHandle && edge.sourceHandle.startsWith("response-")) {
      // Find the source node
      const sourceNode = validNodes.find((n) => n.id === edge.source)
      if (sourceNode && sourceNode.type === "customerResponseNode") {
        const responseIndex = Number.parseInt(edge.sourceHandle.split("-")[1], 10)
        const options = sourceNode.data?.options || sourceNode.data?.responses || []
        if (options.length > responseIndex) {
          label = options[responseIndex]
        }
      }
    }

    // Create edge using Bland.ai format with direct label property
    blandEdges.push({
      id: `edge_${sourceId}_${targetId}_${index}`,
      source: sourceId,
      target: targetId,
      label: label,
    })
  })

  // And update the section where we add direct edges from start node to targets
  nodeConnections.forEach((targets, sourceId) => {
    targets.forEach((target) => {
      // Only add if this connection doesn't already exist
      if (!blandEdges.some((e) => e.source === sourceId && e.target === target.targetId)) {
        blandEdges.push({
          id:
            target.edgeId || `edge_${sourceId}_${target.condition.replace(/[^a-zA-Z0-9]/g, "_")}_to_${target.targetId}`,
          source: sourceId,
          target: target.targetId,
          label: target.condition, // Direct label property as per Bland.ai format
        })
      }
    })
  })

  // Ensure we have at least one Default node and one End Call node
  const hasDefaultNode = blandNodes.some((node: any) => node.type === "Default")
  const hasEndCallNode = blandNodes.some((node: any) => node.type === "End Call")

  // If no Default node, add one
  if (!hasDefaultNode) {
    const defaultNode = {
      id: "default_node",
      type: "Default",
      data: {
        name: !startNodeSelected ? "Start" : "Default",
        text: "Hello! This is the start of your conversation.",
        isStart: !startNodeSelected, // isStart inside data object
        extractVars: Array.from(extractedVars).map((variable) => {
          let type = "string"
          if (variable === "Age") type = "integer"
          if (variable === "Zip") type = "integer"
          return [variable, type, `Extract the ${variable.toLowerCase()}`, false]
        }),
        extractVarSettings: {},
        modelOptions: {
          modelType: "smart",
          temperature: 0.2,
          isSMSReturnNode: false,
          skipUserResponse: false,
          disableEndCallTool: false,
          block_interruptions: false,
          disableSilenceRepeat: false,
        },
      },
    }
    blandNodes.push(defaultNode)
    if (!startNodeSelected) {
      selectedStartNodeId = defaultNode.id
      startNodeSelected = true
      console.log(`[DEPLOY-UTILS START NODE] Added default node as start: ${selectedStartNodeId}`)
    }
  }

  // If no End Call node, add one
  if (!hasEndCallNode) {
    const endCallNode = {
      id: "end_call_node",
      type: "End Call",
      data: {
        name: "End Call",
        prompt: "Thank you for your time. Goodbye!",
        isStart: false, // isStart inside data object
        modelOptions: {
          modelType: "smart",
          temperature: 0.2,
        },
      },
    }
    blandNodes.push(endCallNode)
  }

  // Ensure there's at least one edge connecting nodes
  if (blandEdges.length === 0 && blandNodes.length >= 2) {
    const defaultNodeId = blandNodes.find((node: any) => node.type === "Default")?.id
    const endCallNodeId = blandNodes.find((node: any) => node.type === "End Call")?.id

    if (defaultNodeId && endCallNodeId) {
      blandEdges.push({
        id: `edge_${defaultNodeId}_${endCallNodeId}_0`,
        source: defaultNodeId,
        target: endCallNodeId,
        label: "next",
      })
    }
  }

  // Add the global config node
  blandNodes.push({
    globalConfig: { globalPrompt: "" },
  })

  console.log(
    "[DEPLOY-UTILS FINAL START NODE STATUS]:",
    blandNodes.filter((n) => n.id).map((n) => ({ id: n.id, type: n.type, isStart: n.data?.isStart })),
  )
  return { nodes: blandNodes, edges: blandEdges }
}
