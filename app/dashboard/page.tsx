"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BarChart3, Phone, TrendingUp, Activity, Clock, ArrowRight, Zap } from "lucide-react"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const userName = user?.name || user?.email?.split("@")[0] || "User"

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Hi {userName}!</h1>
            <p className="text-slate-400 text-lg">Here's everything you need to know about your calls.</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 rounded-xl">
              Build Pathway
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">Create Flow</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">6,078</div>
              <p className="text-xs text-slate-400">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">94.2%</div>
              <p className="text-xs text-slate-400">+2.1% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">2m 45s</div>
              <p className="text-xs text-slate-400">-15s from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Active Pathways</CardTitle>
              <Activity className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">12</div>
              <p className="text-xs text-slate-400">+3 new this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Call Distribution Chart */}
          <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Call Distribution by Region</CardTitle>
              <CardDescription className="text-slate-400">Geographic distribution of your calls</CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="text-slate-400 text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Interactive map visualization would go here</p>
                <p className="text-sm mt-2">Showing call distribution across regions</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-slate-400">One-click shortcuts to your essential tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/dashboard/pathway" className="block">
                <div className="flex items-center p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Conversational Pathways</h3>
                      <p className="text-sm text-slate-400">Design infinitely complex branching conversational flows</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </Link>

              <Link href="/dashboard/analytics" className="block">
                <div className="flex items-center p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Analytics Dashboard</h3>
                      <p className="text-sm text-slate-400">View detailed call analytics and performance metrics</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </Link>

              <Link href="/dashboard/phone-numbers" className="block">
                <div className="flex items-center p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Phone Numbers</h3>
                      <p className="text-sm text-slate-400">Manage your phone numbers and configurations</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Call Logs */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Call Logs</CardTitle>
            <CardDescription className="text-slate-400">Recent call activity and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-400 pb-2 border-b border-slate-700">
                <div>6078 Total</div>
                <div>To</div>
                <div>From</div>
                <div>Duration</div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm py-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-white">Medicare | AI Inbound Calls - Kaustubh</span>
                </div>
                <div className="text-slate-400">(604) 235-2205</div>
                <div className="text-slate-400">-</div>
                <div className="text-slate-400">0m 22s</div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm py-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-white">Tax Relief | AI Inbound Calls - Sarah</span>
                </div>
                <div className="text-slate-400">(555) 123-4567</div>
                <div className="text-slate-400">-</div>
                <div className="text-slate-400">1m 45s</div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-white">Insurance | AI Outbound Calls - Mike</span>
                </div>
                <div className="text-slate-400">(555) 987-6543</div>
                <div className="text-slate-400">-</div>
                <div className="text-slate-400">3m 12s</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
