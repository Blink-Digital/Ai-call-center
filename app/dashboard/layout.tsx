"use client"

import type React from "react"

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main content area - offset by sidebar width */}
      <div className="flex-1 flex flex-col overflow-hidden ml-16">{children}</div>
    </div>
  )
}
