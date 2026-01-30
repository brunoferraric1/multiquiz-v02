'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { LandingHeader } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ProductFeaturesSection } from '@/components/landing/ProductFeaturesSection';
import { TemplatesSection } from '@/components/landing/TemplatesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/Footer';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    // Show spinner while checking auth or redirecting
    // We also show it if 'user' is present because the useEffect will trigger a redirect immediately
    return (
      <div className="flex h-screen items-center justify-center bg-[#1a1f2e]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fbbf24] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f2e] min-h-screen relative">
      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30" aria-hidden="true" />

      <div className="relative">
        <LandingHeader />
        <HeroSection />
        <FeaturesSection />
        <ProductFeaturesSection />
        <TemplatesSection />
        <HowItWorksSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
        <LandingFooter />
      </div>
    </div>
  );
}
