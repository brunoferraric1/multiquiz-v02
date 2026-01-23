'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Start',
    price: 'Gratis',
    description: 'Para testar a ideia e publicar o primeiro quiz.',
    features: ['1 funil ativo', 'Acesso ao editor visual', 'Leads ilimitados', 'Suporte por email'],
    cta: 'Comecar sem custo',
    variant: 'outline' as const,
  },
  {
    name: 'Growth',
    price: 'R$ 149',
    description: 'Para times em crescimento que precisam de dados e automacao.',
    features: ['5 funis ativos', 'Pontuacao de leads', 'Integracoes basicas', 'Relatorios em tempo real'],
    cta: 'Quero crescer',
    highlight: true,
  },
  {
    name: 'Scale',
    price: 'R$ 399',
    description: 'Para operacoes com alto volume e times comerciais dedicados.',
    features: ['Funis ilimitados', 'Segmentacao avancada', 'Integracoes premium', 'Suporte prioritario'],
    cta: 'Falar com vendas',
    variant: 'outline' as const,
  },
];

export const PricingAlt = () => {
  return (
    <section id="pricing" className="py-20 bg-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/60">Planos</p>
          <h2 className="mt-4 text-3xl font-semibold text-background sm:text-4xl">
            Escolha o plano que acompanha seu ritmo de crescimento.
          </h2>
          <p className="mt-4 text-background/70">
            Comece gratis e evolua conforme seu time precisa de mais automacoes e insights.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`rounded-[calc(var(--radius)+0.5rem)] border border-border bg-background/5 p-6 ${
                plan.highlight ? 'ring-1 ring-primary/40' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-background">{plan.name}</h3>
                {plan.highlight ? (
                  <span className="rounded-full border border-border bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                    Mais escolhido
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-3xl font-semibold text-background">{plan.price}</p>
              <p className="mt-2 text-sm text-background/70">{plan.description}</p>
              <ul className="mt-6 space-y-3 text-sm text-background/70">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button
                  asChild
                  size="lg"
                  variant={plan.variant}
                  className={`h-11 w-full text-base ${
                    plan.variant === 'outline'
                      ? 'bg-foreground text-background border-border hover:bg-background/5'
                      : ''
                  }`}
                >
                  <Link href="/dashboard">{plan.cta}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
