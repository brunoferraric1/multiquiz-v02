'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export const CTASection = () => {
  return (
    <section className="py-20 sm:py-32 px-4">
      <div className="container mx-auto flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[1200px] rounded-3xl bg-[#232936] border border-[#3d4454] shadow-[0_25px_50px_0_rgba(0,0,0,0.25)] overflow-hidden"
        >
          {/* Glow Effect */}
          <div
            className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0) 70%)',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6 py-16 px-8 text-center">
            <h2 className="max-w-[700px] text-4xl md:text-5xl font-extrabold text-[#f8fafc]">
              Pronto para transformar visitantes em leads?
            </h2>
            <p className="max-w-[700px] text-lg text-[#94a3b8] leading-relaxed">
              Crie seu primeiro quiz gratuitamente em menos de 5 minutos e comece a capturar dados hoje
              mesmo.
            </p>
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-full bg-[#fbbf24] text-lg font-bold text-[#1a1f2e] hover:bg-[#fbbf24]/90 transition-colors"
            >
              Criar Meu Quiz Grátis
            </Link>
            <p className="text-sm text-[#94a3b8]">
              Não requer cartão de crédito • Cancele quando quiser
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
