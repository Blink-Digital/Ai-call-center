"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSupabaseBrowser } from "@/lib/supabase-browser"
import { toE164Format } from "@/utils/phone-utils"

export interface UserCall {
  id: string
  to_number: string
  from_number: string
  status: string
  duration: number
  start_time: string
  pathway_id?: string
  pathway_name?: string
  outcome?: string
  recording_url?: string
  transcript?: string
}

export interface UserCallData {
  calls: UserCall[]
  totalCalls: number
  userPhoneNumber: string | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function useUserCallData() {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabaseBrowser()

  const [callData, setCallData] = useState<UserCallData>({
    calls: [],
    totalCalls: 0,
    userPhoneNumber: null,
    loading: true,
    error: null,
    lastUpdated: null,
  })

  const fetchUserCallData = async () => {
    if (!user) {
      setCallData((prev) => ({ ...prev, loading: false }))
      return
    }

    try {
      setCallData((prev) => ({ ...prev, loading: true, error: null }))

      console.log("📱 [USE-USER-CALL-DATA] Fetching data for user:", user.id)

      // 1. First, get the user's phone number from our database
      const { data: phoneNumbers, error: phoneError } = await supabase
        .from("phone_numbers")
        .select("number")
        .eq("user_id", user.id)
        .in("status", ["active", "purchased"])
        .order("created_at", { ascending: false })
        .limit(1)

      if (phoneError) {
        throw new Error(`Failed to fetch user phone number: ${phoneError.message}`)
      }

      if (!phoneNumbers || phoneNumbers.length === 0) {
        console.log("📱 [USE-USER-CALL-DATA] No phone numbers found for user")
        setCallData({
          calls: [],
          totalCalls: 0,
          userPhoneNumber: null,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        })
        return
      }

      const userPhoneNumber = phoneNumbers[0].number
      console.log("📱 [USE-USER-CALL-DATA] User phone number (raw):", userPhoneNumber)

      // 2. Convert to clean E.164 format for Bland.ai API
      const cleanPhoneNumber = toE164Format(userPhoneNumber)
      console.log("📱 [USE-USER-CALL-DATA] User phone number (E.164):", cleanPhoneNumber)

      // 3. Now fetch calls from Bland.ai using clean E.164 format
      // ✅ FIXED: Use to_number instead of from_number
      const blandResponse = await fetch(
        `/api/bland-ai/proxy/calls?to_number=${encodeURIComponent(cleanPhoneNumber)}&limit=1000`,
      )

      if (!blandResponse.ok) {
        const errorText = await blandResponse.text()
        throw new Error(`Bland.ai API error: ${blandResponse.status} ${errorText}`)
      }

      const blandData = await blandResponse.json()
      console.log("📞 [USE-USER-CALL-DATA] Bland.ai response:", {
        callsCount: blandData.calls?.length || 0,
        total: blandData.total,
        queryUsed: `to_number=${cleanPhoneNumber}`, // Log the query used
      })

      // 4. Update state with the fetched data
      setCallData({
        calls: blandData.calls || [],
        totalCalls: blandData.calls?.length || 0,
        userPhoneNumber, // Store the original formatted version for display
        loading: false,
        error: null,
        lastUpdated: new Date(),
      })

      console.log("✅ [USE-USER-CALL-DATA] Data loaded successfully")
    } catch (error: any) {
      console.error("❌ [USE-USER-CALL-DATA] Error:", error)
      setCallData((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
    }
  }

  // Fetch data when user is confirmed
  useEffect(() => {
    if (!authLoading && user) {
      fetchUserCallData()
    }
  }, [user, authLoading])

  return {
    ...callData,
    refetch: fetchUserCallData,
  }
}
