"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  MessageSquare,
  Phone,
  Webhook,
  Zap,
  Facebook,
  Globe,
  HelpCircle,
  PhoneCall,
  MessageCircle,
} from "lucide-react"

interface AddNodePanelProps {
  isOpen: boolean
  onClose: () => void
  onAddNode: (nodeType: string, nodeData: any) => void
}

export function AddNodePanel({ isOpen, onClose, onAddNode }: AddNodePanelProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Node types available for adding (Greeting node removed)
  const nodeTypes = [
    {
      type: "questionNode",
      name: "Question",
      description: "Ask the caller a question",
      icon: HelpCircle,
      category: "Basic",
      defaultData: {
        text: "What would you like to know about?",
        temperature: 0.2,
      },
    },
    {
      type: "responseNode",
      name: "Response",
      description: "Provide information or response to the caller",
      icon: MessageCircle,
      category: "Basic",
      defaultData: {
        text: "Thank you for your question. Here's the information you requested...",
        temperature: 0.2,
      },
    },
    {
      type: "customerResponseNode",
      name: "Customer Response",
      description: "Capture and process customer input",
      icon: MessageSquare,
      category: "Input",
      defaultData: {
        text: "Please tell me more about that.",
        options: ["Yes", "No", "Maybe"],
        temperature: 0.2,
      },
    },
    {
      type: "transferNode",
      name: "Transfer Call",
      description: "Transfer the call to another number",
      icon: PhoneCall,
      category: "Actions",
      defaultData: {
        text: "Let me transfer you to the right department.",
        transferNumber: "",
        temperature: 0.2,
      },
    },
    {
      type: "endCallNode",
      name: "End Call",
      description: "End the conversation",
      icon: Phone,
      category: "Actions",
      defaultData: {
        text: "Thank you for calling. Have a great day!",
        temperature: 0.2,
      },
    },
    {
      type: "webhookNode",
      name: "Webhook",
      description: "Send data to an external API",
      icon: Webhook,
      category: "Integrations",
      defaultData: {
        text: "Processing your request...",
        url: "",
        method: "POST",
        temperature: 0.2,
      },
    },
    {
      type: "zapierNode",
      name: "Zapier",
      description: "Trigger a Zapier automation",
      icon: Zap,
      category: "Integrations",
      defaultData: {
        text: "Connecting to your automation...",
        zapierUrl: "",
        temperature: 0.2,
      },
    },
    {
      type: "facebookLeadNode",
      name: "Facebook Lead",
      description: "Capture lead information for Facebook",
      icon: Facebook,
      category: "Integrations",
      defaultData: {
        text: "Let me capture your information for our Facebook campaign.",
        leadFields: ["name", "email", "phone"],
        temperature: 0.2,
      },
    },
    {
      type: "googleLeadNode",
      name: "Google Lead",
      description: "Capture lead information for Google",
      icon: Globe,
      category: "Integrations",
      defaultData: {
        text: "Let me capture your information for our Google campaign.",
        leadFields: ["name", "email", "phone"],
        temperature: 0.2,
      },
    },
  ]

  const filteredNodes = nodeTypes.filter(
    (node) =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const categories = Array.from(new Set(nodeTypes.map((node) => node.category)))

  const handleAddNode = (nodeType: any) => {
    onAddNode(nodeType.type, nodeType.defaultData)
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Add New Node</SheetTitle>
          <SheetDescription>Choose a node type to add to your flowchart</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search node types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Node Categories */}
          <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {categories.map((category) => {
              const categoryNodes = filteredNodes.filter((node) => node.category === category)
              if (categoryNodes.length === 0) return null

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-gray-700">{category}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {categoryNodes.length}
                    </Badge>
                  </div>

                  <div className="grid gap-2">
                    {categoryNodes.map((nodeType) => {
                      const Icon = nodeType.icon
                      return (
                        <Button
                          key={nodeType.type}
                          variant="outline"
                          className="h-auto p-4 justify-start text-left hover:bg-blue-50 hover:border-blue-200 bg-transparent"
                          onClick={() => handleAddNode(nodeType)}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Icon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900">{nodeType.name}</div>
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{nodeType.description}</div>
                            </div>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredNodes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No nodes found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
