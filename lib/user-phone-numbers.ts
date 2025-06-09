import { supabase } from "./supabase"

export interface UserPhoneNumber {
  id: string
  number: string
  status: string
  location?: string
  type?: string
  purchased_at: string
  user_id: string
}

export async function getUserPhoneNumbers(userId: string): Promise<UserPhoneNumber[]> {
  try {
    const { data, error } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "purchased")

    if (error) {
      console.error("Error fetching user phone numbers:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUserPhoneNumbers:", error)
    return []
  }
}

export async function getCurrentUser() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.user || null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
