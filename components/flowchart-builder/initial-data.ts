import type { Node, Edge } from "reactflow"

export const initialNodes: Node[] = [
  {
    id: "start-greeting-node",
    type: "greetingNode",
    position: { x: 250, y: 100 },
    data: {
      text: "Hello! Thank you for calling. How can I help you today?",
      isStart: true,
      isDefault: true,
      temperature: 0.2,
      skipUserResponse: false,
      disableRepeatOnSilence: false,
      enableSmsReturnNode: false,
      disableEndCallTool: false,
      isGlobal: false,
      globalLabel: "",
      variables: [],
      conditionExamples: [],
      dialogueExamples: [],
      pathwayExamples: [],
    },
    deletable: false,
  },
]

export const initialEdges: Edge[] = []
