'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { HeaderCentered } from '@/components/landing-v2/HeaderCentered';
import { FooterAlt } from '@/components/landing-v2/FooterAlt';
import { BuilderShowcase } from '@/components/landing-v2/BuilderShowcase';
import { StatsBand } from '@/components/landing-v2/StatsBand';
import { FeatureMosaic } from '@/components/landing-v2/FeatureMosaic';
import { HowItWorksAlt } from '@/components/landing-v2/HowItWorksAlt';
import { AudienceAlt } from '@/components/landing-v2/AudienceAlt';
import { PricingAlt } from '@/components/landing-v2/PricingAlt';
import { FAQAlt } from '@/components/landing-v2/FAQAlt';
import { CTAAlt } from '@/components/landing-v2/CTAAlt';

export default function LandingPageV2() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-foreground min-h-screen text-background">
      <HeaderCentered />
      <main>
        <BuilderShowcase />
        <StatsBand />
        <FeatureMosaic />
        <HowItWorksAlt />
        <AudienceAlt />
        <PricingAlt />
        <FAQAlt />
        <CTAAlt />
      </main>
      <FooterAlt />
    </div>
  );
}
