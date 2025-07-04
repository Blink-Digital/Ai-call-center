import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ error: "Session error", details: sessionError.message }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get users from public.users table
    const { data: publicUsers, error: publicError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (publicError) {
      return NextResponse.json(
        {
          error: "Failed to fetch public users",
          details: publicError.message,
        },
        { status: 500 },
      )
    }

    // Get current user's profile
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single()

    // Count users in both tables
    const { count: authCount } = await supabase.from("users").select("*", { count: "exact", head: true })

    return NextResponse.json({
      success: true,
      data: {
        currentUser: currentUser || null,
        currentUserError: currentUserError?.message || null,
        recentUsers: publicUsers || [],
        totalUsers: publicUsers?.length || 0,
        authUserId: session.user.id,
        authUserEmail: session.user.email,
        publicUsersCount: authCount || 0,
        syncStatus: currentUser ? "synced" : "missing",
      },
    })
  } catch (error: any) {
    console.error("❌ [DEBUG-USERS] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
