"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import type { Edge } from "reactflow"

interface EdgeEditorDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedEdge: Edge | null
  onUpdateEdge: (edgeId: string, updates: any) => void
}

export function EdgeEditorDrawer({ isOpen, onClose, selectedEdge, onUpdateEdge }: EdgeEditorDrawerProps) {
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [alwaysPick, setAlwaysPick] = useState(false)

  // Load edge data when selectedEdge changes
  useEffect(() => {
    if (selectedEdge) {
      setLabel(selectedEdge.data?.label || "")
      setDescription(selectedEdge.data?.description || "")
      setAlwaysPick(selectedEdge.data?.alwaysPick || false)
    }
  }, [selectedEdge])

  const handleSave = () => {
    if (!selectedEdge) return

    if (!label.trim()) {
      toast({
        title: "Validation Error",
        description: "Pathway label is required.",
        variant: "destructive",
      })
      return
    }

    const updates = {
      label: label.trim(),
      description: description.trim(),
      alwaysPick,
    }

    onUpdateEdge(selectedEdge.id, updates)

    toast({
      title: "Pathway Updated",
      description: `Pathway "${label.trim()}" has been updated successfully.`,
    })

    onClose()
  }

  const handleCancel = () => {
    // Reset form to original values
    if (selectedEdge) {
      setLabel(selectedEdge.data?.label || "")
      setDescription(selectedEdge.data?.description || "")
      setAlwaysPick(selectedEdge.data?.alwaysPick || false)
    }
    onClose()
  }

  if (!isOpen || !selectedEdge) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Pathway</h2>
            <p className="text-sm text-gray-600 mt-1">How should the agent decide?</p>
            <p className="text-sm text-gray-500 mt-1">Choose how the agent should decide which pathway to take.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Pathway Label Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pathway Label</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter a label that describes when this pathway should be chosen. Keep it short and succinct e.g. user
                  said yes
                </p>
                <div className="space-y-2">
                  <Label htmlFor="pathway-label">Label</Label>
                  <Textarea
                    id="pathway-label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="User responded"
                    className="min-h-[80px] resize-none"
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 text-right">{label.length}/100</div>
                </div>
              </div>

              {/* Description Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Provide more information and describe when this pathway should be chosen. This is optional but gives
                  the agent more context about when to choose this pathway.
                </p>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe when this pathway should be chosen..."
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 pt-6">
                {/* Always Pick Toggle */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Always pick this pathway</h3>
                    <p className="text-sm text-gray-600">
                      When enabled, this pathway will always be chosen regardless of the conversation context.
                    </p>
                  </div>
                  <Switch checked={alwaysPick} onCheckedChange={setAlwaysPick} className="ml-4 mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!label.trim()}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
