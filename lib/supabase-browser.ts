import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | undefined

// Export the function with the exact name that's being imported elsewhere
export function useSupabaseBrowser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  return client
}

// Also export as default for convenience
export default useSupabaseBrowser
