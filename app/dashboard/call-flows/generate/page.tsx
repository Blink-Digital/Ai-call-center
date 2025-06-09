"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import UseCasePrompt from "@/components/use-case-prompt"

export default function GenerateCallFlowPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)

  useEffect(() => {
    // Get the phone number from the URL query parameters
    const phoneNumberParam = searchParams.get("phoneNumber")
    if (phoneNumberParam) {
      setPhoneNumber(phoneNumberParam)
    }
  }, [searchParams])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Generate Call Flow with AI</h1>
      </div>

      <UseCasePrompt phoneNumber={phoneNumber} />
    </div>
  )
}
