"use client"

import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"
import { Play, Lock } from "lucide-react"
import { motion } from "framer-motion"

export default function GreetingNode({ data, selected, id }: any) {
  const isStartNode = data?.isStart || data?.isDefault

  return (
    <div className="relative">
      {selected && !isStartNode && (
        <>
          <NodeDeleteButton nodeId={id} />
          <NodeDuplicateButton nodeId={id} />
        </>
      )}
      <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
        <Card
          className={`w-64 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${
            selected ? "ring-2 ring-primary" : ""
          } ${isStartNode ? "border-green-300 bg-green-50/30" : ""}`}
        >
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-t-lg">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Badge variant="outline" className="bg-white/80 text-green-600 border-green-200">
                <Play size={12} className="mr-1" />
                Start
              </Badge>
              <span className="text-green-700 dark:text-green-100">Greeting</span>
              {isStartNode && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                  <Lock size={10} className="mr-1" />
                  Default
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 bg-white rounded-b-lg">
            <div className="space-y-2">
              {data?.title && <div className="text-sm font-medium text-gray-700">{data.title}</div>}
              <div className="text-sm text-gray-600 line-clamp-3">
                {data?.text || "Hello! Thank you for calling. How can I help you today?"}
              </div>
              {isStartNode && (
                <div className="text-xs bg-green-50 p-2 rounded-md border border-green-100">
                  <span className="font-medium text-green-700">Entry Point:</span>
                  <span className="text-green-600 ml-1">This is where all calls begin</span>
                </div>
              )}
              {data?.extractVariables && data.extractVariables.length > 0 && (
                <div className="text-xs bg-blue-50 p-2 rounded-md border border-blue-100">
                  <span className="font-medium">Extracts:</span> {data.extractVariables.join(", ")}
                </div>
              )}
            </div>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
