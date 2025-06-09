"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Send, PhoneCall, PhoneOff, ArrowRight, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Message {
  id: string
  role: "ai" | "user" | "system"
  content: string
  timestamp: Date
  nodeId?: string
  extractedVariables?: Record<string, any>
}

interface TestPathwayDialogProps {
  isOpen: boolean
  onClose: () => void
  flowchartData: any
  onHighlightNode?: (nodeId: string | null) => void
}

export function TestPathwayDialog({ isOpen, onClose, flowchartData, onHighlightNode }: TestPathwayDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null)
  const [extractedVariables, setExtractedVariables] = useState<Record<string, any>>({})
  const [conversationEnded, setConversationEnded] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [nextPossibleNodes, setNextPossibleNodes] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Reset the conversation
  const resetConversation = useCallback(() => {
    setMessages([])
    setInput("")
    setIsProcessing(false)
    setConversationEnded(false)
    setExtractedVariables({})
    setNextPossibleNodes([])

    // Find the start node (greeting node or node with no incoming edges)
    const startNode = findStartNode(flowchartData)

    if (startNode) {
      setCurrentNodeId(startNode.id)
      onHighlightNode?.(startNode.id)

      // Find next possible nodes
      updateNextPossibleNodes(startNode.id)

      // Add the initial AI message
      setTimeout(() => {
        setIsTyping(true)
        setTimeout(() => {
          const initialMessage: Message = {
            id: `ai-${Date.now()}`,
            role: "ai",
            content: startNode.data.text || "Hello! How can I help you today?",
            timestamp: new Date(),
            nodeId: startNode.id,
          }
          setMessages([initialMessage])
          setIsTyping(false)

          // Check if this is an end call node
          if (startNode.type === "endCallNode") {
            setConversationEnded(true)
          }
        }, 1000)
      }, 500)
    } else {
      // No start node found
      setMessages([
        {
          id: "system-error",
          role: "system",
          content: "Error: Could not find a starting node in the flowchart.",
          timestamp: new Date(),
        },
      ])
    }
  }, [flowchartData, onHighlightNode])

  // Find the start node when the dialog opens
  useEffect(() => {
    if (isOpen && flowchartData && !currentNodeId) {
      resetConversation()
    }
  }, [isOpen, flowchartData, currentNodeId, resetConversation])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Find the start node in the flowchart
  const findStartNode = useCallback((flowchart: any) => {
    if (!flowchart || !flowchart.nodes || !Array.isArray(flowchart.nodes)) {
      return null
    }

    // First, look for a greeting node
    const greetingNode = flowchart.nodes.find((node: any) => node.type === "greetingNode")
    if (greetingNode) return greetingNode

    // If no greeting node, find nodes with no incoming edges
    if (flowchart.edges && Array.isArray(flowchart.edges)) {
      const nodesWithIncomingEdges = new Set(flowchart.edges.map((edge: any) => edge.target))

      const startNodes = flowchart.nodes.filter((node: any) => !nodesWithIncomingEdges.has(node.id))

      if (startNodes.length > 0) {
        return startNodes[0]
      }
    }

    // If all else fails, return the first node
    return flowchart.nodes.length > 0 ? flowchart.nodes[0] : null
  }, [])

  // Update next possible nodes based on current node
  const updateNextPossibleNodes = useCallback(
    (nodeId: string) => {
      if (!flowchartData || !flowchartData.edges) {
        setNextPossibleNodes([])
        return
      }

      // Find outgoing edges from the current node
      const outgoingEdges = flowchartData.edges.filter((edge: any) => edge.source === nodeId)

      // Get the target nodes
      const nextNodes = outgoingEdges
        .map((edge: any) => {
          const targetNode = flowchartData.nodes.find((node: any) => node.id === edge.target)
          if (targetNode) {
            return {
              ...targetNode,
              edgeLabel: edge.data?.label || "next",
              sourceHandle: edge.sourceHandle,
            }
          }
          return null
        })
        .filter(Boolean)

      setNextPossibleNodes(nextNodes)
    },
    [flowchartData],
  )

  // Handle user input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isProcessing || conversationEnded) return

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsProcessing(true)

    // Process the user input and determine the next node
    processUserInput(input)
  }

  // Handle errors
  const handleError = useCallback(
    (errorMessage: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-error-${Date.now()}`,
          role: "system",
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
        },
      ])
      setIsProcessing(false)
      toast({
        title: "Pathway Error",
        description: errorMessage,
        variant: "destructive",
      })
    },
    [toast],
  )

  // Process user input and determine the next node
  const processUserInput = useCallback(
    (userInput: string) => {
      if (!currentNodeId || !flowchartData || !flowchartData.nodes || !flowchartData.edges) {
        handleError("Invalid flowchart data. Cannot process input.")
        return
      }

      // Find outgoing edges from the current node
      const outgoingEdges = flowchartData.edges.filter((edge: any) => edge.source === currentNodeId)

      // Determine which edge to follow based on user input
      let nextEdge = null
      const extractedVars: Record<string, any> = {}

      // Get the current node
      const currentNode = flowchartData.nodes.find((node: any) => node.id === currentNodeId)
      if (!currentNode) {
        handleError("Current node not found in flowchart.")
        return
      }

      // Extract variables based on node type
      if (currentNode.type === "customerResponseNode") {
        const variableName = currentNode.data.variableName || "response"
        extractedVars[variableName] = userInput

        // For customer response nodes, check if the input matches any of the predefined responses
        if (currentNode.data.responses && Array.isArray(currentNode.data.responses)) {
          // Try to match the user input to one of the responses
          const responseIndex = currentNode.data.responses.findIndex((response: string) =>
            userInput.toLowerCase().includes(response.toLowerCase()),
          )

          if (responseIndex >= 0) {
            // Find the edge that corresponds to this response
            nextEdge = outgoingEdges.find((edge: any) => edge.sourceHandle === `response-${responseIndex}`)
          }
        }
      }

      // If no specific edge was found, use the first available edge
      if (!nextEdge && outgoingEdges.length > 0) {
        nextEdge = outgoingEdges[0]
      }

      // Update extracted variables
      setExtractedVariables((prev) => ({ ...prev, ...extractedVars }))

      // If we found an edge to follow, move to the next node
      if (nextEdge) {
        const nextNodeId = nextEdge.target
        const nextNode = flowchartData.nodes.find((node: any) => node.id === nextNodeId)

        if (nextNode) {
          setCurrentNodeId(nextNodeId)
          onHighlightNode?.(nextNodeId)

          // Update next possible nodes
          updateNextPossibleNodes(nextNodeId)

          // Add a system message about the path taken if we have a label
          if (nextEdge.data?.label && nextEdge.data.label !== "next") {
            const pathMessage: Message = {
              id: `system-${Date.now()}`,
              role: "system",
              content: `Path taken: ${nextEdge.data.label}`,
              timestamp: new Date(),
            }
            setMessages((prev) => [...prev, pathMessage])
          }

          // Simulate AI typing
          setIsTyping(true)
          setTimeout(() => {
            // Add the AI response from the next node
            const aiMessage: Message = {
              id: `ai-${Date.now()}`,
              role: "ai",
              content: nextNode.data.text || nextNode.data.prompt || "I understand.",
              timestamp: new Date(),
              nodeId: nextNodeId,
              extractedVariables: extractedVars,
            }

            setMessages((prev) => [...prev, aiMessage])
            setIsTyping(false)
            setIsProcessing(false)

            // Check if this is an end call node
            if (nextNode.type === "endCallNode") {
              setConversationEnded(true)

              // Add a system message that the call has ended
              const endCallMessage: Message = {
                id: `system-${Date.now()}`,
                role: "system",
                content: "Call ended.",
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, endCallMessage])
            }

            // Check if this is a transfer node
            if (nextNode.type === "transferNode") {
              setConversationEnded(true)

              // Add a system message that the call has been transferred
              const transferMessage: Message = {
                id: `system-${Date.now()}`,
                role: "system",
                content: `Call transferred to ${nextNode.data.transferNumber || "an agent"}.`,
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, transferMessage])
            }
          }, 1500)
        } else {
          // Node not found
          handleError("Could not find the next node in the pathway.")
        }
      } else {
        // No edge to follow
        handleError("This pathway has no defined next step. The conversation cannot continue.")
        setConversationEnded(true)
      }
    },
    [currentNodeId, flowchartData, handleError, onHighlightNode, updateNextPossibleNodes],
  )

  // Get the current node
  const getCurrentNode = useCallback(() => {
    if (!flowchartData || !flowchartData.nodes || !currentNodeId) return null
    return flowchartData.nodes.find((node: any) => node.id === currentNodeId)
  }, [flowchartData, currentNodeId])

  // Start the conversation from a specific node
  const startFromNode = useCallback(
    (nodeId: string) => {
      if (!flowchartData || !flowchartData.nodes) return

      const node = flowchartData.nodes.find((n: any) => n.id === nodeId)
      if (!node) return

      setCurrentNodeId(nodeId)
      onHighlightNode?.(nodeId)
      setMessages([])
      setConversationEnded(false)
      setExtractedVariables({})

      // Update next possible nodes
      updateNextPossibleNodes(nodeId)

      // Add the initial AI message from this node
      setIsTyping(true)
      setTimeout(() => {
        const initialMessage: Message = {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: node.data.text || "Hello! How can I help you today?",
          timestamp: new Date(),
          nodeId: node.id,
        }
        setMessages([initialMessage])
        setIsTyping(false)

        // Check if this is an end call node
        if (node.type === "endCallNode") {
          setConversationEnded(true)
        }
      }, 1000)
    },
    [flowchartData, onHighlightNode, updateNextPossibleNodes],
  )

  // Get the current node
  const currentNode = getCurrentNode()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-green-500" />
            Test Pathway Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: Chat interface */}
          <div className="w-1/2 border-r flex flex-col">
            <div className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.role === "ai" && (
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.role === "system"
                              ? "bg-muted text-muted-foreground text-sm italic"
                              : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>

                        {message.extractedVariables && Object.keys(message.extractedVariables).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-primary/20 text-xs">
                            <div className="font-semibold mb-1">Extracted variables:</div>
                            {Object.entries(message.extractedVariables).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {key}
                                </Badge>
                                <span>=</span>
                                <span className="font-mono">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 ml-2">
                          <AvatarFallback className="bg-zinc-800 text-zinc-200">U</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                      </Avatar>
                      <div className="bg-secondary text-secondary-foreground max-w-[80%] rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="h-2 w-2 bg-current rounded-full animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      conversationEnded
                        ? "Conversation ended"
                        : isProcessing
                          ? "Processing..."
                          : "Type your response..."
                    }
                    disabled={isProcessing || conversationEnded}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!input.trim() || isProcessing || conversationEnded}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={resetConversation} className="text-xs">
                    Reset Conversation
                  </Button>

                  {conversationEnded && (
                    <Badge variant="outline" className="ml-auto flex items-center gap-1">
                      <PhoneOff className="h-3 w-3" />
                      Call Ended
                    </Badge>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right panel: Current node and variables */}
          <div className="w-1/2 flex flex-col">
            <Tabs defaultValue="current-node" className="flex-1 flex flex-col">
              <div className="px-4 pt-2 border-b">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="current-node">Current Node</TabsTrigger>
                  <TabsTrigger value="variables">Extracted Variables</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="current-node" className="flex-1 p-4 overflow-auto">
                {currentNode ? (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{getNodeTypeLabel(currentNode.type)}</CardTitle>
                        <Badge variant="outline">{currentNode.id}</Badge>
                      </div>
                      <CardDescription>Current active node in the conversation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Node Content:</h4>
                          <div className="p-3 bg-muted rounded-md">
                            <p className="whitespace-pre-wrap">
                              {currentNode.data.text || currentNode.data.prompt || "No content"}
                            </p>
                          </div>
                        </div>

                        {nextPossibleNodes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Possible Next Nodes:</h4>
                            <div className="space-y-2">
                              {nextPossibleNodes.map((node) => (
                                <div key={node.id} className="p-2 border rounded-md">
                                  <div className="flex items-center gap-2 text-sm">
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-medium">{getNodeTypeLabel(node.type)}</span>
                                    <Badge variant="outline" className="text-xs ml-auto">
                                      {node.edgeLabel}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {node.data.text || node.data.prompt || "No content"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {currentNode.type === "customerResponseNode" && currentNode.data.responses && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Expected Responses:</h4>
                            <div className="flex flex-wrap gap-1">
                              {currentNode.data.responses.map((response: string, index: number) => (
                                <Badge key={index} variant="secondary">
                                  {response}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Info className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>No active node selected</p>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Start from a different node:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {flowchartData?.nodes
                      ?.filter((node: any) => node.type !== "conditionalNode")
                      .slice(0, 6) // Limit to first 6 nodes to avoid cluttering
                      .map((node: any) => (
                        <Button
                          key={node.id}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "justify-start text-xs h-auto py-1",
                            currentNodeId === node.id && "border-primary",
                          )}
                          onClick={() => startFromNode(node.id)}
                        >
                          <span className="truncate">{getNodeTypeLabel(node.type)}</span>
                        </Button>
                      ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="variables" className="flex-1 p-4 overflow-auto">
                {Object.keys(extractedVariables).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(extractedVariables).map(([key, value]) => (
                      <div key={key} className="border rounded-md p-3">
                        <div className="flex items-center gap-2">
                          <Badge>{key}</Badge>
                          <span className="text-sm text-muted-foreground">=</span>
                          <span className="font-mono text-sm">{String(value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">No variables have been extracted yet.</div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to get a readable label for node types
function getNodeTypeLabel(type: string): string {
  switch (type) {
    case "greetingNode":
      return "Greeting"
    case "questionNode":
      return "Question"
    case "responseNode":
      return "Response"
    case "customerResponseNode":
      return "Customer Response"
    case "endCallNode":
      return "End Call"
    case "transferNode":
      return "Transfer"
    case "webhookNode":
      return "Webhook"
    default:
      return type.replace("Node", "")
  }
}
