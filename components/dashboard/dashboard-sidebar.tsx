"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, FileText, Home, PhoneCall, Settings, Users, Phone, CreditCard, HardDrive } from "lucide-react"

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Pathway", href: "/dashboard/pathway", icon: FileText },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Call History", href: "/dashboard/call-history", icon: PhoneCall },
  { name: "Phone Numbers", href: "/dashboard/phone-numbers", icon: Phone },
  { name: "Team", href: "/dashboard/teams", icon: Users },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <aside className="fixed left-0 top-0 z-40 h-screen w-16 bg-gray-50 border-r border-gray-200">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <span className="text-xl font-bold text-gray-900">B</span>
        </div>
      </aside>
    )
  }

  return (
    <aside className="group fixed left-0 top-0 z-40 h-screen w-16 hover:w-60 bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-gray-200 px-4">
        <div className="flex items-center min-w-0">
          <div className="flex-shrink-0">
            <span className="text-xl font-bold text-gray-900">B</span>
          </div>
          <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 overflow-hidden whitespace-nowrap">
            <span className="text-xl font-bold text-gray-900">land.ai</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {sidebarLinks.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard" || pathname === "/dashboard/"
                : pathname.startsWith(link.href + "/") || pathname === link.href

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group/item ${
                  isActive
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                }`}
              >
                <div className="flex-shrink-0">
                  <link.icon
                    className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-500 group-hover/item:text-gray-700"}`}
                  />
                </div>
                <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 overflow-hidden whitespace-nowrap">
                  <span>{link.name}</span>
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Storage indicator */}
      <div className="border-t border-gray-200 p-4">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HardDrive className="h-5 w-5 text-gray-500" />
            </div>
            <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 overflow-hidden whitespace-nowrap min-w-0 flex-1">
              <div>
                <p className="text-xs font-medium text-gray-500">Storage</p>
                <div className="mt-2">
                  <div className="h-2 rounded-full bg-gray-200">
                    <div className="h-2 w-2/3 rounded-full bg-blue-500"></div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-medium">65%</span> of 10GB used
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
