import type { Node, Edge } from "reactflow"

export function createMedicareQualificationFlow() {
  // Create nodes for the Medicare qualification flow
  const nodes: Node[] = [
    {
      id: "greeting",
      type: "greeting",
      data: {
        text: "Hello, this is [Company Name]. I'm calling about Medicare benefits you may qualify for. How are you today?",
      },
      position: { x: 250, y: 0 },
    },
    {
      id: "question_medicare",
      type: "question",
      data: {
        text: "Are you currently on Medicare or Medicaid?",
      },
      position: { x: 250, y: 100 },
    },
    {
      id: "customer_response_medicare",
      type: "customer-response",
      data: {
        text: "Waiting for customer response",
        options: ["Yes", "No"],
        responses: ["Yes", "No"],
        variableName: "medicare_status",
        intentDescription: "Capture if customer is on Medicare or Medicaid",
      },
      position: { x: 250, y: 200 },
    },
    {
      id: "question_age",
      type: "question",
      data: {
        text: "How old are you?",
      },
      position: { x: 100, y: 300 },
    },
    {
      id: "customer_response_age",
      type: "customer-response",
      data: {
        text: "Waiting for customer response",
        options: ["Under 65", "65 or older"],
        responses: ["Under 65", "65 or older"],
        variableName: "age",
        intentDescription: "Capture customer's age",
      },
      position: { x: 100, y: 400 },
    },
    {
      id: "question_name",
      type: "question",
      data: {
        text: "What is your name?",
      },
      position: { x: 400, y: 300 },
    },
    {
      id: "customer_response_name",
      type: "customer-response",
      data: {
        text: "Waiting for customer response",
        options: ["Name"],
        responses: ["Name"],
        variableName: "name",
        intentDescription: "Capture customer's name",
        isOpenEnded: true,
      },
      position: { x: 400, y: 400 },
    },
    {
      id: "question_zip",
      type: "question",
      data: {
        text: "What is your ZIP code?",
      },
      position: { x: 400, y: 500 },
    },
    {
      id: "customer_response_zip",
      type: "customer-response",
      data: {
        text: "Waiting for customer response",
        options: ["ZIP"],
        responses: ["ZIP"],
        variableName: "zip_code",
        intentDescription: "Capture customer's ZIP code",
        isOpenEnded: true,
      },
      position: { x: 400, y: 600 },
    },
    {
      id: "transfer_node",
      type: "transfer",
      data: {
        text: "Great! I'll transfer you to a licensed agent who can help you with Medicare benefits.",
        transferNumber: "+18445940353",
        transferType: "warm",
      },
      position: { x: 100, y: 500 },
    },
    {
      id: "end_call",
      type: "end-call",
      data: {
        text: "I understand. Unfortunately, you need to be at least 65 years old or on Medicare to qualify. Thank you for your time and have a great day!",
      },
      position: { x: 100, y: 600 },
    },
  ]

  // Create edges to connect the nodes
  const edges: Edge[] = [
    {
      id: "edge_greeting_question_medicare",
      source: "greeting",
      target: "question_medicare",
      type: "custom",
      data: { label: "next" },
    },
    {
      id: "edge_question_medicare_customer_response_medicare",
      source: "question_medicare",
      target: "customer_response_medicare",
      type: "custom",
      data: { label: "next" },
    },
    {
      id: "edge_customer_response_medicare_question_age",
      source: "customer_response_medicare",
      target: "question_age",
      sourceHandle: "response-1", // No option
      type: "custom",
      data: { label: "No" },
    },
    {
      id: "edge_customer_response_medicare_question_name",
      source: "customer_response_medicare",
      target: "question_name",
      sourceHandle: "response-0", // Yes option
      type: "custom",
      data: { label: "Yes" },
    },
    {
      id: "edge_question_age_customer_response_age",
      source: "question_age",
      target: "customer_response_age",
      type: "custom",
      data: { label: "next" },
    },
    {
      id: "edge_customer_response_age_transfer_node",
      source: "customer_response_age",
      target: "transfer_node",
      sourceHandle: "response-1", // 65 or older option
      type: "custom",
      data: { label: "65 or older" },
    },
    {
      id: "edge_customer_response_age_end_call",
      source: "customer_response_age",
      target: "end_call",
      sourceHandle: "response-0", // Under 65 option
      type: "custom",
      data: { label: "Under 65" },
    },
    {
      id: "edge_question_name_customer_response_name",
      source: "question_name",
      target: "customer_response_name",
      type: "custom",
      data: { label: "next" },
    },
    {
      id: "edge_customer_response_name_question_zip",
      source: "customer_response_name",
      target: "question_zip",
      type: "custom",
      data: { label: "next" },
    },
    {
      id: "edge_question_zip_customer_response_zip",
      source: "question_zip",
      target: "customer_response_zip",
      type: "custom",
      data: { label: "next" },
    },
    {
      id: "edge_customer_response_zip_transfer_node",
      source: "customer_response_zip",
      target: "transfer_node",
      type: "custom",
      data: { label: "next" },
    },
  ]

  return {
    nodes,
    edges,
    name: "Medicare Qualification Flow",
    description: "A call flow to qualify potential Medicare customers",
  }
}
