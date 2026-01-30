'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Preciso saber programar ou ter conhecimentos técnicos?',
    answer: 'Não! O MultiQuiz foi feito para ser 100% visual. Você conversa com a IA para criar e usa nosso editor visual para ajustes finais. Nenhuma linha de código é necessária.',
  },
  {
    question: 'Como funciona a captura de leads?',
    answer: 'Você pode adicionar um formulário de captura antes de mostrar o resultado do quiz. É possível coletar Nome, Email e WhatsApp, e esses dados ficam disponíveis no seu painel.',
  },
  {
    question: 'Posso personalizar o design do meu quiz?',
    answer: 'Sim! Você pode personalizar as cores, imagens de capa, adicionar imagens nas perguntas e nos resultados para deixar o quiz com a identidade visual da sua marca.',
  },
  {
    question: 'Os quizzes funcionam bem no celular?',
    answer: 'Com certeza. Todos os quizzes criados no MultiQuiz são responsivos e otimizados para funcionar perfeitamente em celulares, tablets e computadores.',
  },
  {
    question: 'Onde ficam salvos os dados dos leads?',
    answer: 'Todos os dados capturados ficam armazenados de forma segura no seu painel do MultiQuiz. Futuramente teremos integrações diretas com CRMs e ferramentas de email marketing.',
  },
];

const AccordionItem = ({ faq }: { faq: (typeof faqs)[0] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#3d4454] py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-4 text-lg font-medium text-left text-[#f8fafc] hover:text-[#fbbf24] transition-colors focus:outline-none"
      >
        <span>{faq.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 ml-4"
        >
          <ChevronDown className="h-5 w-5 text-[#94a3b8]" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-base text-[#94a3b8] leading-relaxed">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const itemsVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.2 },
  },
};

export const FAQSection = () => {
  const [ref, controls] = useScrollAnimation();

  return (
    <section id="faq" className="py-20 sm:py-32">
      <div ref={ref} className="container mx-auto px-8">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#f8fafc]">Perguntas Frequentes</h2>
          <p className="mt-4 text-lg text-[#94a3b8]">
            Tire suas dúvidas sobre como o MultiQuiz pode ajudar você a vender mais.
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          animate={controls}
          variants={itemsVariants}
          className="mt-12 max-w-[1200px] mx-auto"
        >
          {faqs.map((faq, i) => (
            <AccordionItem key={i} faq={faq} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
