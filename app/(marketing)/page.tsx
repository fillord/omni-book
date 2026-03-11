import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { NicheCards } from "@/components/landing/NicheCards"
import { FeaturesGrid } from "@/components/landing/FeaturesGrid"
import { DemoSection } from "@/components/landing/DemoSection"
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
          <NicheCards />
        </FadeIn>
        <FadeIn>
          <FeaturesGrid />
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
