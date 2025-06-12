"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSupabaseBrowser } from "@/lib/supabase-browser"

export interface PhoneNumber {
  id: string
  number: string
  location: string
  type: string
  status: string
  created_at: string
  user_id: string
  pathway_id?: string | null
  pathway_name?: string | null
  pathway_description?: string | null
}

export interface CallHistoryPagination {
  page: number
  pageSize: number
  totalPages: number
  totalCalls: number
}

export function useUserPhoneNumbers() {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabaseBrowser()
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)
  const lastFetchRef = useRef(0)

  const fetchPhoneNumbers = async () => {
    if (!user || fetchingRef.current) {
      setLoading(false)
      return
    }

    // Prevent rapid successive calls
    const now = Date.now()
    if (now - lastFetchRef.current < 1000) {
      console.log("📱 [USE-USER-DATA] Skipping fetch - too soon after last request")
      return
    }

    try {
      fetchingRef.current = true
      lastFetchRef.current = now
      setLoading(true)
      setError(null)

      console.log("📱 [USE-USER-DATA] Fetching phone numbers for user:", user.id)

      // First try the API endpoint with proper error handling
      try {
        const response = await fetch("/api/user/phone-numbers", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        // Check if response is actually JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response")
        }

        if (response.ok) {
          const data = await response.json()
          console.log("✅ [USE-USER-DATA] Phone numbers fetched from API:", {
            count: data?.phoneNumbers?.length || 0,
            userId: user.id,
          })

          setPhoneNumbers(data.phoneNumbers || [])
          setLoading(false)
          return
        } else if (response.status === 429) {
          throw new Error("Too many requests. Please wait a moment and try again.")
        } else {
          console.warn("⚠️ [USE-USER-DATA] API fetch failed, falling back to direct query")
        }
      } catch (apiError: any) {
        console.warn("⚠️ [USE-USER-DATA] API error, falling back to direct query:", apiError.message)

        // If it's a rate limit error, don't fallback
        if (apiError.message.includes("Too many requests")) {
          throw apiError
        }
      }

      // Fallback to direct query if API fails
      const { data, error: fetchError } = await supabase
        .from("phone_numbers")
        .select("*")
        .eq("user_id", user.id) // 🔒 Security: Filter by current user's ID
        .or("status.eq.active,status.eq.purchased")
        .order("created_at", { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      console.log("✅ [USE-USER-DATA] Phone numbers fetched from direct query:", {
        count: data?.length || 0,
        userId: user.id,
        sampleData: data?.[0]
          ? {
              id: data[0].id,
              number: data[0].number,
              pathway_id: data[0].pathway_id,
              pathway_name: data[0].pathway_name,
            }
          : null,
      })

      setPhoneNumbers(data || [])
    } catch (err: any) {
      console.error("❌ [USE-USER-DATA] Error fetching phone numbers:", err)
      setError(err.message)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchPhoneNumbers()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading])

  return {
    phoneNumbers,
    loading: authLoading || loading,
    error,
    refetch: fetchPhoneNumbers,
  }
}

export function useCallHistory(phoneNumber?: string) {
  const { user, loading: authLoading } = useAuth()
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<CallHistoryPagination>({
    page: 1,
    pageSize: 20, // Default page size
    totalPages: 1,
    totalCalls: 0,
  })

  const fetchCallHistory = async (phone?: string, page = 1, pageSize = 20) => {
    if (!user || !phone) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log("📞 [USE-CALL-HISTORY] Fetching call history for:", phone, "Page:", page, "PageSize:", pageSize)

      // Use the improved call history API with pagination
      const response = await fetch(
        `/api/bland-ai/proxy/calls?phone=${encodeURIComponent(phone)}&page=${page}&pageSize=${pageSize}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      console.log("📡 [USE-CALL-HISTORY] Response status:", response.status)

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response")
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ [USE-CALL-HISTORY] API error:", errorText)
        throw new Error(`Failed to fetch call history: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("✅ [USE-CALL-HISTORY] Data received:", {
        count: data.count,
        callsLength: data.calls?.length,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        debugInfo: data.debug_info,
      })

      setCalls(data.calls || [])
      setPagination({
        page: data.page || 1,
        pageSize: data.pageSize || 20,
        totalPages: data.totalPages || 1,
        totalCalls: data.count || 0,
      })
    } catch (err: any) {
      console.error("❌ [USE-CALL-HISTORY] Error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const changePage = (newPage: number) => {
    if (phoneNumber) {
      fetchCallHistory(phoneNumber, newPage, pagination.pageSize)
    }
  }

  const changePageSize = (newPageSize: number) => {
    if (phoneNumber) {
      fetchCallHistory(phoneNumber, 1, newPageSize) // Reset to page 1 when changing page size
    }
  }

  useEffect(() => {
    if (!authLoading && phoneNumber) {
      fetchCallHistory(phoneNumber, pagination.page, pagination.pageSize)
    }
  }, [user, authLoading, phoneNumber])

  return {
    calls,
    loading: authLoading || loading,
    error,
    pagination,
    changePage,
    changePageSize,
    refetch: () => fetchCallHistory(phoneNumber, pagination.page, pagination.pageSize),
  }
}
