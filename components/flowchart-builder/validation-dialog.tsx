"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle } from "lucide-react"

interface ValidationDialogProps {
  isOpen: boolean
  onClose: () => void
  validationResult: {
    isValid: boolean
    issues: string[]
  }
  onProceed: () => void
  isDeploying: boolean
}

export function ValidationDialog({ isOpen, onClose, validationResult, onProceed, isDeploying }: ValidationDialogProps) {
  const { isValid, issues } = validationResult
  const hasWarnings = !isValid && issues.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isValid ? "Pathway Validation Successful" : "Pathway Validation Issues"}</DialogTitle>
          <DialogDescription>
            {isValid
              ? "Your pathway has been validated and is ready for deployment."
              : "The following issues were found in your pathway. You can fix them or proceed with automatic fixes."}
          </DialogDescription>
        </DialogHeader>

        {isValid ? (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>All Checks Passed</AlertTitle>
            <AlertDescription>Your pathway is well-structured and ready for deployment.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4 py-4">
            <Alert className="bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Issues Found</AlertTitle>
              <AlertDescription>The following issues will be automatically fixed during deployment:</AlertDescription>
            </Alert>

            <div className="max-h-60 overflow-y-auto border rounded-md p-3 bg-gray-50">
              <ul className="list-disc pl-5 space-y-1">
                {issues.map((issue, index) => (
                  <li key={index} className="text-sm">
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeploying}>
            Cancel
          </Button>
          <Button
            onClick={onProceed}
            disabled={isDeploying}
            className={isValid ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
          >
            {isDeploying ? "Deploying..." : hasWarnings ? "Deploy with Fixes" : "Deploy Pathway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
