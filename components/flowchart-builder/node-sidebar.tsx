"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageCircle,
  PhoneForwarded,
  PhoneOff,
  MessageSquareQuote,
  Webhook,
  MessageSquare,
  Play,
  Facebook,
  Chrome,
  Zap,
  ChevronLeft,
  ChevronRight,
  Layers,
  PanelLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface NodeTypeProps {
  type: string
  label: string
  icon: React.ReactNode
  description: string
  collapsed?: boolean
}

const NodeType: React.FC<NodeTypeProps> = ({ type, label, icon, description, collapsed = false }) => {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  if (collapsed) {
    return (
      <div
        className="mb-3 cursor-grab hover:bg-gray-50 transition-all duration-200 p-2 rounded-lg flex justify-center"
        draggable
        onDragStart={(event) => onDragStart(event, type)}
        title={`${label}: ${description}`}
      >
        <div className="text-primary">{icon}</div>
      </div>
    )
  }

  return (
    <Card
      className="mb-3 cursor-grab hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:border-primary/20 hover:shadow-sm"
      draggable
      onDragStart={(event) => onDragStart(event, type)}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div className="bg-gray-50 p-2 rounded-md text-primary">{icon}</div>
        <div>
          <h3 className="font-medium text-sm">{label}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function NodeSidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Determine if sidebar should be expanded
  const isExpanded = !collapsed || (!isMobile && isHovering)

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      {isExpanded && isMobile && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setCollapsed(true)} />
      )}

      <motion.div
        className="fixed md:relative z-50 h-full bg-white border-r border-gray-200 shadow-lg flex flex-col group"
        animate={{
          width: isExpanded ? "16rem" : isMobile ? "0" : "4rem",
          x: collapsed && isMobile ? "-100%" : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <AnimatePresence>
            {isExpanded && (
              <motion.h2
                className="text-lg font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Node Palette
              </motion.h2>
            )}
          </AnimatePresence>

          {!isExpanded && !isMobile && (
            <div className="flex justify-center w-full">
              <Layers className="h-5 w-5 text-primary" />
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={`rounded-full hover:bg-gray-100 ${collapsed && isMobile ? "absolute right-0 translate-x-full mt-2" : ""}`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <Tabs defaultValue="conversation" className="flex flex-col h-full">
                <div className="px-4 pt-3">
                  <TabsList className="grid w-full grid-cols-2 mb-2">
                    <TabsTrigger value="conversation">Conversation</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                  </TabsList>
                </div>

                <div className="node-palette-scroll px-4 pb-4 flex-1 overflow-y-auto scrollbar-thin">
                  <TabsContent value="conversation" className="mt-0 data-[state=active]:block h-full">
                    <NodeType
                      type="greetingNode"
                      label="Greeting"
                      icon={<Play size={18} />}
                      description="Start the conversation"
                    />
                    <NodeType
                      type="questionNode"
                      label="Question"
                      icon={<MessageCircle size={18} />}
                      description="Ask the customer a question"
                    />
                    <NodeType
                      type="responseNode"
                      label="Response"
                      icon={<MessageSquare size={18} />}
                      description="Respond to the customer"
                    />
                    <NodeType
                      type="customerResponseNode"
                      label="Customer Response"
                      icon={<MessageSquareQuote size={18} />}
                      description="Capture customer's response"
                    />
                    <NodeType
                      type="transferNode"
                      label="Transfer"
                      icon={<PhoneForwarded size={18} />}
                      description="Transfer call to another number"
                    />
                    <NodeType
                      type="endCallNode"
                      label="End Call"
                      icon={<PhoneOff size={18} />}
                      description="End the conversation"
                    />
                    <NodeType
                      type="conditionalNode"
                      label="Conditional"
                      icon={<MessageCircle size={18} />}
                      description="Branch based on conditions"
                    />
                  </TabsContent>

                  <TabsContent value="integrations" className="mt-0 data-[state=active]:block h-full">
                    <NodeType
                      type="webhookNode"
                      label="Webhook"
                      icon={<Webhook size={18} />}
                      description="Call an external API"
                    />
                    <NodeType
                      type="facebookLeadNode"
                      label="Facebook Lead"
                      icon={<Facebook size={18} />}
                      description="Send lead data to Facebook"
                    />
                    <NodeType
                      type="googleLeadNode"
                      label="Google Lead"
                      icon={<Chrome size={18} />}
                      description="Send lead event to Google"
                    />
                    <NodeType
                      type="zapierNode"
                      label="Zapier"
                      icon={<Zap size={18} />}
                      description="Trigger a Zap to automate actions"
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </motion.div>
          ) : (
            <motion.div
              className="flex flex-col items-center pt-4 gap-4 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!isMobile && (
                <>
                  <NodeType
                    type="greetingNode"
                    label="Greeting"
                    icon={<Play size={20} />}
                    description="Start the conversation"
                    collapsed
                  />
                  <NodeType
                    type="questionNode"
                    label="Question"
                    icon={<MessageCircle size={20} />}
                    description="Ask the customer a question"
                    collapsed
                  />
                  <NodeType
                    type="responseNode"
                    label="Response"
                    icon={<MessageSquare size={20} />}
                    description="Respond to the customer"
                    collapsed
                  />
                  <NodeType
                    type="customerResponseNode"
                    label="Customer Response"
                    icon={<MessageSquareQuote size={20} />}
                    description="Capture customer's response"
                    collapsed
                  />
                  <NodeType
                    type="transferNode"
                    label="Transfer"
                    icon={<PhoneForwarded size={20} />}
                    description="Transfer call to another number"
                    collapsed
                  />
                  <NodeType
                    type="endCallNode"
                    label="End Call"
                    icon={<PhoneOff size={20} />}
                    description="End the conversation"
                    collapsed
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Toggle button for mobile that's always visible */}
      {isMobile && collapsed && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="fixed top-4 left-4 z-50 rounded-full shadow-md bg-white"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}
    </>
  )
}
