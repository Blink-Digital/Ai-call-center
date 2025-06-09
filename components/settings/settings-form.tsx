"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsForm() {
  const [openrouterKey, setOpenrouterKey] = useState("")
  const [blandaiKey, setBlandaiKey] = useState("")
  const [status, setStatus] = useState<{ type: "success" | "error" | "none"; message: string }>({
    type: "none",
    message: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load saved keys from localStorage
    const savedOpenrouterKey = localStorage.getItem("openrouter_api_key")
    const savedBlandaiKey = localStorage.getItem("bland_ai_api_key")

    if (savedOpenrouterKey) setOpenrouterKey(savedOpenrouterKey)
    if (savedBlandaiKey) setBlandaiKey(savedBlandaiKey)
  }, [])

  const saveSettings = async () => {
    setIsLoading(true)
    setStatus({ type: "none", message: "" })

    try {
      // Save to localStorage
      if (openrouterKey) localStorage.setItem("openrouter_api_key", openrouterKey)
      if (blandaiKey) localStorage.setItem("bland_ai_api_key", blandaiKey)

      // Validate OpenRouter key if provided
      if (openrouterKey) {
        const response = await fetch("/api/validate-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key: openrouterKey, type: "openrouter" }),
        })

        if (!response.ok) {
          throw new Error("Failed to validate OpenRouter API key")
        }
      }

      setStatus({
        type: "success",
        message: "API keys saved successfully. Changes will take effect immediately.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      setStatus({
        type: "error",
        message: error.message || "Failed to save settings. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Configure your API keys for various services used by the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
            <Input
              id="openrouter-key"
              type="password"
              placeholder="sk-or-..."
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Used for generating call flows with various AI models.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bland-ai-key">Bland.ai API Key</Label>
            <Input
              id="bland-ai-key"
              type="password"
              placeholder="bland_..."
              value={blandaiKey}
              onChange={(e) => setBlandaiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Required for creating and managing call flows on Bland.ai.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={saveSettings} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </CardFooter>
      </Card>

      {status.type !== "none" && (
        <Alert variant={status.type === "success" ? "default" : "destructive"}>
          {status.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{status.type === "success" ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
