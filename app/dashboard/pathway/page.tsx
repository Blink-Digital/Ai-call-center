"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Phone, ArrowRight, Plus, AlertCircle, RefreshCw, Copy, Search, Trash2, Edit, Folder } from "lucide-react"
import { formatPhoneNumber } from "@/utils/phone-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSupabaseBrowser } from "@/lib/supabase-browser"

interface PhoneNumber {
  id: string
  number: string
  location: string
  type: string
  status: string
  created_at: string
  user_id: string
  pathway_id?: string | null
  pathway_name?: string | null
  pathway_description?: string | null
}

interface PathwayCardProps {
  pathway: {
    id: string
    title: string
    description: string
    createdAgo: string
    publishedAgo?: string
    idShort: string
    fullId: string
    phoneNumber: string
    status: string
  }
  onCopy: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onMove: (id: string) => void
  onEdit: (phoneNumber: string) => void
}

function PathwayCard({ pathway, onCopy, onDelete, onDuplicate, onMove, onEdit }: PathwayCardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-all duration-200 flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-white text-base font-semibold truncate pr-2 leading-tight">
            {pathway.title}
          </CardTitle>
          <Badge
            className={
              pathway.status === "active"
                ? "bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                : "bg-slate-600 text-slate-300 flex-shrink-0"
            }
          >
            {pathway.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="bg-slate-700 text-slate-300 hover:bg-slate-600">
            Created {pathway.createdAgo}
          </Badge>
          {pathway.publishedAgo && (
            <Badge className="bg-green-600 text-white hover:bg-green-700">Published {pathway.publishedAgo}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-slate-400 h-12 overflow-hidden leading-relaxed">{pathway.description}</p>
      </CardContent>

      <CardFooter className="pt-0 mt-auto">
        <div className="w-full">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-3 pb-3 border-t border-slate-700">
            <span className="truncate font-mono text-xs text-green-400 bg-slate-700 px-2 py-1 rounded">
              {pathway.idShort}
            </span>
            <div className="flex space-x-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                title="Copy ID"
                onClick={() => onCopy(pathway.fullId)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-slate-700"
                title="Delete"
                onClick={() => onDelete(pathway.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                title="Duplicate"
                onClick={() => onDuplicate(pathway.id)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                title="Move to Folder"
                onClick={() => onMove(pathway.id)}
              >
                <Folder className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                title="Edit"
                onClick={() => onEdit(pathway.phoneNumber)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center justify-center gap-2 py-2"
            onClick={() => onEdit(pathway.phoneNumber)}
          >
            Manage Pathway
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function PathwayListingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = useSupabaseBrowser()
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Direct fetch function to ensure we're getting the latest data
  const fetchPhoneNumbers = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log("📱 [PATHWAY-PAGE] Fetching phone numbers for user:", user.id)

      // Direct query to ensure we're filtering by the current user
      const { data, error: fetchError } = await supabase
        .from("phone_numbers")
        .select("*")
        .eq("user_id", user.id) // Critical: Filter by current user's ID
        .in("status", ["active", "purchased"])
        .order("created_at", { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      console.log("✅ [PATHWAY-PAGE] Phone numbers fetched:", {
        count: data?.length || 0,
        userId: user.id,
        userEmail: user.email,
        numbers: data?.map((n) => n.number),
      })

      setPhoneNumbers(data || [])
    } catch (err: any) {
      console.error("❌ [PATHWAY-PAGE] Error fetching phone numbers:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchPhoneNumbers()
    }
  }, [user])

  const handleManagePathway = (phoneNumber: string) => {
    const normalizedNumber = phoneNumber.replace(/\D/g, "")
    router.push(`/dashboard/pathway/${normalizedNumber}`)
  }

  const copyPathwayId = (pathwayId: string) => {
    navigator.clipboard.writeText(pathwayId)
    toast({
      title: "Copied",
      description: "Pathway ID copied to clipboard",
    })
  }

  const handleCopy = (id: string) => {
    copyPathwayId(id)
  }

  const handleDelete = (id: string) => {
    toast({
      title: "Delete",
      description: "Delete functionality coming soon",
    })
  }

  const handleDuplicate = (id: string) => {
    toast({
      title: "Duplicate",
      description: "Duplicate functionality coming soon",
    })
  }

  const handleMove = (id: string) => {
    toast({
      title: "Move",
      description: "Move to folder functionality coming soon",
    })
  }

  // Transform phone numbers into pathway format
  const pathways = phoneNumbers.map((number) => {
    const createdDate = new Date(number.created_at)
    const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      id: number.id,
      title: `${formatPhoneNumber(number.number)} | ${number.pathway_name || "Untitled Pathway"}`,
      description: `Vertical: ${number.pathway_name || "General"} Publisher Name: AI Inbound Calls - ${number.location || "Unknown"} Phone Number: ${number.number}`,
      createdAgo: daysAgo === 0 ? "today" : `${daysAgo} days ago`,
      publishedAgo: number.pathway_id ? `${Math.max(1, daysAgo - 5)} days ago` : undefined,
      idShort: number.pathway_id ? `${number.pathway_id.substring(0, 8)}...` : "No ID",
      fullId: number.pathway_id || "",
      phoneNumber: number.number,
      status: number.status || "active",
    }
  })

  // Filter pathways based on search query
  const filteredPathways = pathways.filter(
    (pathway) =>
      pathway.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pathway.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your pathways...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Pathways</h1>
            <p className="text-slate-400">
              Manage call flow pathways for your phone numbers
              {user && <span className="text-xs ml-2">(User: {user.email})</span>}
            </p>
          </div>
          <Link href="/dashboard/phone-numbers/purchase">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3 flex items-center gap-2 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Purchase New Number
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search pathways..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-800 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPhoneNumbers}
                className="ml-4 border-red-700 text-red-300 hover:bg-red-800 bg-transparent"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* All Pathways Section */}
        {filteredPathways.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">All Pathways</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPathways.map((pathway) => (
                <PathwayCard
                  key={pathway.id}
                  pathway={pathway}
                  onCopy={handleCopy}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onMove={handleMove}
                  onEdit={handleManagePathway}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? "No pathways found" : "No Phone Numbers Found"}
              </h3>
              <p className="text-slate-400 text-center mb-8 max-w-md">
                {searchQuery
                  ? `No pathways match "${searchQuery}". Try a different search term.`
                  : "You need to purchase a phone number before creating a pathway. Each phone number gets its own call flow pathway."}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/phone-numbers/purchase">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Purchase a Number
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
