"use client"

import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"
import { MessageCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function QuestionNode({ data, selected, id }: any) {
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
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-t-lg">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Badge variant="outline" className="bg-white/80 text-blue-600 border-blue-200">
                <MessageCircle size={12} className="mr-1" />
                Question
              </Badge>
              <span className="text-blue-700 dark:text-blue-100">Ask Question</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 bg-white rounded-b-lg">
            <div className="space-y-2">
              {data?.title && <div className="text-sm font-medium text-gray-700">{data.title}</div>}
              <div className="text-sm text-gray-600 line-clamp-3">
                {data?.text || "What would you like to know about?"}
              </div>
            </div>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
