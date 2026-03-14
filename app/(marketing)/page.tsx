import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { NicheCards } from "@/components/landing/NicheCards"
import { FeaturesGrid } from "@/components/landing/FeaturesGrid"
import { StatsCounter } from "@/components/landing/StatsCounter"
import { DemoSection } from "@/components/landing/DemoSection"
import { Testimonials } from "@/components/landing/Testimonials"
import { PricingCards } from "@/components/landing/PricingCards"
import { Footer } from "@/components/landing/Footer"
import { FadeIn } from "@/components/landing/FadeIn"

export default function MarketingHome() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FadeIn>
          <StatsCounter />
        </FadeIn>
        <FadeIn>
          <NicheCards />
        </FadeIn>
        <FadeIn>
          <FeaturesGrid />
        </FadeIn>
        <FadeIn>
          <Testimonials />
        </FadeIn>
        <FadeIn>
          <DemoSection />
        </FadeIn>
        <FadeIn>
          <PricingCards />
        </FadeIn>
      </main>
      <Footer />
    </>
  )
}
