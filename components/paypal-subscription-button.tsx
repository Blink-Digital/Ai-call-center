"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface PayPalSubscriptionButtonProps {
  phoneNumber: string
  displayNumber: string
  price: string
  onSuccess: (subscriptionId: string) => void
  onCancel: () => void
  onError: (error: Error) => void
}

export default function PayPalSubscriptionButton({
  phoneNumber,
  displayNumber,
  price,
  onSuccess,
  onCancel,
  onError,
}: PayPalSubscriptionButtonProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isButtonRendered, setIsButtonRendered] = useState(false)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load the PayPal SDK
  useEffect(() => {
    // Only load the script if it's not already present
    const existingScript = document.getElementById("paypal-sdk")
    if (existingScript) {
      setIsScriptLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&vault=true&intent=subscription`
    script.id = "paypal-sdk"
    script.async = true

    script.onload = () => {
      console.log("PayPal SDK loaded successfully")
      setIsScriptLoaded(true)
    }

    script.onerror = (e) => {
      console.error("Error loading PayPal SDK:", e)
      setError("Failed to load PayPal. Please refresh and try again.")
      onError(new Error("Failed to load PayPal SDK"))
    }

    document.body.appendChild(script)

    // Cleanup function
    return () => {
      // We don't remove the script on unmount because other components might need it
      // But we do want to clean up any buttons
      const container = document.getElementById(`paypal-button-container-${phoneNumber}`)
      if (container) {
        container.innerHTML = ""
      }
    }
  }, [phoneNumber, onError])

  // Create plan and render button when SDK is loaded
  useEffect(() => {
    if (!isScriptLoaded || isButtonRendered || !window.paypal) return

    const createPlanAndRenderButton = async () => {
      try {
        setIsCreatingPlan(true)

        // Create a subscription plan
        const response = await fetch("/api/paypal/create-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber,
            displayNumber,
            price,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(errorData.error || `Failed to create plan: ${response.status}`)
        }

        const { planId } = await response.json()

        if (!planId) {
          throw new Error("No plan ID returned from server")
        }

        console.log("Plan created successfully:", planId)

        // Get the container element
        const container = document.getElementById(`paypal-button-container-${phoneNumber}`)
        if (!container) {
          throw new Error(`Container not found: paypal-button-container-${phoneNumber}`)
        }

        // Clear any existing content
        container.innerHTML = ""

        // Render the PayPal button
        window.paypal
          .Buttons({
            style: {
              shape: "rect",
              color: "blue",
              layout: "vertical",
              label: "subscribe",
            },
            createSubscription: (data: any, actions: any) => {
              console.log("Creating subscription with plan:", planId)
              return actions.subscription.create({
                plan_id: planId,
                custom_id: phoneNumber,
                application_context: {
                  shipping_preference: "NO_SHIPPING",
                  user_action: "SUBSCRIBE_NOW",
                  brand_name: "Bland.ai Phone Service",
                },
              })
            },
            onApprove: (data: any) => {
              console.log("Subscription approved:", data.subscriptionID)
              onSuccess(data.subscriptionID)
            },
            onError: (err: any) => {
              console.error("PayPal error:", err)
              setError("Payment failed. Please try again.")
              onError(new Error(err.message || "PayPal error"))
            },
            onCancel: () => {
              console.log("Payment cancelled")
              onCancel()
            },
          })
          .render(`paypal-button-container-${phoneNumber}`)

        setIsButtonRendered(true)
      } catch (err) {
        console.error("Error setting up PayPal:", err)
        setError(err instanceof Error ? err.message : "Failed to set up payment")
        onError(err instanceof Error ? err : new Error("Failed to set up payment"))
      } finally {
        setIsCreatingPlan(false)
      }
    }

    createPlanAndRenderButton()
  }, [isScriptLoaded, isButtonRendered, phoneNumber, displayNumber, price, onSuccess, onCancel, onError])

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div
        id={`paypal-button-container-${phoneNumber}`}
        className="w-full min-h-[150px] flex items-center justify-center"
      >
        {(isCreatingPlan || !isButtonRendered) && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
      </div>
    </div>
  )
}
