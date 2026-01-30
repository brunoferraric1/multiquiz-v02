'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const HighlightedText = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  return (
    <span className="relative inline-block">
      <motion.span
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 origin-left bg-[#fbbf24]"
        style={{
          top: '10%',
          bottom: '5%',
          left: '-8px',
          right: '-8px',
          borderRadius: '4px',
        }}
      />
      <span className="relative z-10 text-[#1a1f2e]">{children}</span>
    </span>
  );
};

export const HeroSection = () => {
  return (
    <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-20 overflow-hidden">
      {/* Yellow glow effect behind title */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.15) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="container mx-auto px-8 relative">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1f2e]/50 border border-[#3d4454]"
          >
            <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
            <span className="text-sm font-medium text-[#94a3b8]">Nova versão disponível</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-[1000px] text-5xl md:text-7xl font-extrabold text-[#f8fafc] font-serif leading-[1.1] tracking-tight"
          >
            <HighlightedText delay={0.1}>Crie Quizzes</HighlightedText>
            {' '}em Minutos.
            <br />
            Ganhe Leads. Venda Mais.
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-[700px] text-lg text-[#94a3b8] leading-relaxed"
          >
Do zero ao quiz publicado em 5 minutos. Sem código, sem designer.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex items-center gap-4 mt-2"
          >
            <Link
              href="/dashboard"
              className="px-8 py-3 rounded-full bg-[#fbbf24] text-[#1a1f2e] text-base font-bold hover:bg-[#fbbf24]/90 transition-colors"
            >
              Comece Grátis
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-3 rounded-full border border-[#3d4454] text-[#f8fafc] text-base hover:bg-[#3d4454]/20 transition-colors"
            >
              Ver como funciona
            </Link>
          </motion.div>

          {/* Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 w-full max-w-[1100px]"
          >
            <Image
              src="/landing/visual-builder.webp"
              alt="MultiQuiz Visual Builder"
              width={1100}
              height={667}
              className="w-full h-auto"
              priority
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
