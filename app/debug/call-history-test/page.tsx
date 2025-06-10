"use client"

import { useState } from "react"
import CallHistoryClient from "@/components/call-history/call-history-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CallHistoryTestPage() {
  const [testScenario, setTestScenario] = useState<string>("normal")

  const testCases = [
    { id: "normal", label: "Normal Case", phone: "+1 (978) 783-6427" },
    { id: "invalid", label: "Invalid Number", phone: "+1 (000) 000-0000" },
    { id: "empty", label: "Empty Number", phone: "" },
    { id: "malformed", label: "Malformed Number", phone: "not-a-phone-number" },
  ]

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Call History Test Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {testCases.map((test) => (
              <Button
                key={test.id}
                variant={testScenario === test.id ? "default" : "outline"}
                onClick={() => setTestScenario(test.id)}
              >
                {test.label}
              </Button>
            ))}
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            Current Test: <strong>{testCases.find((t) => t.id === testScenario)?.label}</strong>
            <br />
            Phone Number: <code>{testCases.find((t) => t.id === testScenario)?.phone}</code>
          </div>
        </CardContent>
      </Card>

      <CallHistoryClient phoneNumber={testCases.find((t) => t.id === testScenario)?.phone} />
    </div>
  )
}
