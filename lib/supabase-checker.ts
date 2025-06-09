export function checkSupabaseConfig() {
  const config = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  const hasUrl = !!config.url
  const hasKey = !!config.anonKey
  const hasServiceRoleKey = !!config.serviceRoleKey
  const urlPrefix = config.url ? config.url.substring(0, 10) + "..." : "missing"
  const issues = []

  if (!config.url) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL is missing")
  }

  if (!config.anonKey) {
    issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing")
  }

  if (!config.serviceRoleKey) {
    issues.push("SUPABASE_SERVICE_ROLE_KEY is missing")
  }

  return {
    hasIssues: issues.length > 0,
    issues,
    config: {
      hasUrl,
      hasAnonKey: hasKey,
      hasServiceRoleKey,
      urlPrefix,
    },
    isConfigured: hasUrl && hasKey,
  }
}
