import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export function UseCases() {
  const useCases = [
    {
      title: "Customer Support",
      description:
        "Provide 24/7 support with AI agents that can handle common inquiries, troubleshoot issues, and escalate to human agents when needed.",
      benefits: [
        "Reduce wait times by 80%",
        "Handle multiple conversations simultaneously",
        "Consistent quality across all interactions",
        "Seamless handoff to human agents",
      ],
      image: "/placeholder.svg?key=bvk1j",
    },
    {
      title: "Sales & Lead Qualification",
      description:
        "Engage prospects instantly, qualify leads, and book meetings for your sales team, ensuring no opportunity is missed.",
      benefits: [
        "Instant response to all inquiries",
        "Intelligent lead scoring",
        "Automated appointment scheduling",
        "Personalized follow-ups",
      ],
      image: "/placeholder.svg?key=z57lq",
    },
    {
      title: "Outbound Campaigns",
      description:
        "Run personalized outreach campaigns at scale with AI agents that can have natural conversations and adapt to customer responses.",
      benefits: [
        "Scale outreach without increasing headcount",
        "Personalize every interaction",
        "Real-time campaign optimization",
        "Detailed analytics and insights",
      ],
      image: "/placeholder.svg?key=hn0u1",
    },
  ]

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold text-white">Transform Your Business with AI</h2>
          <p className="mt-4 text-xl text-gray-300">
            See how our AI-powered platform can revolutionize different aspects of your business.
          </p>
        </div>

        <div className="space-y-24">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-12 items-center`}
            >
              <div className="lg:w-1/2">
                <div className="rounded-2xl overflow-hidden border border-gray-700 shadow-xl">
                  <img src={useCase.image || "/placeholder.svg"} alt={useCase.title} className="w-full h-auto" />
                </div>
              </div>

              <div className="lg:w-1/2">
                <h3 className="text-2xl font-bold text-white mb-4">{useCase.title}</h3>
                <p className="text-gray-300 mb-6">{useCase.description}</p>

                <div className="space-y-3 mb-8">
                  {useCase.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                  Learn More
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
