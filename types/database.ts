export interface ClientNumber {
  id: string
  clientId: string
  phoneNumber: string
  purchasedAt: string
  location: string
  type: "Local" | "Toll-Free"
  status: "Active" | "Inactive"
  monthlyFee: number
  assignedTo: string | null
}

export interface Call {
  id: string
  to_number: string
  from_number: string
  start_time: string
  duration: number
  status: string
  pathway_id: string
  pathway_name: string
}

export interface CallAnalysis {
  transcript: string
  summary: string
  sentiment: string
  keywords: string[]
  intent: string
  duration: string
  callerId: string
  date: string
}
