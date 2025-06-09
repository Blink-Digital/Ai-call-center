import type { Node } from "reactflow"

export const initialNodes: Node[] = [
  {
    id: "greeting-1",
    type: "greetingNode",
    position: { x: 250, y: 25 },
    data: {
      text: "Hello! This is an AI assistant calling. How are you today?",
    },
  },
]

export const initialEdges = []
