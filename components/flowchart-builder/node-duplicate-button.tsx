"use client"

import type React from "react"

import { useCallback } from "react"
import { useReactFlow } from "reactflow"
import { Copy } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

interface NodeDuplicateButtonProps {
  nodeId: string
}

export function NodeDuplicateButton({ nodeId }: NodeDuplicateButtonProps) {
  const { getNode, setNodes } = useReactFlow()

  const handleDuplicate = useCallback(
    (event: React.MouseEvent) => {
      // Stop event propagation to prevent node selection
      event.stopPropagation()

      const originalNode = getNode(nodeId)
      if (!originalNode) return

      // Create a duplicate node with a new ID and offset position
      const duplicateNode = {
        ...originalNode,
        id: `${originalNode.type}_${Date.now()}`, // Ensure unique ID with timestamp
        position: {
          x: originalNode.position.x + 20,
          y: originalNode.position.y + 20,
        },
        // Deep clone the data object to avoid reference issues
        data: JSON.parse(JSON.stringify(originalNode.data)),
        selected: false,
      }

      // Add the new node to the nodes array
      setNodes((nodes) => [...nodes, duplicateNode])

      toast({
        title: "Node duplicated",
        description: "A copy of the node has been created.",
      })
    },
    [nodeId, getNode, setNodes],
  )

  return (
    <motion.button
      variant="secondary"
      size="icon"
      className="absolute -top-3 -right-12 h-7 w-7 rounded-full bg-blue-500 text-white shadow-md z-10 hover:bg-blue-600 transition-colors"
      onClick={handleDuplicate}
      title="Duplicate node"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Copy size={14} />
      <span className="sr-only">Duplicate node</span>
    </motion.button>
  )
}
