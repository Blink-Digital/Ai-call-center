"use client"

import type React from "react"

import { useCallback } from "react"
import { useReactFlow } from "reactflow"
import { Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

interface NodeDeleteButtonProps {
  nodeId: string
}

export function NodeDeleteButton({ nodeId }: NodeDeleteButtonProps) {
  const { setNodes, getNode } = useReactFlow()

  const handleDelete = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()

      // Get the node to show its type in the toast
      const node = getNode(nodeId)
      const nodeType = node?.type || "Node"

      setNodes((nodes) => nodes.filter((node) => node.id !== nodeId))

      toast({
        title: `${nodeType} deleted`,
        description: "The node has been removed from the flowchart.",
      })
    },
    [nodeId, setNodes, getNode],
  )

  return (
    <motion.button
      className="absolute -top-3 -right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
      onClick={handleDelete}
      title="Delete node"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Trash2 size={14} />
    </motion.button>
  )
}
