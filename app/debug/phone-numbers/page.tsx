"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export default function DebugPhoneNumbersPage() {
  const { user } = useAuth()
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebugCheck = async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log("🔍 Starting debug check...")

      // 1. Check current user
      const {
        data: { session },
      } = await supabase.auth.getSession()
      console.log("🔍 Current session:", session)

      // 2. Check all phone numbers
      const { data: allNumbers, error: allError } = await supabase.from("phone_numbers").select("*")

      console.log("🔍 All phone numbers:", allNumbers)

      // 3. Check phone numbers for current user
      const { data: userNumbers, error: userError } = await supabase
        .from("phone_numbers")
        .select("*")
        .eq("user_id", user.id)

      console.log("🔍 User phone numbers:", userNumbers)

      // 4. Check users table
      const { data: userData, error: userDataError } = await supabase.from("users").select("*").eq("id", user.id)

      console.log("🔍 User data:", userData)

      // 5. Check RLS policies
      const { data: policies, error: policiesError } = await supabase
        .rpc("get_policies_for_table", { table_name: "phone_numbers" })
        .single()

      console.log("🔍 RLS Policies:", policies)

      setDebugData({
        currentUser: user,
        session: session,
        allNumbers: allNumbers,
        userNumbers: userNumbers,
        userData: userData,
        policies: policies,
        errors: {
          allError,
          userError,
          userDataError,
          policiesError,
        },
      })
    } catch (error) {
      console.error("❌ Debug error:", error)
      setDebugData({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      runDebugCheck()
    }
  }, [user])

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug: Phone Numbers</h1>
        <p>Please log in to run debug checks.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug: Phone Numbers</h1>
        <Button onClick={runDebugCheck} disabled={loading}>
          {loading ? "Running..." : "Refresh Debug"}
        </Button>
      </div>

      {debugData && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(debugData.currentUser, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(debugData.session?.user, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Phone Numbers in Database</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(debugData.allNumbers, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phone Numbers for Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(debugData.userNumbers, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Data from Users Table</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(debugData.userData, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-red-100 p-4 rounded overflow-auto">
                {JSON.stringify(debugData.errors, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
