'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const steps = [
  {
    title: 'Defina seu objetivo',
    description: 'Escolha o tipo de lead, o canal e a acao final que voce deseja.',
  },
  {
    title: 'Construa com IA',
    description: 'A IA sugere perguntas, telas e textos. Ajuste cada detalhe no editor visual.',
  },
  {
    title: 'Ative e acompanhe',
    description: 'Publique o quiz, acompanhe a conversao e veja os dados no painel em tempo real.',
  },
];

export const HowItWorksAlt = () => {
  return (
    <section id="how-it-works" className="py-20 bg-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/60">Como funciona</p>
            <h2 className="mt-4 text-3xl font-semibold text-background sm:text-4xl">
              Do primeiro clique ao lead pronto para vender.
            </h2>
            <p className="mt-4 text-background/70">
              Uma sequencia simples para criar funis interativos que convertem, com dados acionaveis.
            </p>
            <div className="mt-8 space-y-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex gap-4 rounded-[var(--radius)] border border-border bg-background/5 p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-foreground text-sm font-semibold text-background">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-background">{step.title}</h3>
                    <p className="mt-1 text-sm text-background/70">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-8">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-7 text-base bg-foreground text-background border-border hover:bg-background/5"
              >
                <Link href="/dashboard">Testar agora</Link>
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[calc(var(--radius)+0.75rem)] border border-border bg-background/5 p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[var(--radius)] border border-border bg-foreground p-4">
                <p className="text-xs uppercase text-background/60">Dashboard</p>
                <p className="mt-2 text-sm font-semibold text-background">Conversao por etapa</p>
                <div className="mt-3 space-y-2">
                  {['Inicio', 'Qualificacao', 'Oferta', 'Captura'].map((label, index) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-xs text-background/60">{label}</span>
                      <span className="ml-auto text-xs text-background">
                        {90 - index * 14}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[var(--radius)] border border-border bg-foreground p-4">
                <p className="text-xs uppercase text-background/60">Leads quentes</p>
                <div className="mt-3 space-y-3">
                  {['Fit alto', 'Follow-up hoje', 'Novo formulario'].map((label) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-[var(--radius)] border border-border bg-background/5 px-3 py-2 text-xs text-background"
                    >
                      {label}
                      <span className="text-background/60">12</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-[var(--radius)] border border-border bg-foreground p-4">
              <p className="text-xs uppercase text-background/60">Automacao</p>
              <p className="mt-2 text-sm text-background">
                Leads com score alto recebem convite para demo automaticamente.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Email', 'WhatsApp', 'CRM', 'Slack'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-background/5 px-3 py-1 text-xs text-background/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
