'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Grátis',
    price: 'R$0',
    frequency: '/mês',
    description: 'Para começar a explorar e criar seus primeiros quizzes.',
    features: [
      '1 Usuário',
      'Até 3 quizzes ativos',
      'Captura de leads básica',
      'Suporte da comunidade',
    ],
    cta: 'Começar Agora',
    href: '/dashboard',
    featured: false,
  },
  {
    name: 'Pro',
    price: 'R$49',
    frequency: '/mês',
    description: 'Para infoprodutores e empresas que querem escalar.',
    features: [
      'Até 5 usuários',
      'Quizzes ilimitados',
      'Analytics avançado',
      'Personalização de marca (White-label)',
      'Suporte prioritário por email',
    ],
    cta: 'Começar Teste Grátis',
    href: '/dashboard',
    featured: true,
  },
  {
    name: 'Empresas',
    price: 'Custom',
    frequency: '',
    description: 'Para grandes times com necessidades específicas.',
    features: [
      'Usuários ilimitados',
      'Gerente de contas dedicado',
      'Integrações personalizadas',
      'Treinamento para o time',
      'SLA garantido',
    ],
    cta: 'Falar com Vendas',
    href: '#',
    featured: false,
  },
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
  const [ref, controls] = useScrollAnimation();
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
            Escolha o plano ideal para o seu momento. Comece grátis, evolua quando precisar.
          </p>
        </div>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          className="mt-16 grid max-w-md gap-8 mx-auto lg:max-w-none lg:grid-cols-3"
        >
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              custom={i}
              variants={cardVariants}
              className={`flex flex-col rounded-3xl overflow-hidden ${tier.featured ? 'border-2 border-primary shadow-xl scale-105 z-10' : 'border border-border bg-card/50'}`}
            >
              <div className="px-6 py-8 bg-card sm:p-10 sm:pb-6">
                <div>
                  <h3 className={`inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase ${tier.featured ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {tier.name}
                  </h3>
                </div>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold text-foreground">
                  {tier.price}
                  <span className="ml-1 text-xl font-medium text-muted-foreground">
                    {tier.frequency}
                  </span>
                </div>
                <p className="mt-5 text-base text-muted-foreground">{tier.description}</p>
              </div>
              <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-card/30 space-y-6 sm:p-10 sm:pt-6">
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                      <p className="ml-3 text-sm text-foreground">{feature}</p>
                    </li>
                  ))}
                </ul>
                <div className="rounded-md shadow">
                  <Button
                    asChild
                    size="lg"
                    className={`w-full font-bold h-12 rounded-xl ${tier.featured ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                  >
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
