import { HeroSection } from "@/components/hero-section"
import { FeatureCards } from "@/components/feature-cards"
import { UseCases } from "@/components/use-cases"
import { Testimonials } from "@/components/testimonials"
import { StatsSection } from "@/components/stats-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Feature Cards Section */}
      <FeatureCards />

      {/* Stats Section */}
      <StatsSection />

      {/* Use Cases Section */}
      <UseCases />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  )
}
