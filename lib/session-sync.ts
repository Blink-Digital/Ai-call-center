import { useSupabaseBrowser } from "./supabase-browser"

export async function syncSessionToCookies() {
  const supabase = useSupabaseBrowser()

  try {
    console.log("🔄 [SESSION-SYNC] Syncing session to cookies...")

    // Get current session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("❌ [SESSION-SYNC] Error getting session:", error)
      return false
    }

    if (!session) {
      console.log("❌ [SESSION-SYNC] No session found to sync")
      return false
    }

    // Force set session to ensure cookies are written
    const { error: setError } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })

    if (setError) {
      console.error("❌ [SESSION-SYNC] Error setting session:", setError)
      return false
    }

    console.log("✅ [SESSION-SYNC] Session synced to cookies successfully")
    return true
  } catch (error) {
    console.error("❌ [SESSION-SYNC] Unexpected error:", error)
    return false
  }
}

export async function forceSessionRefresh() {
  const supabase = useSupabaseBrowser()

  try {
    console.log("🔄 [SESSION-SYNC] Forcing session refresh...")

    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error("❌ [SESSION-SYNC] Error refreshing session:", error)
      return false
    }

    if (data.session) {
      console.log("✅ [SESSION-SYNC] Session refreshed successfully")
      return true
    }

    return false
  } catch (error) {
    console.error("❌ [SESSION-SYNC] Unexpected error during refresh:", error)
    return false
  }
}
