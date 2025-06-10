"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { useSupabaseBrowser } from "@/lib/supabase-browser"

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
  const supabase = useSupabaseBrowser()

  // ✅ Stable session refresh without router interference
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
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email,
        })
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

  // ✅ Single initialization effect with better session handling
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    console.log("🔄 [AUTH-CONTEXT] Initializing auth context...")

    // Initial session check
    refreshSession()

    // ✅ Set up auth state listener with proper session confirmation
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 [AUTH-CONTEXT] Auth state change:", event, session?.user?.id)

      if (event === "SIGNED_IN" && session?.user) {
        console.log("✅ [AUTH-CONTEXT] User signed in, updating context...")
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email,
        })
        setLoading(false)

        // ✅ CRITICAL: Force a page refresh to ensure middleware sees the new session
        console.log("🔄 [AUTH-CONTEXT] Forcing page refresh to sync middleware...")
        window.location.href = "/dashboard"
      } else if (event === "SIGNED_OUT") {
        console.log("🔄 [AUTH-CONTEXT] User signed out, clearing context...")
        setUser(null)
        setLoading(false)
      } else if (event === "INITIAL_SESSION") {
        // ✅ Handle initial session load properly
        if (session?.user) {
          console.log("✅ [AUTH-CONTEXT] Initial session confirmed:", session.user.id)
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email,
          })
        } else {
          console.log("❌ [AUTH-CONTEXT] No initial session found")
          setUser(null)
        }
        setLoading(false)
      } else if (event === "TOKEN_REFRESHED") {
        // ✅ Handle token refresh without re-triggering data fetches
        console.log("🔄 [AUTH-CONTEXT] Token refreshed, session still valid")
        if (session?.user && !user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email,
          })
        }
      }
    })

    return () => {
      console.log("🧹 [AUTH-CONTEXT] Cleaning up auth context...")
      subscription.unsubscribe()
      initializedRef.current = false
    }
  }, [supabase]) // ✅ Only depend on supabase client

  const login = async (email: string, password: string) => {
    try {
      console.log("🔄 [AUTH-CONTEXT] Starting login for:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ [AUTH-CONTEXT] Login error:", error)
        return { success: false, message: error.message }
      }

      if (!data.user || !data.session) {
        return { success: false, message: "Login failed - no user data received" }
      }

      console.log("✅ [AUTH-CONTEXT] Login successful, user:", data.user.id)

      // ✅ The onAuthStateChange handler will trigger and handle the redirect
      return { success: true, message: "Login successful" }
    } catch (error: any) {
      console.error("❌ [AUTH-CONTEXT] Unexpected login error:", error)
      return { success: false, message: error.message || "An unexpected error occurred" }
    }
  }

  const signup = async (data: SignupData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            company: data.company,
            phone_number: data.phoneNumber,
          },
        },
      })

      if (authError) {
        return { success: false, message: authError.message }
      }

      if (!authData.user) {
        return { success: false, message: "Failed to create user" }
      }

      return { success: true, message: "Account created successfully" }
    } catch (error: any) {
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
      // ✅ Force redirect to login
      window.location.href = "/login"
    } catch (err) {
      console.error("Logout error:", err)
      setUser(null)
      window.location.href = "/login"
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) {
        return { success: false, message: "Not logged in" }
      }

      setUser((prev) => (prev ? { ...prev, ...data } : null))
      return { success: true, message: "Profile updated successfully" }
    } catch (error: any) {
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
