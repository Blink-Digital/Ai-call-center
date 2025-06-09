"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface PathwayPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

const PathwayPage: React.FC<PathwayPageProps> = ({ searchParams }) => {
  const router = useRouter()
  const phoneNumber = searchParams?.phoneNumber as string
  const pathwayId = searchParams?.pathwayId as string | undefined
  const pathwayName = searchParams?.pathwayName as string | undefined

  const handleManagePathway = (phoneNumber: string, pathwayId?: string, pathwayName?: string) => {
    const params = new URLSearchParams()
    if (pathwayId) {
      params.set("pathwayId", pathwayId)
    }
    if (pathwayName) {
      params.set("pathwayName", pathwayName)
    }

    const url = `/dashboard/pathway/${phoneNumber}${params.toString() ? `?${params.toString()}` : ""}`
    router.push(url)
  }

  return (
    <div>
      <h1>Pathway Page</h1>
      <p>Phone Number: {phoneNumber}</p>
      {pathwayId && <p>Pathway ID: {pathwayId}</p>}
      {pathwayName && <p>Pathway Name: {pathwayName}</p>}

      <Button onClick={() => handleManagePathway(phoneNumber, pathwayId, pathwayName)}>Manage Pathway</Button>
    </div>
  )
}

export default PathwayPage
