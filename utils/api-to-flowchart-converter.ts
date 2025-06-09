import type { Node, Edge } from "reactflow"
import {
  defaultNodeText,
  defaultResponseOptions,
  defaultVariable,
  getVariableTypeByName,
} from "@/config/flowchart-defaults"

/**
 * Converts the API response JSON to a format compatible with our flowchart builder
 */
export function convertApiResponseToFlowchart(apiResponse: any) {
  if (!apiResponse || !apiResponse.nodes || !Array.isArray(apiResponse.nodes)) {
    throw new Error("Invalid API response: Missing or invalid nodes array")
  }

  if (!apiResponse.edges || !Array.isArray(apiResponse.edges)) {
    throw new Error("Invalid API response: Missing or invalid edges array")
  }

  // Create a deep copy of the API response to avoid modifying the original
  const processedResponse = JSON.parse(JSON.stringify(apiResponse))

  // Pre-process the response to fix common issues
  const fixedResponse = preProcessApiResponse(processedResponse)

  const { nodes: apiNodes, edges: apiEdges } = fixedResponse

  // Initial position variables for layout
  const xPos = 50
  const yPos = 50
  const xOffset = 300
  const yOffset = 150

  // Extract variables from the API response
  const extractedVariables = new Set<string>()

  // First pass to collect all variables
  apiNodes.forEach((node: any) => {
    if (node.data && node.data.extractVars && Array.isArray(node.data.extractVars)) {
      node.data.extractVars.forEach((varArray: any[]) => {
        if (varArray && varArray.length > 0 && typeof varArray[0] === "string") {
          extractedVariables.add(varArray[0])
        }
      })
    }

    // Also check for variableName in customer-response nodes
    if (
      node.type === "customer-response" &&
      node.data &&
      node.data.variableName &&
      typeof node.data.variableName === "string"
    ) {
      extractedVariables.add(node.data.variableName)
    }
  })

  // Convert nodes
  const reactFlowNodes: Node[] = apiNodes.map((node: any, index: number) => {
    // Ensure node has required properties
    if (!node.id) {
      node.id = `node_${index}`
    }

    if (!node.type) {
      node.type = "Default" // Default to Default node
    }

    if (!node.data) {
      node.data = {}
    }

    // Map API node types to our flowchart node types
    const nodeType = mapApiNodeTypeToFlowchartType(node.type)

    // Create position based on index (simple grid layout)
    const position = node.position || {
      x: xPos + (index % 3) * xOffset,
      y: yPos + Math.floor(index / 3) * yOffset,
    }

    // Create the node data based on the node type
    let nodeData: any = {
      text: node.data.text || node.data.prompt || getDefaultTextForNodeType(nodeType),
    }

    // Add type-specific data
    switch (nodeType) {
      case "greetingNode":
        // Ensure no hardcoded variables in greeting node
        nodeData = {
          ...nodeData,
          extractVars: node.data.extractVars || [],
        }
        break
      case "webhookNode":
        nodeData = {
          ...nodeData,
          url: node.data.url || "https://example.com/webhook",
          method: node.data.method || "POST",
          body: node.data.body || "{}",
          extractVars: node.data.extractVars || [],
        }
        break
      case "transferNode":
        nodeData = {
          ...nodeData,
          transferNumber: node.data.transferNumber || "+1234567890",
          phoneNumber: node.data.transferNumber || "+1234567890", // For compatibility
          transferType: node.data.transferType || "warm",
        }
        break
      case "customerResponseNode":
        // Extract response options from node data or edges
        const responseOptions = node.data.responses || node.data.options || defaultResponseOptions

        // Determine variable name from context
        let variableName = ""

        // If this node has a variableName, use it
        if (node.data.variableName) {
          variableName = node.data.variableName
        }
        // If this node has extractVars, use the first one
        else if (node.data.extractVars && Array.isArray(node.data.extractVars) && node.data.extractVars.length > 0) {
          variableName = node.data.extractVars[0][0]
        }
        // Otherwise, use the first response option if it looks like a variable
        else if (responseOptions.length > 0 && isLikelyVariable(responseOptions[0])) {
          variableName = responseOptions[0]
        }
        // Otherwise, use the default variable
        else {
          variableName = defaultVariable.name
        }

        // Ensure we have at least two options for Yes/No questions
        if (
          responseOptions.length < 2 &&
          (variableName.toLowerCase().includes("status") || variableName.toLowerCase() === "response")
        ) {
          console.log("Adding default Yes/No options to customer response node")
          responseOptions.push("Yes", "No")
        }

        nodeData = {
          ...nodeData,
          responses: responseOptions,
          options: responseOptions,
          isOpenEnded: node.data.isOpenEnded || false,
          intentDescription: node.data.text || node.data.intentDescription || "Capture customer response",
          variableName: variableName,
          variableType: getVariableTypeByName(variableName),
          variableDescription: `Extract the ${variableName.toLowerCase()}`,
        }
        break
    }

    return {
      id: node.id,
      type: nodeType,
      position,
      data: nodeData,
    }
  })

  // Convert edges
  const reactFlowEdges: Edge[] = apiEdges.map((edge: any, index: number) => {
    // Ensure edge has required properties
    if (!edge.source || !edge.target) {
      throw new Error(`Edge at index ${index} is missing source or target`)
    }

    // Find source and target nodes
    const sourceNode = reactFlowNodes.find((n) => n.id === edge.source)
    const targetNode = reactFlowNodes.find((n) => n.id === edge.target)

    if (!sourceNode || !targetNode) {
      throw new Error(`Edge ${edge.id || index} references non-existent node(s)`)
    }

    // Determine source handle for customer response nodes
    let sourceHandle = undefined
    if (sourceNode.type === "customerResponseNode") {
      const responseOptions = sourceNode.data.options || sourceNode.data.responses || []

      // Look for a match between the edge label and response options
      let responseIndex = -1

      if (edge.label) {
        // Try to find the exact match first
        responseIndex = responseOptions.findIndex((option: string) => option === edge.label)

        // If not found, try to find a match with "User responded " prefix
        if (responseIndex === -1 && edge.label.startsWith("User responded ")) {
          const responseText = edge.label.replace("User responded ", "")
          responseIndex = responseOptions.findIndex((option: string) => option === responseText)
        }
      }

      // If we found a match, set the sourceHandle
      if (responseIndex >= 0) {
        sourceHandle = `response-${responseIndex}`
      }
    }

    // Create the edge with the label from the API response
    return {
      id: edge.id || `edge-${index}`,
      source: edge.source,
      target: edge.target,
      sourceHandle,
      type: "custom",
      data: {
        label: edge.label || "next",
      },
    }
  })

  return {
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
  }
}

/**
 * Pre-process the API response to fix common issues
 */
function preProcessApiResponse(apiResponse: any) {
  const { nodes, edges } = apiResponse

  // Step 1: Convert conditional nodes to customer response nodes
  convertConditionalToCustomerResponse(nodes, edges)

  // Step 2: Merge separate Yes/No response nodes into customer response nodes
  mergeYesNoResponseNodes(nodes, edges)

  // Step 3: Convert age-related questions to use customer response nodes with numeric options
  convertAgeQuestionsToCustomerResponse(nodes, edges)

  // Step 4: Convert response nodes followed by conditional nodes to customer response nodes
  convertResponseFollowedByConditional(nodes, edges)

  // Step 5: Convert AI Response nodes after questions to Customer Response nodes
  convertAIResponseAfterQuestions(nodes, edges)

  // Step 6: Convert question nodes that should have Yes/No responses
  convertQuestionsToYesNoResponses(nodes, edges)

  // Step 7: Validate and fix customer response nodes
  validateAndFixCustomerResponseNodes(nodes, edges)

  return apiResponse
}

/**
 * Validate and fix customer response nodes
 */
function validateAndFixCustomerResponseNodes(nodes: any[], edges: any[]) {
  // Find all customer response nodes
  const customerResponseNodes = nodes.filter(
    (node) =>
      node.type === "customer-response" ||
      node.type.toLowerCase().includes("customer") ||
      node.type.toLowerCase().includes("user-response"),
  )

  // Process each customer response node
  for (const node of customerResponseNodes) {
    console.log("Validating customer response node:", node.id)

    // Ensure node has data object
    if (!node.data) {
      node.data = {}
      console.log("Added missing data object to customer response node")
    }

    // Ensure node has options array
    if (!node.data.options || !Array.isArray(node.data.options) || node.data.options.length === 0) {
      // Try to use responses array if available
      if (node.data.responses && Array.isArray(node.data.responses) && node.data.responses.length > 0) {
        node.data.options = [...node.data.responses]
        console.log("Copied responses to options in customer response node")
      } else {
        // Default to Yes/No options
        node.data.options = ["Yes", "No"]
        console.log("Added default Yes/No options to customer response node")
      }
    }

    // Ensure node has responses array (for backward compatibility)
    if (!node.data.responses || !Array.isArray(node.data.responses) || node.data.responses.length === 0) {
      node.data.responses = [...node.data.options]
      console.log("Copied options to responses in customer response node")
    }

    // Ensure node has variableName
    if (!node.data.variableName) {
      // Try to determine a variable name based on the node content
      let variableName = "response"

      // Check if this is an age question
      if (
        node.data.text &&
        (node.data.text.toLowerCase().includes("age") ||
          node.data.text.toLowerCase().includes("old") ||
          node.data.text.toLowerCase().includes("years"))
      ) {
        variableName = "age"
      }
      // Check if this is a Medicare question
      else if (node.data.text && node.data.text.toLowerCase().includes("medicare")) {
        variableName = "medicare_status"
      }
      // Check if this is a name question
      else if (node.data.text && node.data.text.toLowerCase().includes("name")) {
        variableName = "name"
      }

      node.data.variableName = variableName
      console.log(`Added variableName "${variableName}" to customer response node`)
    }

    // Ensure node has text
    if (!node.data.text) {
      node.data.text = "Waiting for customer response"
      console.log("Added default text to customer response node")
    }

    // Check if this node has outgoing edges for each option
    const outgoingEdges = edges.filter((edge) => edge.source === node.id)
    const options = node.data.options || []

    // If there are no outgoing edges, try to find the next node and create edges
    if (outgoingEdges.length === 0 && options.length > 0) {
      console.log("No outgoing edges found for customer response node, trying to create them")

      // Find the next node in the sequence
      const nodeIndex = nodes.findIndex((n) => n.id === node.id)
      if (nodeIndex >= 0 && nodeIndex < nodes.length - 1) {
        const nextNode = nodes[nodeIndex + 1]

        // Create an edge for each option
        options.forEach((option, index) => {
          const edgeId = `edge_${node.id}_${nextNode.id}_${option}`
          edges.push({
            id: edgeId,
            source: node.id,
            target: nextNode.id,
            label: option,
          })
          console.log(`Created edge from customer response node to next node with label "${option}"`)
        })
      }
    }
    // If there are fewer outgoing edges than options, create edges for the missing options
    else if (outgoingEdges.length < options.length) {
      console.log("Fewer outgoing edges than options in customer response node")

      // Find options that don't have edges
      const edgeLabels = outgoingEdges.map((edge) => edge.label)
      const missingOptions = options.filter((option) => !edgeLabels.includes(option))

      // If there are missing options and at least one outgoing edge, duplicate the first edge for the missing options
      if (missingOptions.length > 0 && outgoingEdges.length > 0) {
        const templateEdge = outgoingEdges[0]

        missingOptions.forEach((option) => {
          const edgeId = `edge_${node.id}_${templateEdge.target}_${option}`
          edges.push({
            id: edgeId,
            source: node.id,
            target: templateEdge.target,
            label: option,
          })
          console.log(`Created edge from customer response node to target node with label "${option}"`)
        })
      }
    }
  }
}

/**
 * Convert response nodes followed by conditional nodes to customer response nodes
 * This is a new function to specifically address the issue mentioned by the user
 */
function convertResponseFollowedByConditional(nodes: any[], edges: any[]) {
  // Find all response nodes
  const responseNodes = nodes.filter(
    (node) =>
      node.type === "response" ||
      node.type === "AI Response" ||
      (node.type.toLowerCase().includes("response") && !node.type.toLowerCase().includes("customer")),
  )

  // Process each response node
  for (const responseNode of responseNodes) {
    // Find outgoing edges from this response node
    const outgoingEdges = edges.filter((edge) => edge.source === responseNode.id)

    // Skip if there are no outgoing edges
    if (outgoingEdges.length === 0) continue

    // Get target nodes
    const targetNodeIds = outgoingEdges.map((edge) => edge.target)
    const targetNodes = nodes.filter((node) => targetNodeIds.includes(node.id))

    // Check if any target is a conditional node
    const conditionalNode = targetNodes.find(
      (node) =>
        node.type === "conditional" ||
        node.type.toLowerCase().includes("condition") ||
        node.type.toLowerCase().includes("if"),
    )

    if (conditionalNode) {
      console.log("Converting response node followed by conditional to customer response node")

      // Find incoming edges to the response node
      const incomingEdges = edges.filter((edge) => edge.target === responseNode.id)

      // Skip if there are no incoming edges
      if (incomingEdges.length === 0) continue

      // Get the source node (usually a question)
      const sourceNodeId = incomingEdges[0].source
      const sourceNode = nodes.find((node) => node.id === sourceNodeId)

      // Skip if source node doesn't exist
      if (!sourceNode) continue

      // Determine if this is a yes/no question based on the source node text
      const isYesNoQuestion =
        sourceNode.data?.text?.toLowerCase().includes("are you") ||
        sourceNode.data?.text?.toLowerCase().includes("do you") ||
        sourceNode.data?.text?.toLowerCase().includes("have you") ||
        sourceNode.data?.text?.toLowerCase().includes("would you") ||
        sourceNode.data?.text?.toLowerCase().includes("can you") ||
        sourceNode.data?.text?.toLowerCase().includes("will you") ||
        sourceNode.data?.text?.toLowerCase().includes("is this") ||
        sourceNode.data?.text?.toLowerCase().includes("is that") ||
        sourceNode.data?.text?.toLowerCase().includes("are they") ||
        sourceNode.data?.text?.toLowerCase().includes("did you") ||
        sourceNode.data?.text?.toLowerCase().includes("should") ||
        sourceNode.data?.text?.toLowerCase().includes("could") ||
        sourceNode.data?.text?.toLowerCase().includes("interested") ||
        sourceNode.data?.text?.toLowerCase().includes("want to") ||
        sourceNode.data?.text?.toLowerCase().includes("medicare") ||
        sourceNode.data?.text?.toLowerCase().includes("medicaid") ||
        sourceNode.data?.text?.toLowerCase().includes("insurance") ||
        sourceNode.data?.text?.toLowerCase().includes("coverage") ||
        // Check for question marks in short questions (likely yes/no)
        (sourceNode.data?.text?.includes("?") && sourceNode.data?.text?.length < 100)

      // Find outgoing edges from the conditional node
      const conditionalOutgoingEdges = edges.filter((edge) => edge.source === conditionalNode.id)

      // Determine options based on conditional node and question type
      let options = ["Yes", "No"]
      let variableName = conditionalNode.data?.variableName || "response"

      // Check if this is an age-related condition
      const isAgeCondition =
        conditionalNode.data?.variableName?.toLowerCase() === "age" ||
        (conditionalNode.data?.text && conditionalNode.data.text.toLowerCase().includes("age")) ||
        (sourceNode.data?.text &&
          (sourceNode.data.text.toLowerCase().includes("how old") ||
            sourceNode.data.text.toLowerCase().includes("what is your age") ||
            sourceNode.data.text.toLowerCase().includes("what's your age")))

      if (isAgeCondition) {
        options = ["Under 65", "65 or older"]
        variableName = "age"
      }

      // Create a new customer response node
      const customerResponseNode = {
        id: `customer_response_${Date.now()}`,
        type: "customer-response",
        data: {
          text: "Waiting for customer response",
          options: options,
          responses: options,
          variableName: variableName,
          intentDescription: sourceNode.data?.text || "Capture customer response",
        },
        position: responseNode.position || { x: 250, y: 200 },
      }

      // Add the new node
      nodes.push(customerResponseNode)

      // Create an edge from the source node to the customer response node
      edges.push({
        id: `edge_${sourceNodeId}_${customerResponseNode.id}`,
        source: sourceNodeId,
        target: customerResponseNode.id,
      })

      // Map conditional branches to customer response options
      for (const edge of conditionalOutgoingEdges) {
        let optionLabel = "next"

        if (
          edge.sourceHandle === "true" ||
          edge.label === conditionalNode.data?.trueLabel ||
          edge.label === "Yes" ||
          edge.label === "Under 65"
        ) {
          optionLabel = isAgeCondition ? "Under 65" : "Yes"
        } else if (
          edge.sourceHandle === "false" ||
          edge.label === conditionalNode.data?.falseLabel ||
          edge.label === "No" ||
          edge.label === "65 or older"
        ) {
          optionLabel = isAgeCondition ? "65 or older" : "No"
        }

        edges.push({
          id: `edge_${customerResponseNode.id}_${edge.target}_${optionLabel}`,
          source: customerResponseNode.id,
          target: edge.target,
          label: optionLabel,
        })
      }

      // Remove the response and conditional nodes and their edges
      const nodesToRemove = [responseNode.id, conditionalNode.id]

      // Remove edges connected to the nodes we're removing
      const edgesToRemove = edges
        .filter((edge) => nodesToRemove.includes(edge.source) || nodesToRemove.includes(edge.target))
        .map((edge) => edge.id)

      // Update the nodes and edges arrays
      for (let i = nodes.length - 1; i >= 0; i--) {
        if (nodesToRemove.includes(nodes[i].id)) {
          nodes.splice(i, 1)
        }
      }

      for (let i = edges.length - 1; i >= 0; i--) {
        if (edgesToRemove.includes(edges[i].id)) {
          edges.splice(i, 1)
        }
      }
    }
  }
}

/**
 * Convert conditional nodes to customer response nodes
 */
function convertConditionalToCustomerResponse(nodes: any[], edges: any[]) {
  // Find all conditional nodes
  const conditionalNodes = nodes.filter(
    (node) =>
      node.type === "conditional" ||
      node.type.toLowerCase().includes("condition") ||
      node.type.toLowerCase().includes("if"),
  )

  // Process each conditional node
  for (const conditionalNode of conditionalNodes) {
    console.log("Converting conditional node to customer response node")

    // Find incoming edges to this conditional node
    const incomingEdges = edges.filter((edge) => edge.target === conditionalNode.id)

    // Skip if there are no incoming edges
    if (incomingEdges.length === 0) continue

    // Find outgoing edges from this conditional node
    const outgoingEdges = edges.filter((edge) => edge.source === conditionalNode.id)

    // Get the source node (usually a question)
    const sourceNodeId = incomingEdges[0].source
    const sourceNode = nodes.find((node) => node.id === sourceNodeId)

    // Skip if source node doesn't exist
    if (!sourceNode) continue

    // Determine the variable name and options based on the conditional node
    const variableName = conditionalNode.data?.variableName || "response"
    let options = []

    // Check if this is an age-related condition
    const isAgeCondition =
      variableName.toLowerCase() === "age" ||
      (conditionalNode.data?.text && conditionalNode.data.text.toLowerCase().includes("age"))

    if (isAgeCondition) {
      // For age conditions, create numeric options
      options = ["Under 65", "65 or older"]
    } else {
      // For other conditions, use Yes/No
      options = ["Yes", "No"]
    }

    // Create a new customer response node
    const customerResponseNode = {
      id: `customer_response_${Date.now()}`,
      type: "customer-response",
      data: {
        text: "Waiting for customer response",
        options: options,
        responses: options,
        variableName: variableName,
        intentDescription: sourceNode.data?.text || "Capture customer response",
      },
      position: conditionalNode.position || { x: 250, y: 200 },
    }

    // Add the new node
    nodes.push(customerResponseNode)

    // Create an edge from the source node to the customer response node
    edges.push({
      id: `edge_${sourceNodeId}_${customerResponseNode.id}`,
      source: sourceNodeId,
      target: customerResponseNode.id,
    })

    // Map conditional branches to customer response options
    for (const edge of outgoingEdges) {
      let optionLabel = "next"

      if (
        edge.sourceHandle === "true" ||
        edge.label === conditionalNode.data?.trueLabel ||
        edge.label === "Yes" ||
        edge.label === "Under 65"
      ) {
        optionLabel = isAgeCondition ? "Under 65" : "Yes"
      } else if (
        edge.sourceHandle === "false" ||
        edge.label === conditionalNode.data?.falseLabel ||
        edge.label === "No" ||
        edge.label === "65 or older"
      ) {
        optionLabel = isAgeCondition ? "65 or older" : "No"
      }

      edges.push({
        id: `edge_${customerResponseNode.id}_${edge.target}_${optionLabel}`,
        source: customerResponseNode.id,
        target: edge.target,
        label: optionLabel,
      })
    }

    // Remove the conditional node and its edges
    const nodesToRemove = [conditionalNode.id]

    // Remove edges connected to the nodes we're removing
    const edgesToRemove = edges
      .filter((edge) => nodesToRemove.includes(edge.source) || nodesToRemove.includes(edge.target))
      .map((edge) => edge.id)

    // Update the nodes and edges arrays
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodesToRemove.includes(nodes[i].id)) {
        nodes.splice(i, 1)
      }
    }

    for (let i = edges.length - 1; i >= 0; i--) {
      if (edgesToRemove.includes(edges[i].id)) {
        edges.splice(i, 1)
      }
    }
  }
}

/**
 * Merge separate Yes/No response nodes into customer response nodes
 */
function mergeYesNoResponseNodes(nodes: any[], edges: any[]) {
  // Find all question nodes
  const questionNodes = nodes.filter((node) => node.type === "question" || node.type.toLowerCase().includes("question"))

  // Process each question node
  for (const questionNode of questionNodes) {
    // Find outgoing edges from this question
    const outgoingEdges = edges.filter((edge) => edge.source === questionNode.id)

    // Skip if there are no outgoing edges
    if (outgoingEdges.length === 0) continue

    // Get target nodes
    const targetNodeIds = outgoingEdges.map((edge) => edge.target)
    const targetNodes = nodes.filter((node) => targetNodeIds.includes(node.id))

    // Check if targets are response nodes
    const responseNodes = targetNodes.filter(
      (node) =>
        (node.type === "response" ||
          node.type === "AI Response" ||
          node.type.toLowerCase().includes("response") ||
          node.type.toLowerCase().includes("ai response")) &&
        !node.type.toLowerCase().includes("customer"),
    )

    // If we have at least 2 response nodes, check if any are Yes/No
    if (responseNodes.length >= 2) {
      // Look for Yes and No nodes
      const yesNode = responseNodes.find(
        (node) =>
          node.data &&
          node.data.text &&
          (node.data.text.toLowerCase() === "yes" || node.data.text.toLowerCase().includes("yes")),
      )

      const noNode = responseNodes.find(
        (node) =>
          node.data &&
          node.data.text &&
          (node.data.text.toLowerCase() === "no" || node.data.text.toLowerCase().includes("no")),
      )

      // If we found Yes/No nodes, convert them to a customer response node
      if (yesNode && noNode) {
        console.log("Converting separate Yes/No response nodes to customer response node")

        // Collect all options from response nodes
        const options = responseNodes
          .map((node) => node.data.text)
          .filter(Boolean)
          .map((text) => text.trim())

        // Create a new customer response node
        const customerResponseNode = {
          id: `customer_response_${Date.now()}`,
          type: "customer-response",
          data: {
            text: "Waiting for customer response",
            options: options,
            responses: options,
            variableName: "response",
          },
          position: {
            x: (yesNode.position?.x + noNode.position?.x) / 2 || 250,
            y: Math.min(yesNode.position?.y || 0, noNode.position?.y || 0) - 50,
          },
        }

        // Add the new node
        nodes.push(customerResponseNode)

        // Create a map of response nodes to their options
        const responseNodeMap = new Map()
        responseNodes.forEach((node) => {
          if (node.data && node.data.text) {
            responseNodeMap.set(node.id, node.data.text.trim())
          }
        })

        // Create edges from the customer response node to the targets of each response node
        for (const responseNode of responseNodes) {
          const responseNodeOutgoingEdges = edges.filter((edge) => edge.source === responseNode.id)
          const option = responseNodeMap.get(responseNode.id)

          if (option) {
            for (const edge of responseNodeOutgoingEdges) {
              edges.push({
                id: `edge_${customerResponseNode.id}_${edge.target}_${option}`,
                source: customerResponseNode.id,
                target: edge.target,
                label: option,
              })
            }
          }
        }

        // Create edge from question to customer response
        edges.push({
          id: `edge_${questionNode.id}_${customerResponseNode.id}`,
          source: questionNode.id,
          target: customerResponseNode.id,
        })

        // Remove the response nodes and their edges
        const nodesToRemove = responseNodes.map((node) => node.id)

        // Remove edges connected to the nodes we're removing
        const edgesToRemove = edges
          .filter((edge) => nodesToRemove.includes(edge.source) || nodesToRemove.includes(edge.target))
          .map((edge) => edge.id)

        // Update the nodes and edges arrays
        for (let i = nodes.length - 1; i >= 0; i--) {
          if (nodesToRemove.includes(nodes[i].id)) {
            nodes.splice(i, 1)
          }
        }

        for (let i = edges.length - 1; i >= 0; i--) {
          if (edgesToRemove.includes(edges[i].id)) {
            edges.splice(i, 1)
          }
        }
      }
    }
  }
}

/**
 * Convert age-related questions to use customer response nodes with numeric options
 */
function convertAgeQuestionsToCustomerResponse(nodes: any[], edges: any[]) {
  // Find all age question nodes
  const ageQuestionNodes = nodes.filter(
    (node) =>
      (node.type === "question" || node.type.toLowerCase().includes("question")) &&
      node.data &&
      node.data.text &&
      (node.data.text.toLowerCase().includes("age") ||
        (node.data.text.toLowerCase().includes("old") && node.data.text.toLowerCase().includes("you"))),
  )

  // Process each age question node
  ageQuestionNodes.forEach((ageQuestionNode) => {
    // Find outgoing edges from this question
    const outgoingEdges = edges.filter((edge) => edge.source === ageQuestionNode.id)

    // Skip if there are no outgoing edges
    if (outgoingEdges.length === 0) return

    // Get the target node
    const targetNodeId = outgoingEdges[0].target
    const targetNode = nodes.find((node) => node.id === targetNodeId)

    // Skip if target node doesn't exist
    if (!targetNode) return

    // Check if the target is already a customer response node
    if (
      targetNode.type === "customer-response" ||
      targetNode.type.toLowerCase().includes("customer") ||
      targetNode.type.toLowerCase().includes("user-response")
    ) {
      // If it's already a customer response node, update its options
      targetNode.data.options = ["Under 65", "65 or older"]
      targetNode.data.responses = ["Under 65", "65 or older"]
      targetNode.data.variableName = "Age"
      return
    }

    // Create a new customer response node for age
    const customerResponseNode = {
      id: `customer_response_${Date.now()}`,
      type: "customer-response",
      data: {
        text: "Waiting for customer response",
        options: ["Under 65", "65 or older"],
        responses: ["Under 65", "65 or older"],
        variableName: "Age",
        intentDescription: "Capture customer's age",
      },
      position: {
        x: targetNode.position?.x || 250,
        y: targetNode.position?.y || 200,
      },
    }

    // Add the new node
    nodes.push(customerResponseNode)

    // Create an edge from the age question to the customer response node
    edges.push({
      id: `edge_${ageQuestionNode.id}_${customerResponseNode.id}`,
      source: ageQuestionNode.id,
      target: customerResponseNode.id,
    })

    // Find outgoing edges from the target node
    const targetOutgoingEdges = edges.filter((edge) => edge.source === targetNode.id)

    // Get the target nodes of these edges
    const targetTargetNodeIds = targetOutgoingEdges.map((edge) => edge.target)
    const targetTargetNodes = nodes.filter((node) => targetTargetNodeIds.includes(node.id))

    // Find transfer and end call nodes among the targets
    const transferNode = targetTargetNodes.find(
      (node) =>
        node.type === "transfer" ||
        node.type.toLowerCase().includes("transfer") ||
        (node.data &&
          node.data.text &&
          (node.data.text.toLowerCase().includes("transfer") || node.data.text.toLowerCase().includes("agent"))),
    )

    const endCallNode = targetTargetNodes.find(
      (node) =>
        node.type === "end-call" ||
        node.type.toLowerCase().includes("end") ||
        (node.data &&
          node.data.text &&
          (node.data.text.toLowerCase().includes("thank") ||
            node.data.text.toLowerCase().includes("goodbye") ||
            node.data.text.toLowerCase().includes("great day"))),
    )

    // Connect the customer response node to the transfer and end call nodes
    if (transferNode) {
      edges.push({
        id: `edge_${customerResponseNode.id}_${transferNode.id}_under65`,
        source: customerResponseNode.id,
        target: transferNode.id,
        label: "Under 65",
      })
    }

    if (endCallNode) {
      edges.push({
        id: `edge_${customerResponseNode.id}_${endCallNode.id}_over65`,
        source: customerResponseNode.id,
        target: endCallNode.id,
        label: "65 or older",
      })
    }

    // If we didn't find specific nodes, connect to all target nodes
    if (!transferNode && !endCallNode) {
      for (const edge of targetOutgoingEdges) {
        edges.push({
          id: `edge_${customerResponseNode.id}_${edge.target}_next`,
          source: customerResponseNode.id,
          target: edge.target,
          label: "next",
        })
      }
    }

    // Remove the original target node and its edges
    const nodesToRemove = [targetNode.id]

    // Remove edges connected to the nodes we're removing
    const edgesToRemove = edges
      .filter((edge) => nodesToRemove.includes(edge.source) || nodesToRemove.includes(edge.target))
      .map((edge) => edge.id)

    // Update the nodes and edges arrays
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodesToRemove.includes(nodes[i].id)) {
        nodes.splice(i, 1)
      }
    }

    for (let i = edges.length - 1; i >= 0; i--) {
      if (edgesToRemove.includes(edges[i].id)) {
        edges.splice(i, 1)
      }
    }
  })
}

/**
 * Convert AI Response nodes after questions to Customer Response nodes
 * This is a new function to specifically address the issue mentioned by the user
 */
function convertAIResponseAfterQuestions(nodes: any[], edges: any[]) {
  // Find all question nodes
  const questionNodes = nodes.filter((node) => node.type === "question" || node.type.toLowerCase().includes("question"))

  // Process each question node
  for (const questionNode of questionNodes) {
    // Find outgoing edges from this question
    const outgoingEdges = edges.filter((edge) => edge.source === questionNode.id)

    // Skip if there are no outgoing edges
    if (outgoingEdges.length === 0) continue

    // Get target nodes
    const targetNodeIds = outgoingEdges.map((edge) => edge.target)
    const targetNodes = nodes.filter((node) => targetNodeIds.includes(node.id))

    // Check if any target is an AI Response node
    const aiResponseNode = targetNodes.find(
      (node) =>
        node.type === "response" ||
        node.type === "AI Response" ||
        (node.type.toLowerCase().includes("response") && !node.type.toLowerCase().includes("customer")),
    )

    if (aiResponseNode) {
      console.log("Converting AI Response node after question to Customer Response node")

      // Determine if this is a yes/no question
      const isYesNoQuestion =
        questionNode.data?.text?.toLowerCase().includes("are you") ||
        questionNode.data?.text?.toLowerCase().includes("do you") ||
        questionNode.data?.text?.toLowerCase().includes("have you") ||
        questionNode.data?.text?.toLowerCase().includes("would you") ||
        questionNode.data?.text?.toLowerCase().includes("can you") ||
        questionNode.data?.text?.toLowerCase().includes("will you") ||
        questionNode.data?.text?.toLowerCase().includes("is this") ||
        questionNode.data?.text?.toLowerCase().includes("is that") ||
        questionNode.data?.text?.toLowerCase().includes("are they") ||
        questionNode.data?.text?.toLowerCase().includes("did you") ||
        questionNode.data?.text?.toLowerCase().includes("should") ||
        questionNode.data?.text?.toLowerCase().includes("could") ||
        questionNode.data?.text?.toLowerCase().includes("interested") ||
        questionNode.data?.text?.toLowerCase().includes("want to") ||
        questionNode.data?.text?.toLowerCase().includes("medicare") ||
        questionNode.data?.text?.toLowerCase().includes("medicaid") ||
        questionNode.data?.text?.toLowerCase().includes("insurance") ||
        questionNode.data?.text?.toLowerCase().includes("coverage") ||
        // Check for question marks in short questions (likely yes/no)
        (questionNode.data?.text?.includes("?") && questionNode.data?.text?.length < 100)

      // Determine if this is an age question
      const isAgeQuestion =
        questionNode.data?.text?.toLowerCase().includes("age") ||
        questionNode.data?.text?.toLowerCase().includes("old") ||
        questionNode.data?.text?.toLowerCase().includes("years")

      // Determine if this is a name question
      const isNameQuestion =
        questionNode.data?.text?.toLowerCase().includes("name") ||
        questionNode.data?.text?.toLowerCase().includes("who are you")

      // Determine if this is a zip/location question
      const isZipQuestion =
        questionNode.data?.text?.toLowerCase().includes("zip") ||
        questionNode.data?.text?.toLowerCase().includes("postal") ||
        questionNode.data?.text?.toLowerCase().includes("location") ||
        questionNode.data?.text?.toLowerCase().includes("where")

      // Set options based on question type
      let options = ["Yes", "No"]
      let variableName = "response"
      let isOpenEnded = false

      if (isAgeQuestion) {
        options = ["Under 65", "65 or older"]
        variableName = "age"
      } else if (isNameQuestion) {
        options = ["Name"]
        variableName = "name"
        isOpenEnded = true
      } else if (isZipQuestion) {
        options = ["ZIP"]
        variableName = "zip_code"
        isOpenEnded = true
      } else if (questionNode.data?.text?.toLowerCase().includes("medicare")) {
        variableName = "medicare_status"
      }

      // Create a new customer response node
      const customerResponseNode = {
        id: `customer_response_${Date.now()}`,
        type: "customer-response",
        data: {
          text: "Waiting for customer response",
          options: options,
          responses: options,
          variableName: variableName,
          intentDescription: questionNode.data?.text || "Capture customer response",
          isOpenEnded: isOpenEnded,
        },
        position: aiResponseNode.position || { x: 250, y: 200 },
      }

      // Add the new node
      nodes.push(customerResponseNode)

      // Create an edge from the question to the customer response node
      edges.push({
        id: `edge_${questionNode.id}_${customerResponseNode.id}`,
        source: questionNode.id,
        target: customerResponseNode.id,
      })

      // Find outgoing edges from the AI Response node
      const aiResponseOutgoingEdges = edges.filter((edge) => edge.source === aiResponseNode.id)

      // Connect the customer response node to all targets of the AI Response node
      for (const edge of aiResponseOutgoingEdges) {
        // For yes/no questions, create separate edges for Yes and No
        if (isYesNoQuestion && aiResponseOutgoingEdges.length >= 2) {
          // Try to determine if this is a Yes or No path
          const targetNode = nodes.find((n) => n.id === edge.target)
          const isYesPath =
            targetNode &&
            targetNode.data &&
            targetNode.data.text &&
            (targetNode.data.text.toLowerCase().includes("great") ||
              targetNode.data.text.toLowerCase().includes("excellent") ||
              targetNode.data.text.toLowerCase().includes("perfect") ||
              targetNode.data.text.toLowerCase().includes("thank"))

          const isNoPath =
            targetNode &&
            targetNode.data &&
            targetNode.data.text &&
            (targetNode.data.text.toLowerCase().includes("sorry") ||
              targetNode.data.text.toLowerCase().includes("unfortunately") ||
              targetNode.data.text.toLowerCase().includes("not eligible"))

          if (isYesPath) {
            edges.push({
              id: `edge_${customerResponseNode.id}_${edge.target}_yes`,
              source: customerResponseNode.id,
              target: edge.target,
              sourceHandle: "response-0", // Yes option
              label: "Yes",
            })
          } else if (isNoPath) {
            edges.push({
              id: `edge_${customerResponseNode.id}_${edge.target}_no`,
              source: customerResponseNode.id,
              target: edge.target,
              sourceHandle: "response-1", // No option
              label: "No",
            })
          } else {
            // If we can't determine, just connect with a generic label
            edges.push({
              id: `edge_${customerResponseNode.id}_${edge.target}_next`,
              source: customerResponseNode.id,
              target: edge.target,
              label: "next",
            })
          }
        } else {
          // For other questions, just connect with a generic label
          edges.push({
            id: `edge_${customerResponseNode.id}_${edge.target}_next`,
            source: customerResponseNode.id,
            target: edge.target,
            label: "next",
          })
        }
      }

      // Remove the AI Response node and its edges
      const nodesToRemove = [aiResponseNode.id]

      // Remove edges connected to the nodes we're removing
      const edgesToRemove = edges
        .filter((edge) => nodesToRemove.includes(edge.source) || nodesToRemove.includes(edge.target))
        .map((edge) => edge.id)

      // Update the nodes and edges arrays
      for (let i = nodes.length - 1; i >= 0; i--) {
        if (nodesToRemove.includes(nodes[i].id)) {
          nodes.splice(i, 1)
        }
      }

      for (let i = edges.length - 1; i >= 0; i--) {
        if (edgesToRemove.includes(edges[i].id)) {
          edges.splice(i, 1)
        }
      }
    }
  }
}

/**
 * Convert question nodes that should have Yes/No responses to use customer response nodes
 */
function convertQuestionsToYesNoResponses(nodes, edges) {
  // Find all question nodes
  const questionNodes = nodes.filter((node) => node.type === "question" || node.type.toLowerCase().includes("question"))

  // Process each question node
  for (const questionNode of questionNodes) {
    // Skip if we've already processed this node
    if (questionNode.processed) continue

    // Check if this is a yes/no question
    const isYesNoQuestion =
      questionNode.data?.text?.toLowerCase().includes("are you") ||
      questionNode.data?.text?.toLowerCase().includes("do you") ||
      questionNode.data?.text?.toLowerCase().includes("have you") ||
      questionNode.data?.text?.toLowerCase().includes("would you") ||
      questionNode.data?.text?.toLowerCase().includes("can you") ||
      questionNode.data?.text?.toLowerCase().includes("will you") ||
      questionNode.data?.text?.toLowerCase().includes("is this") ||
      questionNode.data?.text?.toLowerCase().includes("is that") ||
      questionNode.data?.text?.toLowerCase().includes("are they") ||
      questionNode.data?.text?.toLowerCase().includes("did you") ||
      questionNode.data?.text?.toLowerCase().includes("should") ||
      questionNode.data?.text?.toLowerCase().includes("could") ||
      questionNode.data?.text?.toLowerCase().includes("interested") ||
      questionNode.data?.text?.toLowerCase().includes("want to") ||
      questionNode.data?.text?.toLowerCase().includes("medicare") ||
      questionNode.data?.text?.toLowerCase().includes("medicaid") ||
      questionNode.data?.text?.toLowerCase().includes("insurance") ||
      questionNode.data?.text?.toLowerCase().includes("coverage") ||
      // Check for question marks in short questions (likely yes/no)
      (questionNode.data?.text?.includes("?") && questionNode.data?.text?.length < 100)

    if (!isYesNoQuestion) continue

    // Find outgoing edges from this question
    const outgoingEdges = edges.filter((edge) => edge.source === questionNode.id)

    // Skip if there are no outgoing edges
    if (outgoingEdges.length === 0) continue

    // Get target nodes
    const targetNodeIds = outgoingEdges.map((edge) => edge.target)
    const targetNodes = nodes.filter((node) => targetNodeIds.includes(node.id))

    // Check if the next node is already a customer response node
    const nextIsCustomerResponse = targetNodes.some(
      (node) =>
        node.type === "customer-response" ||
        node.type.toLowerCase().includes("customer") ||
        node.type.toLowerCase().includes("user-response"),
    )

    // Skip if the next node is already a customer response node
    if (nextIsCustomerResponse) continue

    // Check if the next node is a response node
    const responseNode = targetNodes.find(
      (node) =>
        node.type === "response" ||
        node.type === "AI Response" ||
        (node.type.toLowerCase().includes("response") && !node.type.toLowerCase().includes("customer")),
    )

    if (!responseNode) continue

    console.log("Converting question with Yes/No response to use customer response node")

    // Determine variable name based on question content
    let variableName = "response"

    if (questionNode.data?.text?.toLowerCase().includes("medicare")) {
      variableName = "medicare_status"
    } else if (questionNode.data?.text?.toLowerCase().includes("medicaid")) {
      variableName = "medicaid_status"
    } else if (questionNode.data?.text?.toLowerCase().includes("insurance")) {
      variableName = "insurance_status"
    } else if (questionNode.data?.text?.toLowerCase().includes("coverage")) {
      variableName = "coverage_status"
    }

    // Create a new customer response node
    const customerResponseNode = {
      id: `customer_response_${Date.now()}`,
      type: "customer-response",
      data: {
        text: "Waiting for customer response",
        options: ["Yes", "No"],
        responses: ["Yes", "No"],
        variableName: variableName,
        intentDescription: questionNode.data?.text || "Capture customer response",
      },
      position: {
        x: responseNode.position?.x || 250,
        y: responseNode.position?.y || 200,
      },
    }

    // Add the new node
    nodes.push(customerResponseNode)

    // Create an edge from the question to the customer response node
    edges.push({
      id: `edge_${questionNode.id}_${customerResponseNode.id}`,
      source: questionNode.id,
      target: customerResponseNode.id,
    })

    // Find outgoing edges from the response node
    const responseOutgoingEdges = edges.filter((edge) => edge.source === responseNode.id)

    // If there are multiple outgoing edges, try to determine which is for Yes and which is for No
    if (responseOutgoingEdges.length >= 2) {
      // Get the target nodes of these edges
      const responseTargetNodeIds = responseOutgoingEdges.map((edge) => edge.target)
      const responseTargetNodes = nodes.filter((node) => responseTargetNodeIds.includes(node.id))

      // Try to identify positive and negative response paths
      const positiveNode = responseTargetNodes.find(
        (node) =>
          node.data?.text?.toLowerCase().includes("great") ||
          node.data?.text?.toLowerCase().includes("excellent") ||
          node.data?.text?.toLowerCase().includes("perfect") ||
          node.data?.text?.toLowerCase().includes("thank") ||
          node.data?.text?.toLowerCase().includes("qualify") ||
          node.data?.text?.toLowerCase().includes("eligible"),
      )

      const negativeNode = responseTargetNodes.find(
        (node) =>
          node.data?.text?.toLowerCase().includes("sorry") ||
          node.data?.text?.toLowerCase().includes("unfortunately") ||
          node.data?.text?.toLowerCase().includes("not eligible") ||
          node.data?.text?.toLowerCase().includes("don't qualify") ||
          node.data?.text?.toLowerCase().includes("do not qualify"),
      )

      // Connect to positive node with Yes
      if (positiveNode) {
        const positiveEdge = responseOutgoingEdges.find((edge) => edge.target === positiveNode.id)
        edges.push({
          id: `edge_${customerResponseNode.id}_${positiveEdge.target}_Yes`,
          source: customerResponseNode.id,
          target: positiveEdge.target,
          sourceHandle: "response-0", // Yes option
          label: "Yes",
        })
      }

      // Connect to negative node with No
      if (negativeNode) {
        const negativeEdge = responseOutgoingEdges.find((edge) => edge.target === negativeNode.id)
        edges.push({
          id: `edge_${customerResponseNode.id}_${negativeEdge.target}_No`,
          source: customerResponseNode.id,
          target: negativeEdge.target,
          sourceHandle: "response-1", // No option
          label: "No",
        })
      }

      // If we couldn't identify positive/negative, just connect in order
      if (!positiveNode && !negativeNode) {
        responseOutgoingEdges.forEach((edge, index) => {
          const label = index === 0 ? "Yes" : "No"
          edges.push({
            id: `edge_${customerResponseNode.id}_${edge.target}_${label}`,
            source: customerResponseNode.id,
            target: edge.target,
            sourceHandle: `response-${index}`,
            label: label,
          })
        })
      }
    } else if (responseOutgoingEdges.length === 1) {
      // If there's only one outgoing edge, just connect it
      edges.push({
        id: `edge_${customerResponseNode.id}_${responseOutgoingEdges[0].target}_next`,
        source: customerResponseNode.id,
        target: responseOutgoingEdges[0].target,
        label: "next",
      })
    }

    // Mark the question node as processed
    questionNode.processed = true

    // Remove the response node and its edges
    const nodesToRemove = [responseNode.id]

    // Remove edges connected to the nodes we're removing
    const edgesToRemove = edges
      .filter((edge) => nodesToRemove.includes(edge.source) || nodesToRemove.includes(edge.target))
      .map((edge) => edge.id)

    // Update the nodes and edges arrays
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodesToRemove.includes(nodes[i].id)) {
        nodes.splice(i, 1)
      }
    }

    for (let i = edges.length - 1; i >= 0; i--) {
      if (edgesToRemove.includes(edges[i].id)) {
        edges.splice(i, 1)
      }
    }
  }
}

function mapApiNodeTypeToFlowchartType(apiType: string): string {
  // Convert to lowercase for case-insensitive comparison
  const type = apiType.toLowerCase()

  if (type === "greeting" || type.includes("greeting") || type.includes("start")) {
    return "greetingNode"
  } else if (type === "question" || type.includes("question")) {
    return "questionNode"
  } else if (type === "response" || type.includes("response")) {
    return "responseNode"
  } else if (
    type === "customer-response" ||
    type.includes("customer") ||
    type.includes("user-response") ||
    type.includes("user-input")
  ) {
    return "customerResponseNode"
  } else if (type === "end-call" || type.includes("end") || type.includes("hangup")) {
    return "endCallNode"
  } else if (type === "transfer" || type.includes("transfer")) {
    return "transferNode"
  } else if (type === "webhook" || type.includes("webhook") || type.includes("api")) {
    return "webhookNode"
  } else if (type === "conditional" || type.includes("condition") || type.includes("if")) {
    // Convert conditional nodes to customer response nodes
    return "customerResponseNode"
  } else if (type === "default" || type === "Default") {
    // For Default nodes, try to determine a more specific type based on position or content
    return "responseNode" // Default to response node
  } else {
    // Default to response node if we can't determine
    return "responseNode"
  }
}

/**
 * Get default text for a node type
 */
function getDefaultTextForNodeType(nodeType: string): string {
  switch (nodeType) {
    case "greetingNode":
      return defaultNodeText.greeting
    case "questionNode":
      return defaultNodeText.question
    case "responseNode":
      return defaultNodeText.response
    case "endCallNode":
      return defaultNodeText.endCall
    case "transferNode":
      return defaultNodeText.transfer
    case "webhookNode":
      return defaultNodeText.webhook
    default:
      return "Node content"
  }
}

/**
 * Check if a string is likely to be a variable name
 */
function isLikelyVariable(text: string): boolean {
  // Check if it's a single word without spaces
  if (!/\s/.test(text) && text.length > 0) {
    // Check if it starts with a letter or underscore
    if (/^[A-Za-z_]/.test(text)) {
      // Check if it's not a common response like "Yes", "No", etc.
      if (!["yes", "no", "maybe", "true", "false"].includes(text.toLowerCase())) {
        return true
      }
    }
  }
  return false
}
