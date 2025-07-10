"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface DashboardHeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  children?: React.ReactNode
}

export function DashboardHeader({ title, subtitle, showBackButton = false, children }: DashboardHeaderProps) {
  const router = useRouter()

  return (
    <div className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        {/* Right side content - removed search bar and profile dropdown */}
        <div className="flex items-center gap-4">{children}</div>
      </div>
    </div>
  )
}
