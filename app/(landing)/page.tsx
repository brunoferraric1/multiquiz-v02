'use client';

import { LandingHeader } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </main>
  );
}