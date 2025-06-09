"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImportJsonDialogProps {
  onImport: (jsonData: any) => void
}

export function ImportJsonDialog({ onImport }: ImportJsonDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [jsonText, setJsonText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = () => {
    try {
      setIsImporting(true)
      setError(null)

      // Parse the JSON
      let jsonData
      try {
        jsonData = JSON.parse(jsonText)
      } catch (err) {
        throw new Error("Invalid JSON format. Please check your JSON syntax.")
      }

      // Basic validation
      if (!jsonData.nodes || !Array.isArray(jsonData.nodes)) {
        throw new Error("Invalid JSON format. Must contain a 'nodes' array.")
      }

      // Call the parent's import handler
      onImport(jsonData)

      // Close the dialog and reset state
      setIsOpen(false)
      setJsonText("")
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON format")
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        setJsonText(content)
      } catch (err) {
        setError("Failed to read file")
      }
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload size={16} />
          Import JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Bland.ai JSON</DialogTitle>
          <DialogDescription>Paste or upload a Bland.ai JSON payload to rebuild the flowchart.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                <Upload size={16} />
                <span>Upload JSON file</span>
              </div>
              <input id="file-upload" type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste your Bland.ai JSON here..."
            rows={15}
            className="font-mono text-sm"
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!jsonText.trim() || isImporting}>
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
