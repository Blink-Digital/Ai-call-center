import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { prompt, model = "openai/gpt-4o-mini", debug = false } = await req.json()

  if (!prompt) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 })
  }

  console.log(`Generating pathway with OpenRouter, model: ${model}, prompt:`, prompt)

  const systemPrompt = `
You are an expert conversation designer specializing in creating natural, effective phone call flows for AI agents. You understand human psychology, sales methodology, and customer service best practices.

CONVERSATION DESIGN PRINCIPLES:
1. Start with a warm, professional greeting that establishes purpose and builds rapport
2. Use open-ended questions early to understand customer needs and situation
3. Follow with specific qualification questions based on their responses
4. Address common objections with empathy and clear, factual information
5. Include natural transitions between conversation topics using bridging phrases
6. Provide clear next steps or call-to-actions at closing
7. Use conditional branching to handle different customer scenarios naturally
8. Keep each node focused on ONE clear objective or question
9. Anticipate realistic customer responses and objections
10. Maintain a helpful, consultative tone throughout

CONVERSATION STRUCTURE FRAMEWORK:
- Introduction (1-2 nodes): Establish rapport, company identity, and call purpose
- Discovery (2-3 nodes): Understand customer situation, needs, and pain points
- Qualification (3-5 nodes): Determine fit through specific, relevant questions
- Value Proposition (2-3 nodes): Present solutions tailored to their situation
- Objection Handling (2-4 nodes): Address concerns with specific, empathetic responses
- Closing (1-2 nodes): Clear next steps, scheduling, or transfer to specialist

NODE TYPES AND BEST PRACTICES:
- greeting: Warm introduction with company name, agent name, and clear purpose
- question: One focused question per node, directly connects to next logical node
- response: Only use for providing information or acknowledging customer input before major transitions
- transfer: Provide clear context for why transfer is happening and what to expect
- end-call: Thank customer and provide specific follow-up expectations

CRITICAL RULE: DO NOT create intermediate response nodes that just say "Waiting for customer response" or similar. Question nodes should connect directly to the next logical node in the conversation flow.

EXAMPLE 1 - MEDICARE INSURANCE QUALIFICATION FLOW:
{
  "nodes": [
    {
      "id": "greeting_1",
      "type": "greeting",
      "data": {
        "text": "Hello! This is Sarah from HealthGuard Insurance. I'm calling because you recently showed interest in learning about Medicare Supplement plans. I have just a few minutes - is this a good time to chat about your Medicare coverage?"
      },
      "position": { "x": 250, "y": 0 }
    },
    {
      "id": "discovery_1",
      "type": "question",
      "data": {
        "text": "Perfect! I'd love to help you understand your Medicare options better. First, could you tell me - are you currently on Medicare Part A and B, or are you approaching your 65th birthday?"
      },
      "position": { "x": 250, "y": 100 }
    },
    {
      "id": "qualification_1",
      "type": "question",
      "data": {
        "text": "Great! Now, do you currently have any supplemental insurance to help cover the gaps that Medicare doesn't pay for - things like deductibles, copays, or coinsurance?"
      },
      "position": { "x": 250, "y": 200 }
    },
    {
      "id": "value_prop_1",
      "type": "response",
      "data": {
        "text": "I understand. Many people don't realize that Medicare only covers about 80% of your medical costs. A Medicare Supplement plan can help cover those remaining costs, potentially saving you thousands of dollars. Would you like me to explain how this works?"
      },
      "position": { "x": 250, "y": 300 }
    },
    {
      "id": "interest_check",
      "type": "question",
      "data": {
        "text": "Based on what you've told me, I believe our Plan G supplement could save you significant money on your out-of-pocket costs. Would you like me to connect you with one of our Medicare specialists who can show you the exact savings for your zip code?"
      },
      "position": { "x": 250, "y": 400 }
    },
    {
      "id": "transfer_qualified",
      "type": "transfer",
      "data": {
        "text": "Excellent! I'm going to connect you with one of our Medicare specialists who can walk you through the specific plans available in your area and help you find the best coverage for your needs. Please hold for just a moment."
      },
      "position": { "x": 150, "y": 500 }
    },
    {
      "id": "reschedule_call",
      "type": "response",
      "data": {
        "text": "I completely understand. When would be a better time for me to call you back? I can call tomorrow morning, afternoon, or would another day work better?"
      },
      "position": { "x": 350, "y": 100 }
    },
    {
      "id": "end_call_polite",
      "type": "end-call",
      "data": {
        "text": "Thank you for your time today. I'll make sure to call you back at the time we discussed. Have a wonderful day!"
      },
      "position": { "x": 250, "y": 600 }
    }
  ],
  "edges": [
    { "id": "edge_1_2", "source": "greeting_1", "target": "discovery_1" },
    { "id": "edge_1_reschedule", "source": "greeting_1", "target": "reschedule_call" },
    { "id": "edge_2_3", "source": "discovery_1", "target": "qualification_1" },
    { "id": "edge_3_4", "source": "qualification_1", "target": "value_prop_1" },
    { "id": "edge_4_5", "source": "value_prop_1", "target": "interest_check" },
    { "id": "edge_5_transfer", "source": "interest_check", "target": "transfer_qualified" },
    { "id": "edge_5_end", "source": "interest_check", "target": "end_call_polite" },
    { "id": "edge_reschedule_end", "source": "reschedule_call", "target": "end_call_polite" },
    { "id": "edge_transfer_end", "source": "transfer_qualified", "target": "end_call_polite" }
  ]
}

EXAMPLE 2 - HEALTHCARE APPOINTMENT SCHEDULING FLOW:
{
  "nodes": [
    {
      "id": "greeting_1",
      "type": "greeting",
      "data": {
        "text": "Hello! This is Jennifer from Wellness Medical Center. I'm calling to follow up on your recent inquiry about scheduling a consultation with Dr. Martinez. How are you doing today?"
      },
      "position": { "x": 250, "y": 0 }
    },
    {
      "id": "discovery_1",
      "type": "question",
      "data": {
        "text": "Wonderful! You had reached out about some concerns with joint pain and mobility. Dr. Martinez specializes in non-surgical treatments that have helped many of our patients. Are you still experiencing those symptoms?"
      },
      "position": { "x": 250, "y": 100 }
    },
    {
      "id": "urgency_assessment",
      "type": "question",
      "data": {
        "text": "I'm sorry to hear that. On a scale of 1 to 10, how would you rate your pain level currently? And is it affecting your daily activities like walking, sleeping, or work?"
      },
      "position": { "x": 250, "y": 200 }
    },
    {
      "id": "scheduling_offer",
      "type": "response",
      "data": {
        "text": "I understand how frustrating that must be. Dr. Martinez has helped many patients with similar symptoms using advanced, non-invasive treatments. I have some openings this week - would you prefer a morning or afternoon appointment?"
      },
      "position": { "x": 250, "y": 300 }
    },
    {
      "id": "appointment_preference",
      "type": "question",
      "data": {
        "text": "Perfect! I can schedule you for Thursday at 10:30 AM with Dr. Martinez. The consultation will take about 45 minutes, and we'll send you some forms to fill out beforehand. Does Thursday morning work for you?"
      },
      "position": { "x": 250, "y": 400 }
    },
    {
      "id": "confirm_appointment",
      "type": "response",
      "data": {
        "text": "Excellent! You're all set for Thursday at 10:30 AM. You'll receive a confirmation text and email with directions and forms. Dr. Martinez looks forward to helping you feel better."
      },
      "position": { "x": 150, "y": 500 }
    },
    {
      "id": "callback_scheduling",
      "type": "response",
      "data": {
        "text": "No problem at all. When would be a good time for me to call you back to schedule? I can call tomorrow morning, or would later this week work better?"
      },
      "position": { "x": 350, "y": 400 }
    },
    {
      "id": "end_call_scheduled",
      "type": "end-call",
      "data": {
        "text": "Have a great day, and we'll see you Thursday morning!"
      },
      "position": { "x": 150, "y": 600 }
    },
    {
      "id": "end_call_callback",
      "type": "end-call",
      "data": {
        "text": "Perfect! I'll call you back tomorrow morning to get you scheduled. In the meantime, if your symptoms worsen, please don't hesitate to call our office directly. Take care!"
      },
      "position": { "x": 350, "y": 500 }
    }
  ],
  "edges": [
    { "id": "edge_1_2", "source": "greeting_1", "target": "discovery_1" },
    { "id": "edge_1_callback", "source": "greeting_1", "target": "callback_scheduling" },
    { "id": "edge_2_3", "source": "discovery_1", "target": "urgency_assessment" },
    { "id": "edge_2_end", "source": "discovery_1", "target": "end_call_callback" },
    { "id": "edge_3_4", "source": "urgency_assessment", "target": "scheduling_offer" },
    { "id": "edge_4_5", "source": "scheduling_offer", "target": "appointment_preference" },
    { "id": "edge_5_confirm", "source": "appointment_preference", "target": "confirm_appointment" },
    { "id": "edge_5_callback", "source": "appointment_preference", "target": "callback_scheduling" },
    { "id": "edge_confirm_end", "source": "confirm_appointment", "target": "end_call_scheduled" },
    { "id": "edge_callback_end", "source": "callback_scheduling", "target": "end_call_callback" }
  ]
}

CRITICAL IMPLEMENTATION RULES:
1. Always start with a "greeting" node that includes company name and call purpose
2. Question nodes should connect DIRECTLY to the next logical node (another question, response, transfer, or end-call)
3. DO NOT create intermediate "customer-response" or "AI Response" nodes that just wait for input
4. Use "response" nodes ONLY when you need to provide information or acknowledge before a major transition
5. Each question should have a clear purpose and expected outcome
6. Include natural objection handling paths (not interested, bad timing, etc.)
7. Position nodes logically with greeting at top (y: 0) and end nodes at bottom
8. Use realistic, professional language appropriate for the industry
9. Include specific details that make the conversation feel authentic
10. Always provide clear next steps or resolution paths

RESPONSE FORMAT:
Return ONLY a valid JSON object with "nodes" and "edges" arrays. No markdown formatting, no explanations, no code blocks.

User prompt: "${prompt}"
`

  try {
    console.log("Calling OpenRouter API...")

    // Get API key from environment variable
    const apiKey = process.env.OPENROUTER_API_KEY

    // If no API key is found, return an error
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "No OpenRouter API key found",
          message: "Please set your OpenRouter API key in the environment variables",
        },
        { status: 401 },
      )
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bland-flowchart-builder.vercel.app/", // Replace with your actual domain
        "X-Title": "Bland.ai Flowchart Builder",
      },
      body: JSON.stringify({
        model: model, // Now using the model parameter with default of gpt-4o-mini
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.3, // Lower temperature for more consistent results
      }),
    })

    console.log("OpenRouter API response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenRouter API error:", errorData)
      return NextResponse.json(
        {
          error: "Failed to generate pathway with OpenRouter",
          details: errorData,
          status: response.status,
        },
        { status: 500 },
      )
    }

    const result = await response.json()
    console.log("OpenRouter API response received")

    const content = result.choices?.[0]?.message?.content

    if (!content) {
      console.error("No content in OpenRouter response")
      return NextResponse.json(
        {
          error: "No content in OpenRouter response",
          rawResponse: result,
        },
        { status: 500 },
      )
    }

    try {
      console.log("Parsing JSON from OpenRouter response")
      // Clean the content to handle potential markdown formatting
      const cleaned = content
        .trim()
        .replace(/^```(json|javascript|js)?\n/i, "")
        .replace(/\n```$/i, "")

      console.log("Cleaned content:", cleaned.substring(0, 100) + "...")

      // Try to parse the JSON
      let parsed
      try {
        parsed = JSON.parse(cleaned)
      } catch (parseError) {
        console.error("Initial JSON parsing failed:", parseError)

        // Try more aggressive cleaning for malformed JSON
        const moreAggressiveCleaning = cleaned
          .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
          .replace(/[\u2018\u2019]/g, "'") // Replace smart apostrophes
          .replace(/\n/g, " ") // Replace newlines with spaces
          .replace(/\s+/g, " ") // Collapse multiple spaces
          .trim()

        console.log("Trying more aggressive cleaning:", moreAggressiveCleaning.substring(0, 100) + "...")

        try {
          parsed = JSON.parse(moreAggressiveCleaning)
        } catch (secondParseError) {
          console.error("Second JSON parsing attempt failed:", secondParseError)

          // If debug mode is enabled, return the raw content for debugging
          if (debug) {
            return NextResponse.json(
              {
                error: "Failed to parse JSON",
                message: secondParseError.message,
                rawContent: content,
                cleanedContent: cleaned,
                moreAggressiveCleaning: moreAggressiveCleaning,
              },
              { status: 500 },
            )
          }

          throw secondParseError
        }
      }

      // Validate the response
      if (!parsed.nodes || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
        console.error("Invalid JSON structure: missing or empty nodes array")

        // If debug mode is enabled, return the parsed content for debugging
        if (debug) {
          return NextResponse.json(
            {
              error: "Invalid JSON structure: missing or empty nodes array",
              parsedContent: parsed,
              rawContent: content,
            },
            { status: 500 },
          )
        }

        return NextResponse.json(
          {
            error: "Invalid JSON structure: missing or empty nodes array",
          },
          { status: 500 },
        )
      }

      if (!parsed.edges || !Array.isArray(parsed.edges)) {
        console.error("Invalid JSON structure: missing or invalid edges array")

        // If debug mode is enabled, return the parsed content for debugging
        if (debug) {
          return NextResponse.json(
            {
              error: "Invalid JSON structure: missing or invalid edges array",
              parsedContent: parsed,
              rawContent: content,
            },
            { status: 500 },
          )
        }

        return NextResponse.json(
          {
            error: "Invalid JSON structure: missing or invalid edges array",
          },
          { status: 500 },
        )
      }

      // Process the flow to ensure Yes/No questions use customer-response nodes
      ensureYesNoQuestionsUseCustomerResponse(parsed.nodes, parsed.edges)

      console.log(`Successfully parsed JSON with ${parsed.nodes.length} nodes and ${parsed.edges.length} edges`)

      // If debug mode is enabled, include the raw content in the response
      if (debug) {
        return NextResponse.json({
          ...parsed,
          _debug: {
            rawContent: content,
            cleanedContent: cleaned,
          },
        })
      }

      return NextResponse.json(parsed)
    } catch (e) {
      console.error("Failed to parse JSON from OpenRouter:", e)
      console.error("Raw content:", content)

      // If debug mode is enabled, return the raw content for debugging
      if (debug) {
        return NextResponse.json(
          {
            error: "Invalid JSON from OpenRouter",
            message: e.message,
            rawContent: content,
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          error: "Invalid JSON from OpenRouter",
          message: e.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error calling OpenRouter:", error)

    // If debug mode is enabled, return more detailed error information
    if (debug) {
      return NextResponse.json(
        {
          error: "Failed to generate pathway with OpenRouter",
          message: error.message,
          stack: error.stack,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to generate pathway with OpenRouter",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

/**
 * Ensure that all Yes/No questions use customer-response nodes with proper branching
 */
function ensureYesNoQuestionsUseCustomerResponse(nodes, edges) {
  // Find all question nodes that are Yes/No questions
  const yesNoQuestionNodes = nodes.filter(
    (node) =>
      (node.type === "question" || node.type.toLowerCase().includes("question")) &&
      node.data &&
      node.data.text &&
      (node.data.text.toLowerCase().includes("are you") ||
        node.data.text.toLowerCase().includes("do you") ||
        node.data.text.toLowerCase().includes("have you") ||
        node.data.text.toLowerCase().includes("would you") ||
        node.data.text.toLowerCase().includes("can you") ||
        node.data.text.toLowerCase().includes("will you") ||
        node.data.text.toLowerCase().includes("is this") ||
        node.data.text.toLowerCase().includes("is that") ||
        node.data.text.toLowerCase().includes("are they") ||
        node.data.text.toLowerCase().includes("did you") ||
        node.data.text.toLowerCase().includes("should") ||
        node.data.text.toLowerCase().includes("could") ||
        node.data.text.toLowerCase().includes("interested") ||
        node.data.text.toLowerCase().includes("want to") ||
        node.data.text.toLowerCase().includes("medicare") ||
        node.data.text.toLowerCase().includes("medicaid") ||
        node.data.text.toLowerCase().includes("insurance") ||
        node.data.text.toLowerCase().includes("coverage") ||
        // Check for question marks in short questions (likely yes/no)
        (node.data.text.includes("?") && node.data.text.length < 100)),
  )

  // Process each Yes/No question node
  for (const questionNode of yesNoQuestionNodes) {
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

    // If the next node is already a customer response node, ensure it has Yes/No options
    if (nextIsCustomerResponse) {
      const customerResponseNode = targetNodes.find(
        (node) =>
          node.type === "customer-response" ||
          node.type.toLowerCase().includes("customer") ||
          node.type.toLowerCase().includes("user-response"),
      )

      if (customerResponseNode) {
        // Ensure the node has options array with Yes/No
        if (!customerResponseNode.data.options || !Array.isArray(customerResponseNode.data.options)) {
          customerResponseNode.data.options = ["Yes", "No"]
        } else if (
          !customerResponseNode.data.options.includes("Yes") ||
          !customerResponseNode.data.options.includes("No")
        ) {
          customerResponseNode.data.options = ["Yes", "No"]
        }

        // Ensure the node has a variableName
        if (!customerResponseNode.data.variableName) {
          // Determine variable name based on question content
          let variableName = "response"

          if (questionNode.data.text.toLowerCase().includes("medicare")) {
            variableName = "medicare_status"
          } else if (questionNode.data.text.toLowerCase().includes("medicaid")) {
            variableName = "medicaid_status"
          } else if (questionNode.data.text.toLowerCase().includes("insurance")) {
            variableName = "insurance_status"
          } else if (questionNode.data.text.toLowerCase().includes("coverage")) {
            variableName = "coverage_status"
          }

          customerResponseNode.data.variableName = variableName
        }

        // Find outgoing edges from the customer response node
        const customerResponseOutgoingEdges = edges.filter((edge) => edge.source === customerResponseNode.id)

        // Check if we have edges for both Yes and No options
        const hasYesEdge = customerResponseOutgoingEdges.some((edge) => edge.label === "Yes")
        const hasNoEdge = customerResponseOutgoingEdges.some((edge) => edge.label === "No")

        // If we're missing the Yes edge, create one to the next node in the flow
        if (!hasYesEdge) {
          // Find the next node in the flow
          const nodeIndex = nodes.findIndex((node) => node.id === customerResponseNode.id)
          if (nodeIndex >= 0 && nodeIndex < nodes.length - 1) {
            const nextNode = nodes[nodeIndex + 1]
            edges.push({
              id: `edge_${customerResponseNode.id}_${nextNode.id}_Yes`,
              source: customerResponseNode.id,
              target: nextNode.id,
              label: "Yes",
            })
          }
        }

        // If we're missing the No edge, create one to an end call node
        if (!hasNoEdge) {
          // Check if we already have an end call node
          let endCallNode = nodes.find(
            (node) =>
              node.type === "end-call" ||
              node.type.toLowerCase().includes("end") ||
              (node.data &&
                node.data.text &&
                (node.data.text.toLowerCase().includes("thank") ||
                  node.data.text.toLowerCase().includes("goodbye") ||
                  node.data.text.toLowerCase().includes("great day"))),
          )

          // If we don't have an end call node, create one
          if (!endCallNode) {
            endCallNode = {
              id: `end_call_${Date.now()}`,
              type: "end-call",
              data: {
                text: "Thank you for your time. Have a great day!",
              },
              position: {
                x: customerResponseNode.position?.x + 200 || 450,
                y: customerResponseNode.position?.y || 300,
              },
            }
            nodes.push(endCallNode)
          }

          // Create an edge from the customer response node to the end call node
          edges.push({
            id: `edge_${customerResponseNode.id}_${endCallNode.id}_No`,
            source: customerResponseNode.id,
            target: endCallNode.id,
            label: "No",
          })
        }
      }
    } else {
      // The next node is not a customer response node, so we need to create one
      // Check if the next node is a response node
      const responseNode = targetNodes.find(
        (node) =>
          node.type === "response" ||
          node.type === "AI Response" ||
          (node.type.toLowerCase().includes("response") && !node.type.toLowerCase().includes("customer")),
      )

      if (responseNode) {
        console.log("Converting response node after Yes/No question to customer response node")

        // Determine variable name based on question content
        let variableName = "response"

        if (questionNode.data.text.toLowerCase().includes("medicare")) {
          variableName = "medicare_status"
        } else if (questionNode.data.text.toLowerCase().includes("medicaid")) {
          variableName = "medicaid_status"
        } else if (questionNode.data.text.toLowerCase().includes("insurance")) {
          variableName = "insurance_status"
        } else if (questionNode.data.text.toLowerCase().includes("coverage")) {
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
            intentDescription: questionNode.data.text || "Capture customer response",
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

        // If there are outgoing edges, connect the Yes option to the first target
        if (responseOutgoingEdges.length > 0) {
          edges.push({
            id: `edge_${customerResponseNode.id}_${responseOutgoingEdges[0].target}_Yes`,
            source: customerResponseNode.id,
            target: responseOutgoingEdges[0].target,
            label: "Yes",
          })
        }

        // Check if we already have an end call node
        let endCallNode = nodes.find(
          (node) =>
            node.type === "end-call" ||
            node.type.toLowerCase().includes("end") ||
            (node.data &&
              node.data.text &&
              (node.data.text.toLowerCase().includes("thank") ||
                node.data.text.toLowerCase().includes("goodbye") ||
                node.data.text.toLowerCase().includes("great day"))),
        )

        // If we don't have an end call node, create one
        if (!endCallNode) {
          endCallNode = {
            id: `end_call_${Date.now()}`,
            type: "end-call",
            data: {
              text: "Thank you for your time. Have a great day!",
            },
            position: {
              x: customerResponseNode.position?.x + 200 || 450,
              y: customerResponseNode.position?.y || 300,
            },
          }
          nodes.push(endCallNode)
        }

        // Create an edge from the customer response node to the end call node
        edges.push({
          id: `edge_${customerResponseNode.id}_${endCallNode.id}_No`,
          source: customerResponseNode.id,
          target: endCallNode.id,
          label: "No",
        })

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
  }
}
