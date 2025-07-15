import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, pathwayId, flowchart } = await request.json()

    console.log("=".repeat(80))
    console.log("[API_ROUTE] 🚀 UPDATE PATHWAY API ROUTE - PAYLOAD INSPECTION")
    console.log("=".repeat(80))

    if (!apiKey) {
      return NextResponse.json({ status: "error", message: "API key is required" }, { status: 400 })
    }

    if (!pathwayId) {
      return NextResponse.json({ status: "error", message: "Pathway ID is required" }, { status: 400 })
    }

    if (!flowchart) {
      return NextResponse.json({ status: "error", message: "Flowchart data is required" }, { status: 400 })
    }

    console.log("[API_ROUTE] 📋 Received payload structure:")
    console.log("[API_ROUTE] - API Key length:", apiKey.length)
    console.log("[API_ROUTE] - Pathway ID:", pathwayId)
    console.log("[API_ROUTE] - Flowchart type:", typeof flowchart)
    console.log("[API_ROUTE] - Flowchart keys:", Object.keys(flowchart))

    // Validate flowchart structure
    if (
      !flowchart.name ||
      !flowchart.description ||
      !Array.isArray(flowchart.nodes) ||
      !Array.isArray(flowchart.edges)
    ) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid flowchart structure",
          details: {
            hasName: !!flowchart.name,
            hasDescription: !!flowchart.description,
            hasNodesArray: Array.isArray(flowchart.nodes),
            hasEdgesArray: Array.isArray(flowchart.edges),
          },
        },
        { status: 400 },
      )
    }

    console.log("[API_ROUTE] ✅ Flowchart structure validation passed:")
    console.log("[API_ROUTE] - Name:", flowchart.name)
    console.log("[API_ROUTE] - Description:", flowchart.description)
    console.log("[API_ROUTE] - Nodes count:", flowchart.nodes.length)
    console.log("[API_ROUTE] - Edges count:", flowchart.edges.length)

    // Check for disallowed top-level fields
    const allowedFields = ["name", "description", "nodes", "edges"]
    const actualFields = Object.keys(flowchart)
    const disallowedFields = actualFields.filter((field) => !allowedFields.includes(field))

    if (disallowedFields.length > 0) {
      console.error("[API_ROUTE] ❌ Found disallowed fields:", disallowedFields)
      return NextResponse.json(
        {
          status: "error",
          message: "Flowchart contains disallowed fields",
          disallowedFields,
        },
        { status: 400 },
      )
    }

    console.log("[API_ROUTE] ✅ No disallowed fields found")

    // Validate nodes structure
    for (let i = 0; i < flowchart.nodes.length; i++) {
      const node = flowchart.nodes[i]
      if (!node.id || !node.type || !node.data) {
        console.error(`[API_ROUTE] ❌ Invalid node at index ${i}:`, node)
        return NextResponse.json(
          {
            status: "error",
            message: `Invalid node structure at index ${i}`,
            nodeId: node.id || "unknown",
          },
          { status: 400 },
        )
      }

      // Check for required fields based on node type
      switch (node.type) {
        case "End Call":
          if (!node.data.prompt) {
            console.error(`[API_ROUTE] ❌ End Call node ${node.id} missing prompt field`)
            return NextResponse.json(
              {
                status: "error",
                message: `End Call node ${node.id} must have prompt field in data`,
              },
              { status: 400 },
            )
          }
          break
        case "Transfer Call":
          if (!node.data.transferNumber) {
            console.error(`[API_ROUTE] ❌ Transfer Call node ${node.id} missing transferNumber field`)
            return NextResponse.json(
              {
                status: "error",
                message: `Transfer Call node ${node.id} must have transferNumber field in data`,
              },
              { status: 400 },
            )
          }
          break
        case "Webhook":
          if (!node.data.url || !node.data.method) {
            console.error(`[API_ROUTE] ❌ Webhook node ${node.id} missing url or method field`)
            return NextResponse.json(
              {
                status: "error",
                message: `Webhook node ${node.id} must have url and method fields in data`,
              },
              { status: 400 },
            )
          }
          break
      }
    }

    console.log("[API_ROUTE] ✅ All nodes validation passed")

    // Validate edges structure
    for (let i = 0; i < flowchart.edges.length; i++) {
      const edge = flowchart.edges[i]
      if (!edge.id || !edge.source || !edge.target || !edge.label) {
        console.error(`[API_ROUTE] ❌ Invalid edge at index ${i}:`, edge)
        return NextResponse.json(
          {
            status: "error",
            message: `Invalid edge structure at index ${i}`,
            edgeId: edge.id || "unknown",
          },
          { status: 400 },
        )
      }
    }

    console.log("[API_ROUTE] ✅ All edges validation passed")

    // Create the exact payload for Bland.ai
    const blandApiPayload = {
      name: flowchart.name,
      description: flowchart.description,
      nodes: flowchart.nodes,
      edges: flowchart.edges,
    }

    console.log("[API_ROUTE] 📤 Final payload to Bland.ai:")
    console.log("[API_ROUTE] - Payload keys:", Object.keys(blandApiPayload))
    console.log("[API_ROUTE] - JSON serialization test...")

    // Test JSON serialization
    let serializedPayload: string
    try {
      serializedPayload = JSON.stringify(blandApiPayload)
      console.log("[API_ROUTE] ✅ JSON serialization successful")
      console.log("[API_ROUTE] - Serialized length:", serializedPayload.length)
    } catch (serializationError) {
      console.error("[API_ROUTE] ❌ JSON serialization failed:", serializationError)
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to serialize payload for Bland.ai",
        },
        { status: 500 },
      )
    }

    // Log the exact payload being sent (first 1000 chars for debugging)
    console.log("[API_ROUTE] 📋 Exact payload being sent to Bland.ai (first 1000 chars):")
    console.log(serializedPayload.substring(0, 1000))

    // Construct the API URL
    const apiUrl = `https://api.bland.ai/v1/pathway/${pathwayId}`
    console.log("[API_ROUTE] 🌐 API URL:", apiUrl)

    // Make the request to Bland.ai
    console.log("[API_ROUTE] 📡 Making request to Bland.ai...")
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: serializedPayload,
    })

    console.log("[API_ROUTE] 📥 Bland.ai response:")
    console.log("[API_ROUTE] - Status:", response.status)
    console.log("[API_ROUTE] - Status text:", response.statusText)
    console.log("[API_ROUTE] - OK:", response.ok)

    // Check content type before parsing
    const contentType = response.headers.get("content-type")
    console.log("[API_ROUTE] - Content type:", contentType)

    if (!contentType || !contentType.includes("application/json")) {
      const rawResponse = await response.text()
      console.error("[API_ROUTE] ❌ Non-JSON response from Bland.ai:", rawResponse.substring(0, 1000))
      return NextResponse.json(
        {
          status: "error",
          message: "Non-JSON response received from Bland.ai",
          responseStatus: response.status,
          responseStatusText: response.statusText,
          rawResponse: rawResponse.substring(0, 1000),
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[API_ROUTE] 📄 Bland.ai response data:", data)

    if (!response.ok) {
      console.error("[API_ROUTE] ❌ Bland.ai API error:")
      console.error("[API_ROUTE] - Status:", response.status)
      console.error("[API_ROUTE] - Data:", data)
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to update pathway on Bland.ai",
          responseStatus: response.status,
          responseStatusText: response.statusText,
          responseData: data,
        },
        { status: response.status },
      )
    }

    console.log("[API_ROUTE] ✅ Successfully updated pathway on Bland.ai")
    console.log("=".repeat(80))

    return NextResponse.json({
      status: "success",
      message: "Pathway updated successfully",
      data,
    })
  } catch (error) {
    console.error("=".repeat(80))
    console.error("[API_ROUTE] ❌ Unexpected error:", error)
    console.error("=".repeat(80))
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
