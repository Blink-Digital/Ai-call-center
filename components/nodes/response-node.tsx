"use client"

import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"
import { MessageSquare } from "lucide-react"
import { motion } from "framer-motion"

export default function ResponseNode({ data, selected, id }: any) {
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
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-t-lg">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Badge variant="outline" className="bg-white/80 text-purple-600 border-purple-200">
                <MessageSquare size={12} className="mr-1" />
                Response
              </Badge>
              <span className="text-purple-700 dark:text-purple-100">AI Response</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 bg-white rounded-b-lg">
            <div className="space-y-2">
              {data?.title && <div className="text-sm font-medium text-gray-700">{data.title}</div>}
              <div className="text-sm text-gray-600 line-clamp-3">{data?.text || "Thank you for your response..."}</div>
              {data?.extractVariables && data.extractVariables.length > 0 && (
                <div className="text-xs bg-blue-50 p-2 rounded-md border border-blue-100">
                  <span className="font-medium">Extracts:</span> {data.extractVariables.join(", ")}
                </div>
              )}
            </div>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
