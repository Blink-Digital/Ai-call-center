"use client"
import { Button } from "@/components/ui/button"
import { Plus, Globe, Flag } from "lucide-react"

interface LeftPanelProps {
  onAddNodeClick: () => void
  onGlobalPromptClick: () => void
  onFeatureFlagsClick: () => void
}

export function LeftPanel({ onAddNodeClick, onGlobalPromptClick, onFeatureFlagsClick }: LeftPanelProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col p-4 gap-3">
      {/* Add New Node Button */}
      <Button
        onClick={onAddNodeClick}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-medium shadow-sm transition-all duration-200 hover:shadow-md"
      >
        <Plus className="h-5 w-5" />
        Add new node
      </Button>

      {/* Global Prompt Button */}
      <Button
        onClick={onGlobalPromptClick}
        variant="outline"
        className="w-full rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-medium border-gray-200 hover:bg-gray-50 transition-all duration-200 bg-transparent"
      >
        <Globe className="h-4 w-4" />
        Global Prompt
      </Button>

      {/* Feature Flags Button */}
      <Button
        onClick={onFeatureFlagsClick}
        variant="outline"
        className="w-full rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-medium border-gray-200 hover:bg-gray-50 transition-all duration-200 bg-transparent"
      >
        <Flag className="h-4 w-4" />
        Feature Flags
      </Button>
    </div>
  )
}
