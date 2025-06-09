import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, pathwayId, flowchart } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ status: "error", message: "API key is required" }, { status: 400 })
    }

    if (!pathwayId) {
      return NextResponse.json({ status: "error", message: "Pathway ID is required" }, { status: 400 })
    }

    if (!flowchart || !flowchart.nodes || !flowchart.edges) {
      return NextResponse.json({ status: "error", message: "Invalid flowchart data" }, { status: 400 })
    }

    // Create a deep copy of the flowchart to avoid modifying the original
    const processedFlowchart = JSON.parse(JSON.stringify(flowchart))

    // CRITICAL: Ensure edges follow the Bland.ai format with direct label property
    if (processedFlowchart.edges && Array.isArray(processedFlowchart.edges)) {
      processedFlowchart.edges = processedFlowchart.edges.map((edge: any) => {
        // Convert from our format to Bland.ai format
        const newEdge: any = {
          id: edge.id,
          source: edge.source,
          target: edge.target,
        }

        // Get the label from data.label if it exists, otherwise use "next"
        if (edge.data && edge.data.label) {
          newEdge.label = edge.data.label
        } else if (edge.label) {
          newEdge.label = edge.label
        } else {
          newEdge.label = "next"
        }

        // Remove the type and data properties as they're not in Bland.ai format
        delete newEdge.type
        delete newEdge.data

        return newEdge
      })
    }

    // Normalize node IDs in the flowchart before conversion
    const normalizedFlowchart = normalizeNodeIds(processedFlowchart)

    // Convert the flowchart to Bland.ai pathway format
    const { name, description, nodes, edges } = normalizedFlowchart

    // Validate the JSON before sending
    const validationResult = validateBlandJson({ name, description, nodes, edges })
    if (!validationResult.valid) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid Bland.ai JSON format",
          validationErrors: validationResult.errors,
        },
        { status: 400 },
      )
    }

    // Log the request payload for debugging
    console.log("Request payload:", JSON.stringify({ name, description, nodes, edges }, null, 2))

    // Construct the API URL - ensure it's exactly as specified
    const apiUrl = `https://api.bland.ai/v1/pathway/${pathwayId}`
    console.log("API URL:", apiUrl)

    // Log the exact payload being sent to Bland.ai
    const finalPayload = {
      name,
      description,
      nodes,
      edges,
    }
    console.log("Final payload sent to Bland.ai:", JSON.stringify(finalPayload, null, 2))

    // Send the pathway to Bland.ai using POST
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(finalPayload),
    })

    // Check content type before trying to parse as JSON
    const contentType = response.headers.get("content-type")

    if (!contentType || !contentType.includes("application/json")) {
      // Not JSON, get the raw text
      const rawResponse = await response.text()
      return NextResponse.json(
        {
          status: "error",
          message: "Non-JSON response received from API",
          responseStatus: response.status,
          responseStatusText: response.statusText,
          rawResponse: rawResponse.substring(0, 1000), // First 1000 chars for debugging
          requestDetails: {
            url: apiUrl,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer API_KEY_REDACTED",
            },
            body: JSON.stringify({ name, description, nodes, edges }, null, 2),
          },
        },
        { status: response.status },
      )
    }

    // Now it's safe to parse as JSON
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to update pathway",
          responseStatus: response.status,
          responseStatusText: response.statusText,
          responseData: data,
          requestDetails: {
            url: apiUrl,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer API_KEY_REDACTED",
            },
            body: JSON.stringify({ name, description, nodes, edges }, null, 2),
          },
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      status: "success",
      message: "Pathway updated successfully",
      data,
    })
  } catch (error) {
    console.error("Error updating pathway:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        error: error instanceof Error ? error.toString() : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Function to normalize node IDs by replacing special characters with underscores
function normalizeNodeIds(flowchart: any) {
  if (!flowchart || !flowchart.nodes || !Array.isArray(flowchart.nodes)) {
    console.warn("Invalid flowchart structure:", flowchart)
    return {
      ...flowchart,
      nodes: [],
      edges: [],
    }
  }

  const idMap = new Map() // Map to store original ID to normalized ID mapping

  // Create a deep copy of the flowchart
  const normalizedFlowchart = JSON.parse(JSON.stringify(flowchart))

  // Filter out nodes with undefined IDs
  normalizedFlowchart.nodes = normalizedFlowchart.nodes.filter((node: any) => {
    if (!node || !node.id || typeof node.id !== "string") {
      console.warn("Skipping node with invalid ID:", node)
      return false
    }
    // Skip globalConfig node in this filtering
    if (node.globalConfig) return true
    return true
  })

  // Normalize node IDs
  normalizedFlowchart.nodes.forEach((node: any) => {
    // Skip globalConfig node
    if (node.globalConfig) return

    const originalId = node.id
    // Replace special characters with underscores and ensure it's a valid ID
    const normalizedId = originalId.replace(/[^a-zA-Z0-9_]/g, "_")

    // Update the node ID
    node.id = normalizedId

    // Store the mapping
    idMap.set(originalId, normalizedId)
  })

  // Filter and update edge source and target IDs
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

      // Also normalize sourceHandle and targetHandle if they exist
      if (edge.sourceHandle && typeof edge.sourceHandle === "string") {
        edge.sourceHandle = edge.sourceHandle.replace(/[^a-zA-Z0-9_]/g, "_")
      }

      if (edge.targetHandle && typeof edge.targetHandle === "string") {
        edge.targetHandle = edge.targetHandle.replace(/[^a-zA-Z0-9_]/g, "_")
      }
    })
  } else {
    normalizedFlowchart.edges = []
  }

  return normalizedFlowchart
}

// Function to validate the Bland.ai JSON format
function validateBlandJson(data: any) {
  const errors = []

  // Check required top-level fields
  if (!data.name) errors.push("Missing pathway name")
  if (!data.description) errors.push("Missing pathway description")
  if (!Array.isArray(data.nodes) || data.nodes.length === 0) errors.push("Missing or empty nodes array")
  if (!Array.isArray(data.edges)) errors.push("Missing edges array")

  // Check if there's exactly one start node
  const startNodes = data.nodes.filter((node: any) => node.data && node.data.isStart === true)
  if (startNodes.length === 0) {
    errors.push("No start node defined (node with isStart: true)")
  } else if (startNodes.length > 1) {
    errors.push(`Multiple start nodes found (${startNodes.length}). Only one node should have isStart: true`)
  }

  // Check each node
  data.nodes.forEach((node: any, index: number) => {
    // Skip the globalConfig node
    if (node.globalConfig) return

    if (!node.id) errors.push(`Node at index ${index} is missing an id`)
    if (!node.type) errors.push(`Node at index ${index} is missing a type`)
    if (!node.data) errors.push(`Node at index ${index} is missing data`)

    // Check for text field in all node types except End Call
    if (node.data && !node.data.text && node.type !== "End Call") {
      errors.push(`Node ${node.id} is missing the required text field`)
    }

    // Check for End Call specific fields
    if (node.type === "End Call" && node.data && !node.data.prompt) {
      errors.push(`End Call Node ${node.id} is missing prompt field`)
    }

    // Check for Transfer Node specific fields
    if (node.type === "Transfer Call") {
      if (!node.data?.transferNumber) {
        errors.push(`Transfer Node ${node.id} is missing transferNumber field`)
      }
    }

    // Check for Webhook specific fields
    if (node.type === "Webhook") {
      if (!node.data?.url) {
        errors.push(`Webhook Node ${node.id} is missing url field`)
      }
      if (!node.data?.method) {
        errors.push(`Webhook Node ${node.id} is missing method field`)
      }
    }
  })

  // Check each edge
  data.edges.forEach((edge: any, index: number) => {
    if (!edge.id) errors.push(`Edge at index ${index} is missing an id`)
    if (!edge.source) errors.push(`Edge at index ${index} is missing a source`)
    if (!edge.target) errors.push(`Edge at index ${index} is missing a target`)
    if (!edge.label) errors.push(`Edge at index ${index} is missing a label`) // Check for direct label property

    // Check that source and target nodes exist
    const sourceExists = data.nodes.some((node: any) => node.id === edge.source)
    const targetExists = data.nodes.some((node: any) => node.id === edge.target)

    if (!sourceExists) errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`)
    if (!targetExists) errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`)
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
