import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createPathway, getPathwaysByUserId } from "@/lib/db-utils"
import type { Database } from "@/types/supabase"

// Get all pathways for the current user
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      },
    )

    console.log("🔍 [PATHWAYS] Getting user session...")

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("🚨 [PATHWAYS] Auth error:", authError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    if (!user) {
      console.error("🚨 [PATHWAYS] No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ [PATHWAYS] User authenticated:", user.id)

    const pathways = await getPathwaysByUserId(user.id)
    console.log("📊 [PATHWAYS] Found:", pathways?.length || 0, "pathways")

    return NextResponse.json({ pathways })
  } catch (error) {
    console.error("🚨 [PATHWAYS] Error fetching pathways:", error)
    return NextResponse.json({ error: "Failed to fetch pathways" }, { status: 500 })
  }
}

// Create a new pathway
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, teamId, data } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Pathway name is required" }, { status: 400 })
    }

    // If teamId is provided, check if user has access to the team
    if (teamId) {
      const { data: membership, error } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single()

      const { data: team } = await supabase.from("teams").select("owner_id").eq("id", teamId).single()

      if (error && team?.owner_id !== user.id) {
        return NextResponse.json({ error: "You don't have access to this team" }, { status: 403 })
      }

      if (!membership && team?.owner_id !== user.id) {
        return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 })
      }

      // Check if user has permission to create pathways in this team
      if (membership && !["admin", "editor"].includes(membership.role) && team?.owner_id !== user.id) {
        return NextResponse.json(
          { error: "You don't have permission to create pathways in this team" },
          { status: 403 },
        )
      }
    }

    const pathway = await createPathway({
      name,
      description,
      teamId,
      creatorId: user.id,
      data,
    })

    return NextResponse.json({ pathway }, { status: 201 })
  } catch (error) {
    console.error("🚨 [PATHWAYS] Error creating pathway:", error)
    return NextResponse.json({ error: "Failed to create pathway" }, { status: 500 })
  }
}
