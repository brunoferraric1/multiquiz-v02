'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';

const FREE_FEATURES = [
  '1 quiz publicado',
  '10 leads coletados',
  'Rascunhos ilimitados',
];

const PLUS_FEATURES = [
  '3 quizzes publicados',
  '3.000 leads/mês',
  'Criação com IA',
  'Gestão e download de leads',
  'Integração com CRM',
];

const PRO_FEATURES = [
  '10 quizzes publicados',
  '10.000 leads/mês',
  'Tudo do Plus incluído',
  'Suporte prioritário',
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
  const [loadingTier, setLoadingTier] = useState<'free' | 'plus' | 'pro' | null>(null);

  const handleFreeClick = () => {
    setLoadingTier('free');
    router.push('/dashboard');
  };

  const handlePaidClick = (tier: 'plus' | 'pro') => {
    if (!user) {
      const redirectUrl = encodeURIComponent(`/pricing?tier=${tier}`);
      router.push(`/login?redirect=${redirectUrl}&upgrade=true&tier=${tier}`);
      return;
    }

    setLoadingTier(tier);
    router.push(`/pricing?tier=${tier}`);
  };

  return (
    <section id="pricing" className="py-20 sm:py-32">
      <div className="container mx-auto px-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#f8fafc] font-serif">
            Planos Simples e Transparentes
          </h2>
          <p className="text-lg text-[#94a3b8]">
            Comece grátis, evolua quando precisar. Sem surpresas.
          </p>
        </div>

        {/* Pricing Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="flex flex-col lg:flex-row items-center justify-center gap-6 max-w-[1100px] mx-auto"
        >
          {/* Free Tier */}
          <motion.div
            custom={0}
            variants={cardVariants}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={handleFreeClick}
            className="w-full max-w-[340px] flex flex-col gap-6 p-8 bg-white rounded-3xl border border-[#E8DDD8] cursor-pointer"
          >
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-semibold text-[#2D2522] font-serif">Grátis</h3>
              <p className="text-[15px] text-[#6B5E5E]">Para testar a plataforma</p>
            </div>

            <div className="flex items-end gap-1">
              <span className="text-[40px] font-semibold text-[#2D2522] font-serif">R$ 0</span>
              <span className="text-base text-[#6B5E5E] mb-1">/mês</span>
            </div>

            <div className="flex flex-col gap-3">
              {FREE_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2.5">
                  <Check className="w-[18px] h-[18px] text-[#009120]" />
                  <span className="text-[15px] text-[#6B5E5E]">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center h-[52px] rounded-full bg-[#FAF6F3] border border-[#E8DDD8] text-[15px] font-semibold text-[#2D2522]">
              {loadingTier === 'free' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Começar Grátis'
              )}
            </div>
          </motion.div>

          {/* Plus Tier - Featured */}
          <motion.div
            custom={1}
            variants={cardVariants}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => handlePaidClick('plus')}
            className="w-full max-w-[360px] flex flex-col gap-6 p-8 bg-white rounded-3xl shadow-[0_20px_60px_0_rgba(45,37,34,0.19)] cursor-pointer"
          >
            <span className="self-start px-3 py-1.5 rounded-xl bg-[#1a1f2e] text-[11px] font-semibold text-white tracking-wide">
              MAIS POPULAR
            </span>

            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-semibold text-[#1a1f2e] font-serif">Plus</h3>
              <p className="text-[15px] text-[#5e5e5e]">Para profissionais e pequenas empresas</p>
            </div>

            <div className="flex items-end gap-1">
              <span className="text-[40px] font-semibold text-[#1a1f2e] font-serif">R$ 89,90</span>
              <span className="text-base text-[#5e5e5e] mb-1">/mês</span>
            </div>

            <div className="flex flex-col gap-3">
              {PLUS_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2.5">
                  <Check className="w-[18px] h-[18px] text-[#009120]" />
                  <span className="text-[15px] text-[#333333]">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center h-[52px] rounded-full bg-[#fbbf24] text-[15px] font-semibold text-[#1a1f2e] shadow-[0_8px_20px_0_rgba(251,191,36,0.25)]">
              {loadingTier === 'plus' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Assinar Plus'
              )}
            </div>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            custom={2}
            variants={cardVariants}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => handlePaidClick('pro')}
            className="w-full max-w-[340px] flex flex-col gap-6 p-8 bg-white rounded-3xl border border-[#E8DDD8] cursor-pointer"
          >
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-semibold text-[#2D2522] font-serif">Pro</h3>
              <p className="text-[15px] text-[#6B5E5E]">Para operações maiores</p>
            </div>

            <div className="flex items-end gap-1">
              <span className="text-[40px] font-semibold text-[#2D2522] font-serif">R$ 129,90</span>
              <span className="text-base text-[#6B5E5E] mb-1">/mês</span>
            </div>

            <div className="flex flex-col gap-3">
              {PRO_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2.5">
                  <Check className="w-[18px] h-[18px] text-[#009120]" />
                  <span className="text-[15px] text-[#6B5E5E]">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center h-[52px] rounded-full bg-[#FAF6F3] border border-[#E8DDD8] text-[15px] font-semibold text-[#2D2522]">
              {loadingTier === 'pro' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Assinar Pro'
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Trust Indicators */}
        <p className="mt-12 text-center text-sm text-[#94a3b8]">
          Cancele a qualquer momento • Sem compromisso • Pagamento seguro via Stripe
        </p>
      </div>
    </section>
  );
};
