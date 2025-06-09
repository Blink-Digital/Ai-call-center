"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Sample data for call flows
const callFlows = [
  {
    id: 1,
    name: "Lead Qualification",
    description: "Qualify leads based on budget, timeline, and requirements",
    status: "active",
    calls: 342,
    successRate: 68,
    lastModified: "2 days ago",
  },
  {
    id: 2,
    name: "Appointment Scheduling",
    description: "Schedule appointments with qualified leads",
    status: "active",
    calls: 215,
    successRate: 82,
    lastModified: "1 week ago",
  },
  {
    id: 3,
    name: "Customer Feedback",
    description: "Collect feedback from customers after service delivery",
    status: "active",
    calls: 127,
    successRate: 91,
    lastModified: "3 days ago",
  },
  {
    id: 4,
    name: "Renewal Reminder",
    description: "Remind customers about upcoming subscription renewals",
    status: "draft",
    calls: 0,
    successRate: 0,
    lastModified: "1 day ago",
  },
  {
    id: 5,
    name: "Support Triage",
    description: "Initial triage for support calls to determine urgency",
    status: "draft",
    calls: 0,
    successRate: 0,
    lastModified: "5 hours ago",
  },
]

export default function CallFlowsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  useEffect(() => {
    // Redirect to My Pathway page
    router.replace("/dashboard/pathway")
  }, [router])

  // Filter call flows based on search query and active tab
  const filteredFlows = callFlows.filter((flow) => {
    const matchesSearch =
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "active") return matchesSearch && flow.status === "active"
    if (activeTab === "draft") return matchesSearch && flow.status === "draft"

    return matchesSearch
  })

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="text-muted-foreground">Redirecting to My Pathway...</p>
      </div>
    </div>
  )
}
