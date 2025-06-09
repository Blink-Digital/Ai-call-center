"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSupabaseBrowser } from "@/lib/supabase-browser"

export interface PhoneNumberWithPathway {
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

export function useUserPhoneNumbersWithPathways() {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabaseBrowser()
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberWithPathway[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPhoneNumbersWithPathways = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log("📱 [USE-USER-DATA-ENHANCED] Fetching phone numbers with pathways for user:", user.id)

      // First get phone numbers
      const { data: phoneData, error: phoneError } = await supabase
        .from("phone_numbers")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "purchased"])
        .order("created_at", { ascending: false })

      if (phoneError) {
        throw new Error(phoneError.message)
      }

      // Then get pathways for these phone numbers
      const phoneIds = phoneData?.map((phone) => phone.id) || []

      let pathwayData: any[] = []
      if (phoneIds.length > 0) {
        const { data: pathways, error: pathwayError } = await supabase
          .from("pathways")
          .select("id, pathway_id, pathway_name, pathway_description")
          .in("id", phoneIds)

        if (pathwayError) {
          console.warn("Warning: Could not fetch pathways:", pathwayError.message)
        } else {
          pathwayData = pathways || []
        }
      }

      // Combine phone numbers with their pathways
      const combinedData =
        phoneData?.map((phone) => {
          const pathway = pathwayData.find((p) => p.id === phone.id)
          return {
            ...phone,
            pathway_id: pathway?.pathway_id || null,
            pathway_name: pathway?.pathway_name || null,
            pathway_description: pathway?.pathway_description || null,
          }
        }) || []

      console.log("✅ [USE-USER-DATA-ENHANCED] Combined data fetched:", {
        phoneCount: phoneData?.length || 0,
        pathwayCount: pathwayData.length,
        combinedCount: combinedData.length,
      })

      setPhoneNumbers(combinedData)
    } catch (err: any) {
      console.error("❌ [USE-USER-DATA-ENHANCED] Error fetching data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      fetchPhoneNumbersWithPathways()
    }
  }, [user, authLoading])

  return {
    phoneNumbers,
    loading: authLoading || loading,
    error,
    refetch: fetchPhoneNumbersWithPathways,
  }
}
