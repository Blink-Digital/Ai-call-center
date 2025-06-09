import { MessageSquare, Phone, Zap, BarChart2 } from "lucide-react"

export function FeatureCards() {
  const features = [
    {
      icon: Phone,
      title: "Voice AI Agents",
      description: "Deploy low latency voice agents in under 10 minutes for seamless inbound and outbound support.",
      badge: "CUSTOMERS",
      color: "from-blue-600 to-blue-400",
    },
    {
      icon: MessageSquare,
      title: "Chat AI Agents",
      description:
        "Deliver hyper-personalized interactions across channels with empathy, for a truly human-like support experience.",
      badge: "CUSTOMERS",
      color: "from-purple-600 to-purple-400",
    },
    {
      icon: Zap,
      title: "Agent Assistance",
      description: "Works alongside your agents to provide next best actions and automates repetitive workflows.",
      badge: "AGENTS",
      color: "from-pink-600 to-pink-400",
    },
    {
      icon: BarChart2,
      title: "Conversation Intelligence",
      description: "Quality checks interactions across all channels to provide invaluable customer insights.",
      badge: "LEADERS",
      color: "from-amber-600 to-amber-400",
    },
  ]

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold text-white">AI Solutions for Every Need</h2>
          <p className="mt-4 text-xl text-gray-300">
            Our platform offers a comprehensive suite of AI-powered tools to enhance your customer interactions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-2xl bg-gray-800 border border-gray-700 p-8 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-r from-gray-800 to-gray-700 blur-2xl opacity-50"></div>

              <div className="relative">
                <div className="inline-block px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-xs font-medium mb-4">
                  {feature.badge}
                </div>

                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>

                <div className="mt-6 flex items-center">
                  <a href="#" className="text-blue-400 hover:text-blue-300 font-medium flex items-center">
                    Learn more
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
