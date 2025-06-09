"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function ReportsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard/billing")
  }, [router])

  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Redirecting to Billing...</span>
    </div>
  )
}
