"use client"

import type React from "react"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

interface NodeDeleteButtonProps {
  nodeId: string
  onDelete: (nodeId: string) => void
  isStart?: boolean
  isDefault?: boolean
  deletable?: boolean
}

export function NodeDeleteButton({ nodeId, onDelete, isStart, isDefault, deletable = true }: NodeDeleteButtonProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Prevent deletion of start/default nodes
    if (isStart || isDefault || !deletable) {
      toast({
        title: "Cannot delete node",
        description: "This is a protected start node and cannot be deleted.",
        variant: "destructive",
      })
      return
    }

    onDelete(nodeId)
    toast({
      title: "Node deleted",
      description: "The node has been removed from your flowchart.",
    })
  }

  // Don't show delete button for protected nodes
  if (isStart || isDefault || !deletable) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  )
}
