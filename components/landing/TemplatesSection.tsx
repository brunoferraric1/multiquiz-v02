'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { Sparkles, Clock, Zap } from 'lucide-react';

const benefits = [
  {
    icon: <Clock size={20} className="text-[#fbbf24]" />,
    text: 'Crie quizzes completos em minutos',
  },
  {
    icon: <Sparkles size={20} className="text-[#fbbf24]" />,
    text: 'Templates prontos para diferentes nichos',
  },
  {
    icon: <Zap size={20} className="text-[#fbbf24]" />,
    text: 'Personalize com seus textos e imagens',
  },
];

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export const TemplatesSection = () => {
  const [ref, controls] = useScrollAnimation();

  return (
    <section className="py-24 bg-gradient-to-b from-transparent via-[#fbbf24]/5 to-transparent">
      <div className="container mx-auto px-8">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="flex flex-col gap-16 items-center md:flex-row max-w-[1200px] mx-auto"
        >
          {/* Image */}
          <div className="flex-1 w-full max-w-[650px]">
            <div className="relative overflow-hidden rounded-2xl bg-[#232936] border border-[#3d4454] shadow-2xl">
              <Image
                src="/landing/landing-templates.jpeg"
                alt="Templates de quiz prontos para usar"
                width={650}
                height={450}
                className="w-full h-auto object-cover"
                quality={90}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col gap-6">
            <span className="inline-flex self-start px-3 py-1.5 rounded-lg bg-[#fbbf24]/10 text-[11px] font-bold text-[#fbbf24] tracking-wider">
              TEMPLATES
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#f8fafc] font-serif leading-tight">
              Comece em Segundos com Templates Prontos
            </h2>
            <p className="text-base text-[#94a3b8] leading-relaxed max-w-[420px]">
              Escolha entre diferentes tipos de etapas: páginas em branco, perguntas, promoções,
              captura de dados e mais. Monte seu funil de quiz arrastando e soltando blocos.
            </p>

            {/* Benefits list */}
            <ul className="flex flex-col gap-3 mt-2">
              {benefits.map((benefit) => (
                <li key={benefit.text} className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#fbbf24]/10">
                    {benefit.icon}
                  </div>
                  <span className="text-sm text-[#cbd5e1]">{benefit.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
