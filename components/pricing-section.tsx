import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "$99",
      description: "Perfect for small businesses just getting started with AI calls",
      features: [
        "100 minutes per month",
        "Basic analytics",
        "Standard voice options",
        "Email support",
        "1 user account",
      ],
      cta: "Get started",
      popular: false,
    },
    {
      name: "Professional",
      price: "$299",
      description: "Ideal for growing businesses with moderate call volumes",
      features: [
        "500 minutes per month",
        "Advanced analytics",
        "Premium voice options",
        "Priority support",
        "5 user accounts",
        "Custom call flows",
      ],
      cta: "Start free trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For organizations with high-volume calling needs",
      features: [
        "Unlimited minutes",
        "Enterprise analytics",
        "All voice options",
        "Dedicated support",
        "Unlimited users",
        "Custom integrations",
        "SLA guarantees",
      ],
      cta: "Contact sales",
      popular: false,
    },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
          <p className="mt-4 text-lg text-gray-600">Choose the plan that's right for your business</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-lg overflow-hidden border ${
                plan.popular ? "border-black shadow-lg" : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="bg-black text-white text-center py-1 text-sm font-medium">Most Popular</div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="ml-1 text-gray-500">/month</span>}
                </div>
                <p className="mt-4 text-gray-600">{plan.description}</p>

                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-gray-600">{feature}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Button
                    className={`w-full ${plan.popular ? "bg-black hover:bg-gray-800" : "bg-gray-800 hover:bg-black"}`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
