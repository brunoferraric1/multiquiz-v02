'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export const CTAAlt = () => {
  return (
    <section className="py-20 bg-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[calc(var(--radius)+0.75rem)] border border-border bg-background/5 p-10"
        >
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--color-primary),_transparent_60%)] opacity-20"
            aria-hidden="true"
          />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/60">Pronto para testar?</p>
              <h2 className="mt-4 text-3xl font-semibold text-background sm:text-4xl">
                Crie seu primeiro quiz agora e veja os leads chegando com contexto.
              </h2>
              <p className="mt-4 text-background/70">
                Seu time recebe informacoes claras para agir rapido e fechar mais.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Button asChild size="lg" className="h-12 text-base font-semibold">
                <Link href="/dashboard">Comecar gratuitamente</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 text-base bg-foreground text-background border-border hover:bg-background/5"
              >
                <Link href="#features">Ver recursos</Link>
              </Button>
              <p className="text-xs text-background/60">Sem cartao de credito. Cancele quando quiser.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
