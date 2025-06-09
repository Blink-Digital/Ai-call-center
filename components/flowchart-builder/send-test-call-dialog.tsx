"use client"

import type React from "react"

import { useState } from "react"
import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { formatPhoneNumber } from "@/utils/phone-utils"

interface SendTestCallDialogProps {
  isOpen: boolean
  onClose: () => void
  pathwayId: string | null
}

export function SendTestCallDialog({ isOpen, onClose, pathwayId }: SendTestCallDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSendCall = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter a valid phone number to send the test call.",
        variant: "destructive",
      })
      return
    }

    if (!pathwayId) {
      toast({
        title: "No pathway selected",
        description: "Please save your pathway before sending a test call.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/bland-ai/send-test-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          pathwayId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test call")
      }

      toast({
        title: "Test call initiated!",
        description: `A call is being sent to ${formatPhoneNumber(phoneNumber)}. You should receive it shortly.`,
      })

      onClose()
    } catch (error) {
      console.error("Error sending test call:", error)
      toast({
        title: "Failed to send test call",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers, plus sign, parentheses, dashes and spaces
    const value = e.target.value.replace(/[^\d\s$$$$\-+]/g, "")
    setPhoneNumber(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Test Call</DialogTitle>
          <DialogDescription>Enter a phone number to receive a test call using this pathway.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneNumber" className="text-right">
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="+1 (555) 123-4567"
              className="col-span-3"
              autoFocus
            />
          </div>
          {!pathwayId && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md">
              <p className="text-sm">You need to save your pathway before sending a test call.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSendCall} disabled={isSending || !phoneNumber || !pathwayId} className="gap-2">
            <Phone className="h-4 w-4" />
            {isSending ? "Sending..." : "Send Call"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
