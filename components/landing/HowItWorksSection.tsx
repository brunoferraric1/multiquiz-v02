'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { FilePlus, SlidersHorizontal, Rocket } from 'lucide-react';

const steps = [
  {
    num: '01',
    title: 'Crie seu quiz',
    description: 'Comece do zero ou escolha um template pronto. Adicione perguntas e configure os resultados de forma visual.',
    icon: <FilePlus className="w-7 h-7 text-[#fbbf24]" />,
  },
  {
    num: '02',
    title: 'Personalize tudo',
    description: 'Ajuste cores, fontes e imagens para combinar com sua marca. Adicione páginas de captura e VSL.',
    icon: <SlidersHorizontal className="w-7 h-7 text-[#fbbf24]" />,
  },
  {
    num: '03',
    title: 'Publique e capture',
    description: 'Compartilhe o link do seu quiz e capture leads. Acompanhe resultados em tempo real no dashboard.',
    icon: <Rocket className="w-7 h-7 text-[#fbbf24]" />,
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

export const HowItWorksSection = () => {
  const [ref, controls] = useScrollAnimation();

  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-bold text-[#f8fafc] font-serif">
            Como funciona
          </h2>
          <p className="text-lg text-[#94a3b8]">
            Transforme sua ideia em uma máquina de gerar leads em três passos simples.
          </p>
        </div>

        {/* Steps Grid */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          className="grid gap-8 md:grid-cols-3 max-w-[1100px] mx-auto"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              custom={i}
              variants={cardVariants}
              className="flex flex-col gap-6 p-8 bg-[#232936] rounded-3xl h-full"
            >
              {/* Number with line */}
              <div className="flex items-center gap-4">
                <span className="text-6xl font-bold text-[#fbbf24] font-serif">{step.num}</span>
                <div className="flex-1 h-0.5 bg-[#fbbf24]/25" />
              </div>

              {/* Icon */}
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#fbbf24]/10">
                {step.icon}
              </div>

              {/* Content */}
              <h3 className="text-[22px] font-bold text-[#f8fafc]">{step.title}</h3>
              <p className="text-base text-[#94a3b8] leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
