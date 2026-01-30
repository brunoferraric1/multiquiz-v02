'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { Settings, Users, Palette } from 'lucide-react';

const features = [
  {
    name: 'Controle Total',
    description: 'Edite textos, reordene perguntas, personalize resultados. O controle é todo seu.',
    icon: <Settings size={28} className="text-[#fbbf24]" />,
  },
  {
    name: 'Leads Qualificados',
    description: 'Capture nome, email e WhatsApp antes do resultado. Saiba exatamente quem é seu lead.',
    icon: <Users size={28} className="text-[#fbbf24]" />,
  },
  {
    name: 'Sua Marca, Seu Estilo',
    description: 'Cores, imagens e textos personalizáveis. Crie quizzes com a identidade do seu negócio.',
    icon: <Palette size={28} className="text-[#fbbf24]" />,
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

export const FeaturesSection = () => {
  const [ref, controls] = useScrollAnimation();

  return (
    <section id="features" className="py-20 sm:py-32">
      <div className="container mx-auto px-8">
        {/* Features Header */}
        <div className="flex flex-col items-center gap-4 text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#f8fafc] font-serif">
            Por que quizzes convertem mais?
          </h2>
          <p className="max-w-[700px] text-lg text-[#94a3b8] leading-relaxed">
            Interatividade gera engajamento. MultiQuiz transforma visitantes passivos em leads qualificados.
          </p>
        </div>

        {/* Features Grid */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          className="grid gap-8 md:grid-cols-3 max-w-[1000px] mx-auto"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.name}
              custom={i}
              variants={cardVariants}
              className="flex flex-col items-center text-center p-8 bg-[#232936]/50 rounded-3xl border border-[#3d4454]/50 hover:border-[#fbbf24]/30 transition-colors duration-300"
            >
              <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-[#fbbf24]/10 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[#f8fafc] mb-3">{feature.name}</h3>
              <p className="text-base text-[#94a3b8] leading-relaxed max-w-[220px]">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
