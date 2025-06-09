"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface PathwayCardProps {
  phoneNumber: string
  pathwayId?: string
  pathwayName?: string
}

export function PathwayCard({ phoneNumber, pathwayId, pathwayName }: PathwayCardProps) {
  const router = useRouter()

  const handleManagePathway = () => {
    // Pass pathway info as URL params to avoid refetching
    const params = new URLSearchParams()
    if (pathwayId) params.set("pathwayId", pathwayId)
    if (pathwayName) params.set("pathwayName", pathwayName)

    const url = `/dashboard/pathway/${phoneNumber}${params.toString() ? `?${params.toString()}` : ""}`
    router.push(url)
  }

  return (
    <div className="pathway-card">
      {/* Your existing card content */}
      <Button onClick={handleManagePathway}>Manage Pathway →</Button>
    </div>
  )
}
