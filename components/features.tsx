import { Phone, MessageSquare, Zap, Shield, BarChart3, Code } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: Phone,
      title: "Ultra-realistic voice AI",
      description:
        "Our AI voices are indistinguishable from humans, with natural pauses, fillers, and conversational flow.",
    },
    {
      icon: MessageSquare,
      title: "Dynamic conversations",
      description: "Handle complex dialogues with context awareness and real-time adaptation to customer responses.",
    },
    {
      icon: Zap,
      title: "Lightning-fast setup",
      description:
        "Get started in minutes with our intuitive flow builder and pre-built templates for common use cases.",
    },
    {
      icon: Shield,
      title: "Enterprise-grade security",
      description: "SOC 2 compliant with end-to-end encryption and robust data protection measures.",
    },
    {
      icon: BarChart3,
      title: "Comprehensive analytics",
      description: "Track call performance, conversion rates, and customer sentiment with detailed reporting.",
    },
    {
      icon: Code,
      title: "Powerful API",
      description: "Seamlessly integrate with your existing systems through our developer-friendly API.",
    },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Why businesses choose Bland.ai</h2>
          <p className="mt-4 text-lg text-gray-600">
            Our platform combines cutting-edge AI with practical business solutions to transform how you communicate
            with customers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
