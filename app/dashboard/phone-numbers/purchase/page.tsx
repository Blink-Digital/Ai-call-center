"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Phone, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import PayPalSubscriptionButton from "@/components/paypal-subscription-button"

interface PhoneNumber {
  id: string
  number: string
  display: string
  location: string
  type: string
  monthlyFee: string
  status: string
}

export default function PurchaseNumberPage() {
  const router = useRouter()
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeNumber, setActiveNumber] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    fetchAvailableNumbers()
  }, [])

  const fetchAvailableNumbers = async () => {
    setLoading(true)
    setError("")
    setUsingMockData(false)
    setDebugInfo("Fetching available numbers...")

    try {
      const response = await fetch("/api/bland-ai/available-numbers")

      if (!response.ok) {
        const errorText = await response.text()
        setDebugInfo((prev) => prev + `\nAPI error: ${response.status} - ${errorText}`)
        throw new Error(`Failed to fetch available numbers: ${response.status}`)
      }

      let data
      try {
        data = await response.json()
        setDebugInfo((prev) => prev + `\nFetched ${data.numbers?.length || 0} numbers`)
      } catch (parseError) {
        setDebugInfo(
          (prev) =>
            prev + `\nJSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        )
        throw new Error("Invalid response format from server")
      }

      if (data.usingMockData) {
        setUsingMockData(true)
        setDebugInfo((prev) => prev + "\nUsing mock data")
      }

      // Handle different response formats
      let phoneNumbers: PhoneNumber[] = []

      if (data.numbers && Array.isArray(data.numbers)) {
        phoneNumbers = data.numbers
      } else if (Array.isArray(data)) {
        phoneNumbers = data
      }

      // Ensure each number has a unique ID that matches its phone number
      phoneNumbers = phoneNumbers.map((number) => ({
        ...number,
        id: number.number, // Use the phone number as the ID
      }))

      setDebugInfo((prev) => prev + `\nProcessed ${phoneNumbers.length} phone numbers`)

      // Filter for available numbers (case insensitive)
      const availableNumbers = phoneNumbers.filter((number) => {
        const status = (number.status || "").toLowerCase()
        return status === "available" || status === "active"
      })

      setDebugInfo((prev) => prev + `\nAfter filtering, ${availableNumbers.length} numbers are available`)
      setNumbers(availableNumbers)
    } catch (err) {
      console.error("Error fetching available numbers:", err)
      setDebugInfo((prev) => prev + `\nError: ${err instanceof Error ? err.message : String(err)}`)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseClick = (number: PhoneNumber) => {
    setDebugInfo(`Purchase clicked for: ${number.display}`)
    setActiveNumber(number.number)
  }

  const handlePayPalSuccess = async (number: PhoneNumber, subscriptionId: string) => {
    try {
      setDebugInfo((prev) => prev + `\nConfirming purchase for: ${number.display}`)

      const response = await fetch("/api/bland-ai/confirm-purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: number.number,
          subscriptionId: subscriptionId,
          country: "US",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Failed to confirm purchase: ${response.status}`)
      }

      const data = await response.json()
      setDebugInfo((prev) => prev + `\nPurchase confirmed: ${JSON.stringify(data)}`)

      toast({
        title: "Number Purchased Successfully",
        description: `You have successfully purchased ${number.display}. Auto-renewal is active.`,
        duration: 5000,
      })

      // Redirect to the phone numbers page
      router.push("/dashboard/phone-numbers")
    } catch (err) {
      console.error("Error confirming purchase:", err)
      setDebugInfo((prev) => prev + `\nError confirming purchase: ${err instanceof Error ? err.message : String(err)}`)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      toast({
        title: "Purchase Failed",
        description: err instanceof Error ? err.message : "Failed to purchase number",
        variant: "destructive",
        duration: 5000,
      })
      setActiveNumber(null)
    }
  }

  const handlePayPalCancel = () => {
    setDebugInfo((prev) => prev + "\nPayment cancelled")
    toast({
      title: "Purchase Cancelled",
      description: "You've cancelled the subscription process.",
    })
    setActiveNumber(null)
  }

  const handlePayPalError = (error: Error) => {
    setDebugInfo((prev) => prev + `\nPayPal error: ${error.message}`)
    toast({
      title: "Payment Failed",
      description: "There was an error processing your payment. Please try again.",
      variant: "destructive",
    })
    setActiveNumber(null)
  }

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/phone-numbers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Purchase New Number</h1>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAvailableNumbers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Debug information panel */}
      {debugInfo && (
        <Alert className="bg-gray-100 border-gray-300">
          <AlertTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Debug Information
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => setDebugInfo("")}>
              Clear
            </Button>
          </AlertTitle>
          <AlertDescription>
            <pre className="whitespace-pre-wrap text-xs mt-2 max-h-40 overflow-auto">{debugInfo}</pre>
          </AlertDescription>
        </Alert>
      )}

      {usingMockData && !error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Using Demo Data</AlertTitle>
          <AlertDescription>Unable to connect to the phone number API. Showing demo data instead.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{error}</span>
            <Button variant="outline" size="sm" className="w-fit" onClick={fetchAvailableNumbers}>
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading available numbers...</p>
        </div>
      ) : numbers.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Phone className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Numbers Available</h3>
          <p className="text-muted-foreground max-w-md mb-4">
            There are currently no phone numbers available for purchase. Please check back later.
          </p>
          <Button variant="outline" onClick={fetchAvailableNumbers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {numbers.map((number) => (
              <Card key={number.number} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        {number.display}
                      </CardTitle>
                      <CardDescription className="mt-1">{number.location}</CardDescription>
                    </div>
                    <Badge variant="outline">{number.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Fee</p>
                      <p className="text-lg font-medium">${number.monthlyFee}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Billing</p>
                      <p className="text-sm">Auto-renews monthly</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 pt-3 flex flex-col">
                  {activeNumber === null ? (
                    // Show purchase button when no number is active
                    <Button className="w-full" onClick={() => handlePurchaseClick(number)}>
                      Purchase with PayPal
                    </Button>
                  ) : activeNumber === number.number ? (
                    // Show PayPal button for the active number
                    <>
                      <PayPalSubscriptionButton
                        phoneNumber={number.number}
                        displayNumber={number.display}
                        price={number.monthlyFee.replace(/[^0-9.]/g, "")}
                        onSuccess={(subscriptionId) => handlePayPalSuccess(number, subscriptionId)}
                        onCancel={handlePayPalCancel}
                        onError={handlePayPalError}
                      />
                      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setActiveNumber(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    // Show disabled button for other numbers
                    <Button className="w-full" disabled>
                      Purchase with PayPal
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
