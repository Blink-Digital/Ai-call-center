"use client"

import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"
import { PhoneOff } from "lucide-react"
import { motion } from "framer-motion"

export default function EndCallNode({ data, selected, id }: any) {
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
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 rounded-t-lg">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Badge variant="outline" className="bg-white/80 text-red-600 border-red-200">
                <PhoneOff size={12} className="mr-1" />
                End Call
              </Badge>
              <span className="text-red-700 dark:text-red-100">Hang Up</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 bg-white rounded-b-lg">
            <div className="space-y-2">
              {data?.title && <div className="text-sm font-medium text-gray-700">{data.title}</div>}
              <div className="text-sm text-gray-600 line-clamp-3">
                {data?.text || "Thank you for your time. Goodbye!"}
              </div>
            </div>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-red-500" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
