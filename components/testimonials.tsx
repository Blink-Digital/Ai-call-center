export function Testimonials() {
  const testimonials = [
    {
      quote:
        "Blink.AI has transformed our customer service operations. We've reduced response times by 60% while maintaining high customer satisfaction scores.",
      author: "Sarah Johnson",
      role: "Customer Success Director",
      company: "TechCorp Inc.",
      image: "/placeholder.svg?height=48&width=48&text=SJ",
    },
    {
      quote:
        "The voice quality is incredible. Our customers can't tell they're speaking with an AI, which has allowed us to scale our outreach efforts without sacrificing the personal touch.",
      author: "Michael Chen",
      role: "Head of Sales",
      company: "GrowthMetrics",
      image: "/placeholder.svg?height=48&width=48&text=MC",
    },
    {
      quote:
        "Implementation was seamless. We were up and running in days, not weeks, and the ROI was evident within the first month.",
      author: "Priya Patel",
      role: "Operations Manager",
      company: "Velocity Services",
      image: "/placeholder.svg?height=48&width=48&text=PP",
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold text-white">What Our Customers Say</h2>
          <p className="mt-4 text-xl text-gray-300">
            Businesses of all sizes are achieving remarkable results with Blink.AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              <div className="flex-1">
                <svg className="h-8 w-8 text-blue-400 mb-4" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <p className="text-gray-300 italic mb-6">"{testimonial.quote}"</p>

                <div className="flex items-center">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.author}
                    className="h-12 w-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <p className="font-medium text-white">{testimonial.author}</p>
                    <p className="text-sm text-gray-400">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
