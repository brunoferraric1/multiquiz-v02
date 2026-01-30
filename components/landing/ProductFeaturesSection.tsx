'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';

const productFeatures = [
  {
    badge: 'FUNIL COMPLETO',
    title: 'Funil de Quiz Totalmente Personalizável',
    description: 'Crie quizzes completos com perguntas, resultados e páginas de captura. Controle total sobre cada etapa do funil, desde a primeira pergunta até a conversão final.',
    placeholder: 'Screenshot: Visual Builder',
    reverse: false,
  },
  {
    badge: 'CONVERSÃO',
    title: 'Página VSL Integrada ao Quiz',
    description: 'Monte sua página de vendas diretamente no fluxo do quiz. Apresente vídeos, ofertas e chamadas para ação no momento certo para maximizar conversões.',
    placeholder: 'Screenshot: Página VSL',
    reverse: true,
  },
  {
    badge: 'GESTÃO',
    title: 'Gestão de Leads Completa',
    description: 'Visualize, filtre e exporte todos os dados coletados. Baixe planilhas detalhadas e analise o comportamento de cada lead capturado.',
    placeholder: 'Screenshot: Dashboard de Leads',
    reverse: false,
  },
  {
    badge: 'INTEGRAÇÃO',
    title: 'Sincronização com CRM MultiMeta',
    description: 'Seus leads são enviados automaticamente para o MultiMeta CRM. Automação completa do funil de vendas sem precisar exportar manualmente.',
    placeholder: 'Screenshot: Integração CRM',
    reverse: true,
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export const ProductFeaturesSection = () => {
  const [ref, controls] = useScrollAnimation();

  return (
    <section className="py-24">
      <div className="container mx-auto px-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#f8fafc] font-serif">
            Tudo que você precisa para converter
          </h2>
          <p className="text-lg text-[#94a3b8]">
            Recursos poderosos para criar funis de quiz que geram resultados reais.
          </p>
        </div>

        {/* Features */}
        <div ref={ref} className="flex flex-col gap-24 max-w-[1200px] mx-auto">
          {productFeatures.map((feature, index) => (
            <motion.div
              key={feature.badge}
              initial="hidden"
              animate={controls}
              variants={itemVariants}
              custom={index}
              className={`flex flex-col gap-16 items-center ${
                feature.reverse ? 'md:flex-row-reverse' : 'md:flex-row'
              }`}
            >
              {/* Content */}
              <div className="flex-1 flex flex-col gap-6">
                <span className="inline-flex self-start px-3 py-1.5 rounded-lg bg-[#fbbf24]/10 text-[11px] font-bold text-[#fbbf24] tracking-wider">
                  {feature.badge}
                </span>
                <h3 className="text-3xl font-bold text-[#f8fafc] font-serif leading-tight">
                  {feature.title}
                </h3>
                <p className="text-base text-[#94a3b8] leading-relaxed max-w-[420px]">
                  {feature.description}
                </p>
              </div>

              {/* Visual Placeholder */}
              <div className="flex-1 w-full max-w-[650px]">
                <div className="flex items-center justify-center h-[400px] rounded-2xl bg-[#232936] border border-[#3d4454]">
                  <span className="text-sm text-[#94a3b8]">{feature.placeholder}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
