import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// ✅ Create a singleton Supabase client for browser use
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function useSupabaseBrowser() {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>({
      // ✅ CRITICAL: Ensure cookies are used for session storage
      cookieOptions: {
        name: "sb-auth-token",
        lifetime: 60 * 60 * 24 * 7, // 7 days
        domain: undefined,
        path: "/",
        sameSite: "lax",
      },
    })
  }
  return supabaseClient
}

// ✅ Export for backward compatibility
export { useSupabaseBrowser as createSupabaseBrowserClient }
export default useSupabaseBrowser
