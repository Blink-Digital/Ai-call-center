import { memo } from "react"
import { Handle, Position } from "reactflow"
import { Badge } from "@/components/ui/badge"

const GreetingNode = memo(({ data, selected }: any) => {
  return (
    <div
      className={`relative bg-green-50/90 border-2 rounded-lg shadow-sm min-w-[300px] ${
        selected ? "border-green-500" : "border-green-200"
      }`}
    >
      {/* Header with badges */}
      <div className="flex items-center gap-2 p-3 border-b border-green-200">
        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
          ▶ Start
        </Badge>
        <Badge variant="outline" className="border-green-300 text-green-700">
          Greeting
        </Badge>
        <Badge variant="outline" className="border-green-300 text-green-700">
          Default
        </Badge>
      </div>

      {/* Main content */}
      <div className="p-4 space-y-3">
        <div className="text-sm text-gray-800 leading-relaxed">
          Hi, thanks for calling Better Tax Resolution. To check if you qualify for our tax relief program, may I...
        </div>

        {/* Entry Point section */}
        <div className="bg-green-100 border border-green-200 rounded-md p-3">
          <div className="text-xs font-medium text-green-700 mb-1">Entry Point:</div>
          <div className="text-xs text-green-600">This is where all calls begin</div>
        </div>
      </div>

      {/* Output handle */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500 border-2 border-white" />
    </div>
  )
})

GreetingNode.displayName = "GreetingNode"

export default GreetingNode
