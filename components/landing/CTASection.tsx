'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const CTASection = () => {
  const [ref, controls] = useScrollAnimation();

  return (
    <section className="bg-background py-20 sm:py-32">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={controls}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="container mx-auto px-4"
      >
        <div className="relative rounded-3xl bg-card border border-border py-16 text-center shadow-2xl overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 blur-[100px] rounded-full opacity-50 pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl max-w-2xl mx-auto">
              Pronto para transformar visitantes em leads?
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Crie seu primeiro quiz gratuitamente em menos de 5 minutos e comece a capturar dados hoje mesmo.
            </p>
            <div className="mt-10 flex justify-center">
              <Button asChild size="lg" className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 rounded-full px-8 py-3 text-lg h-14">
                <Link href="/dashboard">
                  Criar Meu Quiz Grátis
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Não requer cartão de crédito •ancele quando quiser
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
