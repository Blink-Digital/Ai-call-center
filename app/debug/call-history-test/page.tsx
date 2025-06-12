"use client"

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"

// Dynamically import the CallHistoryClient to avoid SSR issues
const CallHistoryClient = dynamic(
  () => import("@/components/call-history/call-history-client").then((mod) => ({ default: mod.CallHistoryClient })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Loading Call History...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false,
  },
)

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
          <div className="flex gap-2 mb-4 flex-wrap">
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

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Loading Call History Component...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        }
      >
        <CallHistoryClient phoneNumber={testCases.find((t) => t.id === testScenario)?.phone || ""} />
      </Suspense>
    </div>
  )
}
