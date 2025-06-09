"use client"

import { useState } from "react"
import { Handle, Position } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NodeDeleteButton } from "@/components/flowchart-builder/node-delete-button"
import { NodeDuplicateButton } from "@/components/flowchart-builder/node-duplicate-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { commonVariables, defaultConditional } from "@/config/flowchart-defaults"

export default function ConditionalNode({ data, selected, id }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [condition, setCondition] = useState(
    data?.condition ||
      `if (${defaultConditional.variable} ${defaultConditional.operator} ${defaultConditional.value}) { ... } else { ... }`,
  )
  const [trueLabel, setTrueLabel] = useState(data?.trueLabel || defaultConditional.trueLabel)
  const [falseLabel, setFalseLabel] = useState(data?.falseLabel || defaultConditional.falseLabel)
  const [variableName, setVariableName] = useState(data?.variableName || defaultConditional.variable)
  const [conditionOperator, setConditionOperator] = useState(data?.conditionOperator || defaultConditional.operator)
  const [conditionValue, setConditionValue] = useState(data?.conditionValue || defaultConditional.value)
  const [customVariableName, setCustomVariableName] = useState("")

  const handleSave = () => {
    // Use custom variable name if selected
    const finalVariableName = variableName === "custom" ? customVariableName : variableName

    // Format the condition in a way that Bland.ai will understand
    const formattedCondition = `if (${finalVariableName} ${conditionOperator} ${conditionValue}) { True } else { False }`

    data.condition = formattedCondition
    data.trueLabel = `${finalVariableName}${conditionOperator}${conditionValue}`
    data.falseLabel = `${finalVariableName}${conditionOperator === "<=" ? ">" : conditionOperator === "<" ? ">=" : conditionOperator === "==" ? "!=" : conditionOperator === "!=" ? "==" : conditionOperator === ">=" ? "<" : "<="} ${conditionValue}`

    // Save variable condition information
    data.variableName = finalVariableName
    data.conditionOperator = conditionOperator
    data.conditionValue = conditionValue

    setIsEditing(false)
  }

  // Calculate handle positions similar to customer response node
  const getHandlePosition = (index: number, total: number) => {
    // Distribute handles evenly
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
      <Card className={`w-64 shadow-md ${selected ? "ring-2 ring-primary" : ""}`}>
        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between bg-yellow-100 dark:bg-yellow-900 rounded-t-lg">
          <CardTitle className="text-sm font-medium">
            <Badge variant="outline" className="mr-2">
              Conditional
            </Badge>
            If/Else Logic
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 bg-white">
          {!isEditing ? (
            <>
              <div className="text-sm min-h-[40px]">
                {data?.condition || `if (${variableName} ${conditionOperator} ${conditionValue}) { ... } else { ... }`}
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-xs p-1 border-l-2 border-green-500 pl-2">
                  True: {data?.trueLabel || `${variableName}${conditionOperator}${conditionValue}`}
                </div>
                <div className="text-xs p-1 border-l-2 border-red-500 pl-2">
                  False:{" "}
                  {data?.falseLabel ||
                    `${variableName}${conditionOperator === "<=" ? ">" : conditionOperator === "<" ? ">=" : conditionOperator === "==" ? "!=" : conditionOperator === "!=" ? "==" : conditionOperator === ">=" ? "<" : "<="} ${conditionValue}`}
                </div>
              </div>

              <Alert className="mt-2 py-1 px-2 text-xs">
                <Info className="h-3 w-3" />
                <AlertDescription>Creates direct branches from the node that extracts {variableName}</AlertDescription>
              </Alert>

              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full mt-2">
                Edit Condition
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Condition</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">if (</span>
                  <Select
                    value={variableName}
                    onValueChange={(value) => {
                      setVariableName(value)
                      if (value === "custom") {
                        setCustomVariableName("")
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Variable" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonVariables.map((variable) => (
                        <SelectItem key={variable.name} value={variable.name}>
                          {variable.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="Response">Response</SelectItem>
                      <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                  {variableName === "custom" && (
                    <Input
                      value={customVariableName}
                      onChange={(e) => setCustomVariableName(e.target.value)}
                      placeholder="Custom variable"
                      className="flex-1"
                    />
                  )}
                  <Select value={conditionOperator} onValueChange={setConditionOperator}>
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="==" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<">{"<"}</SelectItem>
                      <SelectItem value="<=">{"<="}</SelectItem>
                      <SelectItem value="==">{"=="}</SelectItem>
                      <SelectItem value="!=">{"!="}</SelectItem>
                      <SelectItem value=">=">{">="}</SelectItem>
                      <SelectItem value=">">{">"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    placeholder="Value"
                    className="w-20"
                  />
                  <span className="text-sm">)</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`true-label-${id}`}>True Path Label</Label>
                <Input
                  id={`true-label-${id}`}
                  value={`${variableName === "custom" ? customVariableName : variableName}${conditionOperator}${conditionValue}`}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`false-label-${id}`}>False Path Label</Label>
                <Input
                  id={`false-label-${id}`}
                  value={`${variableName === "custom" ? customVariableName : variableName}${
                    conditionOperator === "<="
                      ? ">"
                      : conditionOperator === "<"
                        ? ">="
                        : conditionOperator === "=="
                          ? "!="
                          : conditionOperator === "!="
                            ? "=="
                            : conditionOperator === ">="
                              ? "<"
                              : "<="
                  }${conditionValue}`}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <Alert className="py-1 px-2 text-xs">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription>
                  Make sure {variableName === "custom" ? customVariableName : variableName} is extracted by a previous
                  node
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          )}
          <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-500" />

          {/* Position handles evenly along the bottom, similar to customer response node */}
          <div className="relative h-3 w-full">
            <Handle
              type="source"
              position={Position.Bottom}
              id="false"
              className="w-3 h-3 bg-red-500"
              style={{ left: `${getHandlePosition(0, 2) * 100}%` }}
            />
            <Handle
              type="source"
              position={Position.Bottom}
              id="true"
              className="w-3 h-3 bg-green-500"
              style={{ left: `${getHandlePosition(1, 2) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
