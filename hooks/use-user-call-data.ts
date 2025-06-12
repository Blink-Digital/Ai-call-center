"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSupabaseBrowser } from "@/lib/supabase-browser"

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
  const hasInitialized = useRef(false)
  const isCurrentlyFetching = useRef(false)

  const [callData, setCallData] = useState<UserCallData>({
    calls: [],
    totalCalls: 0,
    userPhoneNumber: null,
    loading: true,
    error: null,
    lastUpdated: null,
  })

  const fetchUserCallData = useCallback(async () => {
    if (!user || authLoading || isCurrentlyFetching.current) {
      console.log("📱 [USE-USER-CALL-DATA] Skipping fetch - conditions not met")
      return
    }

    try {
      isCurrentlyFetching.current = true
      setCallData((prev) => ({ ...prev, loading: true, error: null }))

      console.log("📱 [USE-USER-CALL-DATA] Fetching data for user:", user.id)

      // 1. Get user's phone numbers
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
        console.log("📱 [USE-USER-CALL-DATA] No phone numbers found")
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
      console.log("📱 [USE-USER-CALL-DATA] User phone number:", userPhoneNumber)

      // 2. Fetch calls from Bland.ai via our proxy
      const response = await fetch(`/api/bland-ai/proxy/calls?limit=50`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch calls: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      console.log("✅ [USE-USER-CALL-DATA] Fetched calls:", {
        count: data.calls?.length || 0,
        total: data.total,
        sample: data.calls?.[0],
      })

      // Transform the calls to match our interface
      const transformedCalls: UserCall[] = (data.calls || []).map((call: any) => ({
        id: call.call_id,
        to_number: call.to || call.to_number || "",
        from_number: call.from || call.from_number || "",
        status: call.queue_status || call.status || (call.completed ? "completed" : "failed"),
        duration: Math.round((call.call_length || 0) * 60), // Convert minutes to seconds
        start_time: call.created_at || call.start_time || new Date().toISOString(),
        pathway_id: call.pathway_id,
        pathway_name: call.pathway_name,
        outcome: call.answered_by,
        recording_url: call.recording_url,
        transcript: call.transcript,
      }))

      setCallData({
        calls: transformedCalls,
        totalCalls: data.total || transformedCalls.length,
        userPhoneNumber,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      })

      console.log("✅ [USE-USER-CALL-DATA] Data transformed successfully:", {
        transformedCount: transformedCalls.length,
        firstCall: transformedCalls[0],
      })
    } catch (error: any) {
      console.error("❌ [USE-USER-CALL-DATA] Error:", error)
      setCallData((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
    } finally {
      isCurrentlyFetching.current = false
    }
  }, [user, authLoading, supabase])

  // Only fetch once when component mounts and user is ready
  useEffect(() => {
    if (!authLoading && user && !hasInitialized.current) {
      hasInitialized.current = true
      console.log("📱 [USE-USER-CALL-DATA] Initializing data fetch")
      fetchUserCallData()
    }
  }, [user, authLoading, fetchUserCallData])

  return {
    ...callData,
    refetch: fetchUserCallData,
  }
}
