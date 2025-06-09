/**
 * Default configuration for flowchart nodes and variables
 * This centralizes all default values to make them easier to customize
 */

// Common variables that can be extracted from conversations
export const commonVariables = [
  { name: "Name", type: "string", description: "Customer's name" },
  { name: "Email", type: "string", description: "Customer's email address" },
  { name: "Phone", type: "string", description: "Customer's phone number" },
  { name: "Age", type: "integer", description: "Customer's age" },
  { name: "Zip", type: "integer", description: "Customer's zip code" },
  { name: "State", type: "string", description: "Customer's state" },
  { name: "Income", type: "integer", description: "Customer's income" },
  { name: "Insurance", type: "string", description: "Customer's insurance status" },
  { name: "Interest", type: "string", description: "Customer's interest level" },
]

// Default variable to use when no context is available
export const defaultVariable = {
  name: "Response",
  type: "string",
  description: "Customer's response",
}

// Default customer response options
export const defaultResponseOptions = ["Yes", "No", "Maybe", "I need more information"]

// Default conditional settings
export const defaultConditional = {
  variable: "Response",
  operator: "==",
  value: "Yes",
  trueLabel: "Yes",
  falseLabel: "No",
}

// Default node text templates
export const defaultNodeText = {
  greeting: "Hello! This is an AI assistant calling. How are you today?",
  question: "What can I help you with today?",
  response: "I understand. Let me help you with that.",
  endCall: "Thank you for your time. Goodbye!",
  transfer: "Transferring your call now...",
  webhook: "Send data to external API",
}

// Helper function to get variable type based on name
export function getVariableTypeByName(variableName: string): string {
  const variable = commonVariables.find((v) => v.name.toLowerCase() === variableName.toLowerCase())

  if (variable) {
    return variable.type
  }

  // Intelligent type detection based on variable name
  if (
    variableName.toLowerCase().includes("age") ||
    variableName.toLowerCase().includes("zip") ||
    variableName.toLowerCase().includes("code") ||
    variableName.toLowerCase().includes("income") ||
    variableName.toLowerCase().includes("amount") ||
    variableName.toLowerCase().includes("number") ||
    variableName.toLowerCase().includes("count")
  ) {
    return "integer"
  }

  if (
    variableName.toLowerCase().includes("price") ||
    variableName.toLowerCase().includes("cost") ||
    variableName.toLowerCase().includes("rate")
  ) {
    return "float"
  }

  if (
    variableName.toLowerCase().includes("is") ||
    variableName.toLowerCase().includes("has") ||
    variableName.toLowerCase().includes("can") ||
    variableName.toLowerCase().includes("will")
  ) {
    return "boolean"
  }

  // Default to string for unknown types
  return "string"
}

// Helper function to get a description for a variable
export function getVariableDescription(variableName: string): string {
  const variable = commonVariables.find((v) => v.name.toLowerCase() === variableName.toLowerCase())

  if (variable) {
    return variable.description
  }

  return `Extract the ${variableName.toLowerCase()}`
}
