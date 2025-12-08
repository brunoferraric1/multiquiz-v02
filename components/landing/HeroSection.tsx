'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export const HeroSection = () => {
  return (
    <section className="relative bg-background pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

      {/* Background Gradient Blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-30 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-muted-foreground mb-8 bg-background/50 backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2" />
            Nova versão disponível
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-7xl leading-[1.1]"
          >
            Crie Quizzes que Geram <br className="hidden sm:block" />
            <span className="text-primary">Leads em Minutos</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl leading-relaxed"
          >
            Use IA para criar quizzes interativos que capturam dados dos seus visitantes.
            Personalize tudo, mantenha o controle total e aumente sua conversão.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild size="lg" className="h-12 px-8 text-base font-bold rounded-full w-full sm:w-auto">
              <Link href="/dashboard">
                Comece Grátis
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base rounded-full w-full sm:w-auto">
              <Link href="#how-it-works">
                Ver como funciona
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mt-20 md:mt-28 relative z-10 container mx-auto px-4"
      >
        <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden aspect-video md:aspect-[16/9] max-w-5xl mx-auto ring-1 ring-border/50">
          <div className="absolute inset-0 bg-muted/30 flex items-center justify-center">
            <span className="text-muted-foreground font-medium flex items-center gap-2">
              Video Placeholder (Hero Loop)
            </span>
            {/* 
                TODO: Add video element here when files are ready
                <video 
                  src="/videos/hero-loop.mp4"
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-full object-cover"
                /> 
              */}
          </div>
        </div>

        {/* Glow effect under the video */}
        <div className="absolute -inset-4 bg-primary/20 blur-3xl -z-10 opacity-30 rounded-[3rem]" />
      </motion.div>
    </section>
  );
};

