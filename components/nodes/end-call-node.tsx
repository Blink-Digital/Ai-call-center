"use client"

import type React from "react"
import { Handle, Position } from "reactflow"
import { PhoneOff } from "lucide-react"

interface EndCallNodeData {
  nodeTitle?: string
  text?: string
  prompt?: string
}

interface EndCallNodeProps {
  data: EndCallNodeData
  selected?: boolean
}

export function EndCallNode({ data, selected }: EndCallNodeProps) {
  const nodeTitle = data.nodeTitle || "End Call"
  const prompt = data.text || data.prompt || "Thanks for calling. We're ending the call here."

  return (
    <div
      className={`relative bg-gradient-to-br from-red-50 to-red-100 border-2 rounded-xl p-4 min-w-[200px] max-w-[280px] shadow-sm transition-all duration-200 ${
        selected ? "border-red-500 shadow-lg" : "border-red-200 hover:border-red-300"
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-red-400 border-2 border-white"
        style={{ top: -6 }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
          <PhoneOff className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-red-800 text-sm truncate">🛑 End Call</h3>
          {nodeTitle && nodeTitle !== "End Call" && <p className="text-xs text-red-600 truncate">{nodeTitle}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="text-xs text-red-700 bg-red-50 rounded-lg p-2 border border-red-200">
          <p className="font-medium mb-1">Final Message:</p>
          <p className="line-clamp-3">{prompt}</p>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="absolute top-2 right-2">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      </div>
    </div>
  )
}

// End Call Node Configuration Component
export function EndCallNodeConfig({ node, updateNode }: { node: any; updateNode: (updates: any) => void }) {
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNode({
      text: e.target.value,
      prompt: e.target.value, // Keep both for compatibility
    })
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNode({
      nodeTitle: e.target.value,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🛑</span>
        <h2 className="text-lg font-semibold">End Call</h2>
      </div>

      {/* Node Title */}
      <div>
        <label className="text-sm font-medium block mb-1">Node Title</label>
        <input
          type="text"
          className="w-full border rounded p-2 text-sm"
          value={node.data?.nodeTitle || ""}
          placeholder="Internal label (optional)"
          onChange={handleTitleChange}
        />
        <p className="text-xs text-gray-500 mt-1">Internal label for organization (not spoken).</p>
      </div>

      {/* Prompt */}
      <div>
        <label className="text-sm font-medium block mb-1">Prompt</label>
        <textarea
          className="w-full border rounded p-2 mt-1 min-h-[100px] text-sm"
          value={node.data?.text || node.data?.prompt || ""}
          placeholder="Thanks for calling. We're ending the call here."
          onChange={handlePromptChange}
        />
        <p className="text-xs text-gray-500 mt-1">This is the last thing the agent will say before ending the call.</p>
      </div>
    </div>
  )
}

export default EndCallNode
