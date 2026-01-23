'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export const HeroAlt = () => {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-24">
      <div className="absolute inset-0">
        <div className="absolute -top-40 right-[-10%] h-80 w-80 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
        <div className="absolute top-24 left-[-15%] h-72 w-72 rounded-full bg-secondary/70 blur-3xl" aria-hidden="true" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" aria-hidden="true" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            >
              Conversas que viram leads
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Transforme cada clique em uma jornada que qualifica e aproxima sua venda.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-xl"
            >
              Crie quizzes com IA, adapte perguntas em tempo real e capture dados que contam a historia completa do seu lead. Tudo pronto para seu time agir rapido.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button asChild size="lg" className="h-12 px-7 text-base font-semibold">
                <Link href="/dashboard">Criar quiz agora</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-7 text-base">
                <Link href="#how-it-works">Ver exemplo guiado</Link>
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Publicacao em menos de 10 minutos
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Leads com contexto e prioridade
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Integracoes com CRM e WhatsApp
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Templates prontos por segmento
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="relative"
          >
            <div className="absolute -bottom-10 left-6 hidden lg:block rounded-[calc(var(--radius)+0.75rem)] border border-border bg-card/90 p-4 shadow-2xl">
              <p className="text-xs uppercase text-muted-foreground">Lead capturado</p>
              <p className="mt-2 text-sm text-foreground font-semibold">Camila Souza</p>
              <p className="text-xs text-muted-foreground">Interesse alto · Ecommerce</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Score 86/100</span>
              </div>
            </div>

            <div className="relative rounded-[calc(var(--radius)+1rem)] border border-border bg-card p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                  Quiz ao vivo
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Etapa 2 de 5</span>
              </div>

              <div className="mt-6 rounded-[var(--radius)] border border-border bg-background/70 p-4">
                <p className="text-xs uppercase text-muted-foreground">Pergunta atual</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  Qual obstaculo mais trava sua conversao hoje?
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    { label: 'Baixo volume de leads', value: '42%' },
                    { label: 'Leads sem fit', value: '31%' },
                    { label: 'Demora no follow-up', value: '27%' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-[var(--radius)] border border-border bg-muted/40 px-4 py-3"
                    >
                      <span className="text-sm text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius)] border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Perfil</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">PME · Varejo</p>
                  <p className="text-xs text-muted-foreground">Meta: +20% vendas</p>
                </div>
                <div className="rounded-[var(--radius)] border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Proxima acao</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">Enviar roteiro</p>
                  <p className="text-xs text-muted-foreground">WhatsApp em 1 clique</p>
                </div>
              </div>
            </div>

            <div className="absolute -top-8 right-8 hidden lg:block rounded-[calc(var(--radius)+0.5rem)] border border-border bg-background/90 px-4 py-3 text-xs text-muted-foreground shadow-xl">
              Taxa de conclusao <span className="text-foreground font-semibold">+38%</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
