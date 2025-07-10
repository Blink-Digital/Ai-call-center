"use client"

import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"
import { Database, Settings } from "lucide-react"
import { motion } from "framer-motion"

export default function CustomerResponseNode({ data, selected, id }: any) {
  // Show extraction status
  const hasExtraction = data?.extractCallInfo || (data?.extractVars && data.extractVars.length > 0)
  const variableCount = data?.extractVars?.length || 0

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
                <Database size={12} className="mr-1" />
                Extractor
              </Badge>
              <span className="text-purple-700 dark:text-purple-100">Variable Extraction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 bg-white rounded-b-lg">
            <div className="space-y-3">
              {/* Node Title */}
              {data?.nodeTitle && (
                <div className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">{data.nodeTitle}</div>
              )}

              {/* Prompt Preview */}
              {data?.text && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md border">
                  <div className="font-medium text-gray-700 mb-1">Prompt:</div>
                  <div className="line-clamp-2">{data.text}</div>
                </div>
              )}

              {/* Extraction Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings size={14} className="text-purple-500" />
                  <span className="text-xs font-medium text-gray-700">
                    {hasExtraction ? "Extraction Enabled" : "No Extraction"}
                  </span>
                </div>
                {hasExtraction && (
                  <Badge variant="secondary" className="text-xs">
                    {variableCount} var{variableCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              {/* Variables Preview */}
              {data?.extractVars && data.extractVars.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">Variables:</div>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {data.extractVars.slice(0, 3).map((variable: any, index: number) => (
                      <div
                        key={index}
                        className="text-xs p-1.5 border rounded bg-purple-50 border-purple-100 flex items-center justify-between"
                      >
                        <span className="font-medium text-purple-700">
                          {Array.isArray(variable) ? variable[0] : variable.name}
                        </span>
                        <span className="text-purple-500 text-[10px]">
                          {Array.isArray(variable) ? variable[1] : variable.type}
                        </span>
                      </div>
                    ))}
                    {data.extractVars.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{data.extractVars.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extraction Settings */}
              {data?.extractionPrompt && (
                <div className="text-xs bg-blue-50 p-2 rounded-md border border-blue-100">
                  <span className="font-medium text-blue-700">Custom Extraction Prompt</span>
                </div>
              )}

              {data?.extractVarSettings?.ignorePrevious && (
                <div className="text-xs bg-orange-50 p-2 rounded-md border border-orange-100">
                  <span className="font-medium text-orange-700">Ignoring Previous Values</span>
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
