"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { useSupabaseBrowser } from "@/lib/supabase-browser"
import { useRouter, usePathname } from "next/navigation"

export interface User {
  id: string
  email?: string | null
  name?: string | null
  company?: string | null
  phoneNumber?: string | null
  role?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  signup: (data: SignupData) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message: string }>
  isAuthenticated: boolean
}

export interface SignupData {
  email: string
  password: string
  name: string
  company?: string
  phoneNumber?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const isAuthenticated = !!user
  const initializedRef = useRef(false)
  const isLoggingInRef = useRef(false)
  const supabase = useSupabaseBrowser()
  const router = useRouter()
  const pathname = usePathname()

  // Fetch user profile from public.users table
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("🔄 [AUTH-CONTEXT] Fetching user profile for:", userId)

      const { data: profile, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        console.error("❌ [AUTH-CONTEXT] Error fetching user profile:", error)
        return null
      }

      console.log("✅ [AUTH-CONTEXT] User profile fetched:", profile)
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        company: profile.company,
        phoneNumber: profile.phone_number,
        role: profile.role,
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Unexpected error fetching profile:", error)
      return null
    }
  }

  // Create user profile if it doesn't exist (fallback for trigger failure)
  const createUserProfile = async (authUser: any) => {
    try {
      console.log("🔄 [AUTH-CONTEXT] Creating user profile for:", authUser.id)

      const { data, error } = await supabase
        .from("users")
        .insert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email,
          company: authUser.user_metadata?.company || null,
          phone_number: authUser.user_metadata?.phone_number || null,
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ [AUTH-CONTEXT] Failed to create user profile:", error)
        return null
      }

      console.log("✅ [AUTH-CONTEXT] User profile created:", data)
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        company: data.company,
        phoneNumber: data.phone_number,
        role: data.role,
      }
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Unexpected error creating profile:", error)
      return null
    }
  }

  // Get user data with profile sync
  const getUserWithProfile = async (authUser: any) => {
    // First try to get existing profile
    let profile = await fetchUserProfile(authUser.id)

    // If no profile exists, create one (fallback for trigger failure)
    if (!profile) {
      console.log("⚠️ [AUTH-CONTEXT] No profile found, creating one...")
      profile = await createUserProfile(authUser)
    }

    // If still no profile, use auth data as fallback
    if (!profile) {
      console.log("⚠️ [AUTH-CONTEXT] Using auth data as fallback")
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email,
        company: authUser.user_metadata?.company,
        phoneNumber: authUser.user_metadata?.phone_number,
        role: "user",
      }
    }

    return profile
  }

  // Simple session refresh with profile data
  const refreshSession = async () => {
    try {
      console.log("🔄 [AUTH-CONTEXT] Refreshing session...")

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.log("❌ [AUTH-CONTEXT] Session error:", error.message)
        setUser(null)
        setLoading(false)
        return false
      }

      if (session?.user) {
        console.log("✅ [AUTH-CONTEXT] Valid session found:", session.user.id)

        // Get user with profile sync
        const userData = await getUserWithProfile(session.user)
        setUser(userData)
        setLoading(false)
        return true
      }

      console.log("❌ [AUTH-CONTEXT] No valid session found")
      setUser(null)
      setLoading(false)
      return false
    } catch (error) {
      console.error("❌ [AUTH-CONTEXT] Session refresh failed:", error)
      setUser(null)
      setLoading(false)
      return false
    }
  }

  // Single initialization effect
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    console.log("🔄 [AUTH-CONTEXT] Initializing auth context...")

    // Initial session check
    refreshSession()

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 [AUTH-CONTEXT] Auth state change:", event, session?.user?.id)
      console.log("🔄 [AUTH-CONTEXT] Current pathname:", pathname)
      console.log("🔄 [AUTH-CONTEXT] Is logging in:", isLoggingInRef.current)

      if (event === "SIGNED_IN" && session?.user) {
        console.log("✅ [AUTH-CONTEXT] User signed in, fetching profile...")

        // Get user with profile sync
        const userData = await getUserWithProfile(session.user)
        setUser(userData)
        setLoading(false)

        // Redirect logic
        if (isLoggingInRef.current || pathname === "/login") {
          console.log("🔄 [AUTH-CONTEXT] Redirecting to dashboard after login...")
          router.push("/dashboard")
          isLoggingInRef.current = false
        } else {
          console.log("🔄 [AUTH-CONTEXT] Session validated, staying on current page:", pathname)
        }
      } else if (event === "SIGNED_OUT") {
        console.log("🔄 [AUTH-CONTEXT] User signed out, clearing context...")
        setUser(null)
        setLoading(false)
        isLoggingInRef.current = false
        router.push("/login")
      } else if (event === "INITIAL_SESSION") {
        if (session?.user) {
          console.log("✅ [AUTH-CONTEXT] Initial session confirmed:", session.user.id)

          // Get user with profile sync
          const userData = await getUserWithProfile(session.user)
          setUser(userData)
        } else {
          console.log("❌ [AUTH-CONTEXT] No initial session found")
          setUser(null)
        }
        setLoading(false)
      } else if (event === "TOKEN_REFRESHED") {
        console.log("🔄 [AUTH-CONTEXT] Token refreshed, session still valid")
        if (session?.user && !user) {
          const userData = await getUserWithProfile(session.user)
          setUser(userData)
        }
      }
    })

    return () => {
      console.log("🧹 [AUTH-CONTEXT] Cleaning up auth context...")
      subscription.unsubscribe()
      initializedRef.current = false
      isLoggingInRef.current = false
    }
  }, [supabase, router, pathname])

  const login = async (email: string, password: string) => {
    try {
      console.log("🔄 [AUTH-CONTEXT] Starting login for:", email)
      isLoggingInRef.current = true

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ [AUTH-CONTEXT] Login error:", error)
        isLoggingInRef.current = false
        return { success: false, message: error.message }
      }

      if (!data.user || !data.session) {
        isLoggingInRef.current = false
        return { success: false, message: "Login failed - no user data received" }
      }

      console.log("✅ [AUTH-CONTEXT] Login successful, user:", data.user.id)

      // Update last_login timestamp
      await supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.user.id)

      return { success: true, message: "Login successful" }
    } catch (error: any) {
      console.error("❌ [AUTH-CONTEXT] Unexpected login error:", error)
      isLoggingInRef.current = false
      return { success: false, message: error.message || "An unexpected error occurred" }
    }
  }

  const signup = async (data: SignupData) => {
    try {
      console.log("🔄 [AUTH-CONTEXT] Starting signup for:", data.email)

      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            company: data.company || null,
            phone_number: data.phoneNumber || null,
          },
        },
      })

      if (authError) {
        console.error("❌ [AUTH-CONTEXT] Signup error:", authError)
        return { success: false, message: authError.message }
      }

      if (!authData.user) {
        return { success: false, message: "Failed to create user" }
      }

      console.log("✅ [AUTH-CONTEXT] Auth user created:", authData.user.id)

      // Wait a moment for the trigger to process
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Verify the profile was created (and create if needed)
      const userData = await getUserWithProfile(authData.user)

      if (userData) {
        console.log("✅ [AUTH-CONTEXT] User profile confirmed:", userData)
        return { success: true, message: "Account created successfully" }
      } else {
        console.error("❌ [AUTH-CONTEXT] Failed to create or verify user profile")
        return { success: false, message: "Account created but profile setup failed" }
      }
    } catch (error: any) {
      console.error("❌ [AUTH-CONTEXT] Unexpected signup error:", error)
      return { success: false, message: error.message || "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Error signing out:", error)
      }
      setUser(null)
      isLoggingInRef.current = false
    } catch (err) {
      console.error("Logout error:", err)
      setUser(null)
      isLoggingInRef.current = false
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) {
        return { success: false, message: "Not logged in" }
      }

      console.log("🔄 [AUTH-CONTEXT] Updating profile for user:", user.id)

      // Update the public.users table
      const { error } = await supabase
        .from("users")
        .update({
          name: data.name,
          company: data.company,
          phone_number: data.phoneNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        console.error("❌ [AUTH-CONTEXT] Profile update error:", error)
        return { success: false, message: error.message }
      }

      // Update local state
      setUser((prev) => (prev ? { ...prev, ...data } : null))

      console.log("✅ [AUTH-CONTEXT] Profile updated successfully")
      return { success: true, message: "Profile updated successfully" }
    } catch (error: any) {
      console.error("❌ [AUTH-CONTEXT] Unexpected profile update error:", error)
      return { success: false, message: error.message || "An unexpected error occurred" }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
