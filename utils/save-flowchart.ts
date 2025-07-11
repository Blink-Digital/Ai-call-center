import { toast } from "@/components/ui/use-toast"

interface SaveFlowchartParams {
  nodes: any[]
  edges: any[]
  phoneNumber: string
  pathwayName: string
  pathwayDescription: string
  user: any
}

export async function saveFlowchart({
  nodes,
  edges,
  phoneNumber,
  pathwayName,
  pathwayDescription,
  user,
}: SaveFlowchartParams) {
  if (!user || !phoneNumber) {
    toast({
      title: "Save failed",
      description: "User authentication or phone number missing.",
      variant: "destructive",
    })
    return { success: false, error: "Missing required data" }
  }

  const flowchartData = {
    nodes,
    edges,
    name: pathwayName || `Pathway for ${phoneNumber}`,
    description: pathwayDescription || `Flowchart created on ${new Date().toLocaleString()}`,
    viewport: { x: 0, y: 0, zoom: 1 }, // Default viewport
  }

  try {
    console.log("[SAVE] 💾 Saving flowchart to database...")
    console.log("[SAVE] 📞 Phone:", phoneNumber)
    console.log("[SAVE] 👤 User:", user.email)
    console.log("[SAVE] 📊 Data:", { nodes: nodes.length, edges: edges.length })

    // Save to Supabase database
    const response = await fetch("/api/flowcharts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        flowchartData,
        name: pathwayName,
        description: pathwayDescription,
      }),
      credentials: "include",
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to save flowchart")
    }

    // Also save to localStorage as backup
    const storageKey = `bland-flowchart-${phoneNumber}`
    localStorage.setItem(storageKey, JSON.stringify(flowchartData))

    const action = result.action === "created" ? "created" : "updated"
    const message =
      result.action === "created"
        ? `✅ New flowchart saved for ${phoneNumber}`
        : `🔄 Flowchart updated for ${phoneNumber}`

    toast({
      title: "Flowchart saved",
      description: message,
    })

    console.log(`[SAVE] ✅ Success: Flowchart ${action}`)
    console.log("[SAVE] 📋 Result:", result)

    return {
      success: true,
      action: result.action,
      pathway: result.pathway,
      message,
    }
  } catch (error) {
    console.error("[SAVE] ❌ Error saving flowchart:", error)

    // Fallback: save to localStorage only
    try {
      const storageKey = `bland-flowchart-${phoneNumber}`
      localStorage.setItem(storageKey, JSON.stringify(flowchartData))

      toast({
        title: "Saved locally",
        description: "Saved to browser storage. Database sync failed.",
        variant: "destructive",
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: "localStorage",
      }
    } catch (localError) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save flowchart",
        variant: "destructive",
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

export async function loadFlowchart(phoneNumber: string, user: any) {
  if (!user || !phoneNumber) {
    return null
  }

  try {
    console.log("[LOAD] 📂 Loading flowchart from database...")
    console.log("[LOAD] 📞 Phone:", phoneNumber)
    console.log("[LOAD] 👤 User:", user.email)

    const response = await fetch(`/api/flowcharts?phoneNumber=${encodeURIComponent(phoneNumber)}`, {
      method: "GET",
      credentials: "include",
    })

    if (response.status === 404) {
      console.log("[LOAD] ℹ️ No flowchart found in database")
      return null
    }

    if (!response.ok) {
      throw new Error("Failed to load flowchart from database")
    }

    const result = await response.json()

    if (result.success && result.pathway?.data) {
      console.log("[LOAD] ✅ Loaded flowchart from database")
      return result.pathway
    }

    return null
  } catch (error) {
    console.error("[LOAD] ❌ Error loading from database:", error)

    // Fallback to localStorage
    try {
      const storageKey = `bland-flowchart-${phoneNumber}`
      const savedFlow = localStorage.getItem(storageKey)

      if (savedFlow) {
        const flow = JSON.parse(savedFlow)
        console.log("[LOAD] 📱 Loaded flowchart from localStorage")
        return { data: flow, name: flow.name, description: flow.description }
      }
    } catch (localError) {
      console.error("[LOAD] ❌ Error loading from localStorage:", localError)
    }

    return null
  }
}
