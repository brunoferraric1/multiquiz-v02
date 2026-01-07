'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';

const FREE_FEATURES = [
  { text: '1 quiz publicado', included: true },
  { text: 'Rascunhos ilimitados', included: true },
  { text: '20 mensagens IA por mês', included: true },
  { text: 'Captura de leads', included: true },
  { text: 'Relatórios de análise completos', included: false },
  { text: 'Relatório de Leads + download', included: false },
  { text: 'Personalização de logo e cores', included: false },
];

const PRO_FEATURES = [
  { text: 'Quizzes ilimitados', included: true },
  { text: 'Rascunhos ilimitados', included: true },
  { text: 'Assistente IA ilimitado', included: true },
  { text: 'Captura de leads', included: true },
  { text: 'Relatórios de análise completos', included: true },
  { text: 'Relatório de Leads + download', included: true },
  { text: 'Personalização de logo e cores', included: true },
];

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

export const PricingSection = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [ref, controls] = useScrollAnimation();
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const proPrice = isYearly ? 'R$39' : 'R$49';
  const proFrequency = isYearly ? '/mês (cobrado anualmente)' : '/mês';
  const yearlyTotal = isYearly ? 'R$468/ano' : null;

  const handleProClick = () => {
    const period = isYearly ? 'yearly' : 'monthly';

    if (!user) {
      // Redirect to login with upgrade intent
      const redirectUrl = encodeURIComponent(`/pricing?period=${period}`);
      router.push(`/login?redirect=${redirectUrl}&upgrade=true&period=${period}`);
      return;
    }

    setIsLoading(true);
    router.push(`/pricing?period=${period}`);
  };

  return (
    <section id="pricing" className="py-20 bg-background sm:py-32 relative">
      {/* Background Blob */}
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-5xl">
            Planos Simples e Transparentes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Comece grátis, evolua quando precisar. Sem surpresas.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Mensal
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isYearly ? 'bg-primary' : 'bg-muted'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isYearly ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Anual
              <span className="ml-1.5 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Economize 20%
              </span>
            </span>
          </div>
        </div>

        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          className="mt-12 grid max-w-lg gap-8 mx-auto md:max-w-4xl md:grid-cols-2"
        >
          {/* Free Tier */}
          <motion.div
            custom={0}
            variants={cardVariants}
            className="flex flex-col rounded-3xl overflow-hidden border border-border bg-card/50"
          >
            <div className="px-6 py-8 bg-card sm:p-10 sm:pb-6">
              <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-muted text-muted-foreground">
                Grátis
              </h3>
              <div className="mt-4 flex items-baseline text-5xl font-extrabold text-foreground">
                R$0
                <span className="ml-1 text-xl font-medium text-muted-foreground">
                  /mês
                </span>
              </div>
              <p className="mt-5 text-base text-muted-foreground">
                Perfeito para começar e testar a plataforma.
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-card/30 space-y-6 sm:p-10 sm:pt-6">
              <ul className="space-y-4">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature.text} className="flex items-start">
                    <div className="flex-shrink-0">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-primary" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                    <p className={`ml-3 text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground/70'}`}>
                      {feature.text}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="rounded-md shadow">
                <Button
                  asChild
                  size="lg"
                  className="w-full font-bold h-12 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  <Link href="/dashboard">Começar Grátis</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            custom={1}
            variants={cardVariants}
            className="flex flex-col rounded-3xl overflow-hidden border-2 border-primary shadow-xl relative"
          >
            {/* Popular Badge */}
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-xl">
              MAIS POPULAR
            </div>

            <div className="px-6 py-8 bg-card sm:p-10 sm:pb-6">
              <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-primary/20 text-primary">
                Pro
              </h3>
              <div className="mt-4 flex items-baseline text-5xl font-extrabold text-foreground">
                {proPrice}
                <span className="ml-1 text-xl font-medium text-muted-foreground">
                  {proFrequency}
                </span>
              </div>
              {yearlyTotal && (
                <p className="mt-1 text-sm text-muted-foreground">{yearlyTotal}</p>
              )}
              <p className="mt-5 text-base text-muted-foreground">
                Para quem quer escalar e ter acesso total.
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-card/30 space-y-6 sm:p-10 sm:pt-6">
              <ul className="space-y-4">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature.text} className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <p className="ml-3 text-sm text-foreground">{feature.text}</p>
                  </li>
                ))}
              </ul>
              <div className="rounded-md shadow">
                <Button
                  onClick={handleProClick}
                  disabled={isLoading}
                  size="lg"
                  className="w-full font-bold h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    'Começar Agora'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Trust Indicators */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Cancele a qualquer momento • Sem compromisso • Pagamento seguro via Stripe
        </p>
      </div>
    </section>
  );
};
