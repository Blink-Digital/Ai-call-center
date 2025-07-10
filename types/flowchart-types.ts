// Core ReactFlow types
export interface FlowchartNode {
  id: string
  type: string
  data: any
  position: { x: number; y: number }
  deletable?: boolean
}

export interface FlowchartEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  data?: {
    label?: string
  }
}

// Variable type for the new editor
export interface Variable {
  name: string
  type: "string" | "integer" | "boolean" | "date" | "range" | "email" | "phone"
  description: string
  required: boolean
}

// Fine-tuning example types
export interface ConditionExample {
  label: string
  nodeId: string
}

export interface DialogueExample {
  userInput: string
  aiResponse: string
}

export interface PathwayExample {
  context: string
}

// Node-specific data types
export interface GreetingNodeData {
  text: string
  title?: string
  nodeName?: string
  isStart?: boolean
  isDefault?: boolean
  isGlobal?: boolean
  globalLabel?: string
  temperature?: number
  skipUserResponse?: boolean
  disableRepeatOnSilence?: boolean
  enableSmsReturnNode?: boolean
  disableEndCallTool?: boolean
  variables?: Variable[]
  conditionExamples?: ConditionExample[]
  dialogueExamples?: DialogueExample[]
  pathwayExamples?: PathwayExample[]
  voice?: string
  speed?: number
}

export interface QuestionNodeData {
  text: string
  extractVars?: Array<[string, string, string, boolean]>
  voice?: string
  speed?: number
}

export interface ResponseNodeData {
  text: string
  voice?: string
  speed?: number
}

export interface CustomerResponseNodeData {
  text: string
  expectedResponses?: string[]
  responses?: string[]
  options?: string[]
  isOpenEnded?: boolean
  intentDescription?: string
  extractVars?: Array<[string, string, string, boolean]>
  voice?: string
  speed?: number
}

export interface TransferNodeData {
  text: string
  transferNumber?: string
  phoneNumber?: string
  transferType?: "warm" | "cold"
  voice?: string
  speed?: number
}

export interface EndCallNodeData {
  text: string
  prompt?: string
  voice?: string
  speed?: number
}

export interface WebhookNodeData {
  text: string
  url: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  body?: string
  headers?: Record<string, string>
  extractVars?: Array<[string, string, string, boolean]>
}

export interface ConditionalNodeData {
  text: string
  condition: string
  trueResponse?: string
  falseResponse?: string
  trueLabel?: string
  falseLabel?: string
  voice?: string
  speed?: number
}

// Union type for all node data
export type NodeData =
  | GreetingNodeData
  | QuestionNodeData
  | ResponseNodeData
  | CustomerResponseNodeData
  | TransferNodeData
  | EndCallNodeData
  | WebhookNodeData
  | ConditionalNodeData

// Node types enum
export enum NodeType {
  GREETING = "greetingNode",
  QUESTION = "questionNode",
  RESPONSE = "responseNode",
  CUSTOMER_RESPONSE = "customerResponseNode",
  TRANSFER = "transferNode",
  END_CALL = "endCallNode",
  WEBHOOK = "webhookNode",
  CONDITIONAL = "conditionalNode",
  FACEBOOK_LEAD = "facebookLeadNode",
  GOOGLE_LEAD = "googleLeadNode",
  ZAPIER = "zapierNode",
}

// Bland.ai specific types
export interface BlandNode {
  id: string
  type: string
  data: {
    text?: string
    extractVars?: Array<[string, string, string, boolean]>
    isStart?: boolean
    phone_number?: string
    transfer_type?: string
    url?: string
    method?: string
    body?: string
    headers?: Record<string, string>
    voice?: string
    speed?: number
    prompt?: string
    condition?: string
    trueResponse?: string
    falseResponse?: string
    expectedResponses?: string[]
    // New advanced fields
    temperature?: number
    skipUserResponse?: boolean
    disableRepeatOnSilence?: boolean
    enableSmsReturnNode?: boolean
    disableEndCallTool?: boolean
    isGlobal?: boolean
    globalLabel?: string
    variables?: Variable[]
    conditionExamples?: ConditionExample[]
    dialogueExamples?: DialogueExample[]
    pathwayExamples?: PathwayExample[]
    [key: string]: any
  }
}

export interface BlandEdge {
  id: string
  source: string
  target: string
  label: string
}

export interface BlandFlowchart {
  name: string
  description: string
  nodes: BlandNode[]
  edges: BlandEdge[]
}
