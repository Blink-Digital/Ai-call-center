export function StatsSection() {
  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "85%", label: "Cost Reduction" },
    { value: "24/7", label: "Support" },
    { value: "10M+", label: "Conversations" },
  ]

  return (
    <section className="py-16 bg-gradient-to-r from-gray-800 to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="mt-2 text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
