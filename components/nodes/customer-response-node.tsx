"use client"

import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"
import { MessageSquareQuote } from "lucide-react"
import { motion } from "framer-motion"

export default function CustomerResponseNode({ data, selected, id }: any) {
  const options = data?.options || data?.responses || ["Age", "Name", "Email", "Phone"]

  // Calculate handle positions
  const getHandlePosition = (index: number, total: number) => {
    if (total === 1) return 0.5
    return total <= 1 ? 0.5 : index / (total - 1)
  }

  return (
    <div className="relative">
      {selected && (
        <>
          <NodeDeleteButton nodeId={id} />
          <NodeDuplicateButton nodeId={id} />
        </>
      )}
      <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
        <Card
          className={`w-64 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${selected ? "ring-2 ring-primary" : ""}`}
        >
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-cyan-900 dark:to-cyan-800 rounded-t-lg">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Badge variant="outline" className="bg-white/80 text-cyan-600 border-cyan-200">
                <MessageSquareQuote size={12} className="mr-1" />
                Customer Response
              </Badge>
              <span className="text-cyan-700 dark:text-cyan-100">User Input</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 bg-white rounded-b-lg">
            <div className="space-y-2">
              {data?.title && <div className="text-sm font-medium text-gray-700">{data.title}</div>}
              <div className="space-y-1">
                {options.map((option: string, index: number) => (
                  <div
                    key={index}
                    className="text-xs p-2 border rounded-md bg-gray-50 relative hover:bg-gray-100 transition-colors"
                  >
                    {option}
                    <Handle
                      type="source"
                      position={Position.Bottom}
                      id={`response-${index}`}
                      className="w-3 h-3 bg-cyan-500"
                      style={{
                        left: `${getHandlePosition(index, options.length) * 100}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
              {data?.variableName && (
                <div className="text-xs bg-blue-50 p-2 rounded-md border border-blue-100">
                  <span className="font-medium">Variable:</span> {data.variableName}
                </div>
              )}
            </div>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-cyan-500" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
