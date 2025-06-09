"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DebugUserInfo } from "@/components/debug-user-info"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  // ✅ Show loading state during auth initialization
  if (loading) {
    console.log("🔄 Dashboard layout: Still loading session")
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ Show login prompt if not authenticated
  if (!user) {
    console.log("🔒 Dashboard layout: No user, showing login prompt")
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">Please log in to access the dashboard</p>
          <a href="/login" className="text-blue-600 hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  console.log("✅ Dashboard layout: User authenticated, rendering dashboard")
  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />

      {/* Main content area - ensure no overflow issues */}
      <div className="flex flex-col flex-1 ml-16 group-hover:ml-60 transition-all duration-300 ease-in-out min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto relative">
          <div className="h-full">{children}</div>
        </main>
        <DebugUserInfo />
      </div>
    </div>
  )
}
