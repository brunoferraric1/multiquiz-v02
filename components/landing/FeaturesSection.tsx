'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { BrainCircuit, Settings, Users, Palette } from 'lucide-react';

const features = [
  {
    name: 'IA que Cria por Você',
    description: 'Descreva seu quiz e a IA gera perguntas, respostas e resultados. Você só ajusta o que precisar.',
    icon: <BrainCircuit size={28} className="text-primary" />,
  },
  {
    name: 'Controle Total',
    description: 'Edite textos, reordene perguntas, personalize resultados. A IA ajuda, mas o controle é seu.',
    icon: <Settings size={28} className="text-primary" />,
  },
  {
    name: 'Leads Qualificados',
    description: 'Capture nome, email e WhatsApp antes do resultado. Saiba exatamente quem é seu lead.',
    icon: <Users size={28} className="text-primary" />,
  },
  {
    name: 'Sua Marca, Seu Estilo',
    description: 'Cores, imagens e textos personalizáveis. Crie quizzes com a identidade do seu negócio.',
    icon: <Palette size={28} className="text-primary" />,
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
    <section id="features" className="py-20 bg-background sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-5xl">
            Por que quizzes convertem mais?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Interatividade gera engajamento. MultiQuiz transforma visitantes passivos em leads qualificados.
          </p>
        </div>
        <div className="mt-20">
          <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.name}
                custom={i}
                variants={cardVariants}
                className="flex flex-col text-center p-8 bg-card rounded-3xl border border-border/50 hover:border-primary/50 transition-colors duration-300"
              >
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mx-auto mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.name}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
