'use client';

import { motion } from 'framer-motion';

const faqs = [
  {
    question: 'Preciso saber programar para criar um quiz?',
    answer: 'Nao. O editor visual e pensado para montar o fluxo em poucos cliques, com sugestoes da IA.',
  },
  {
    question: 'Posso integrar com meu CRM ou automacoes?',
    answer: 'Sim. Voce pode enviar os leads para CRM, planilhas ou canais como WhatsApp e Slack.',
  },
  {
    question: 'Existe limite de respostas no plano gratuito?',
    answer: 'Nao. O plano gratuito permite leads ilimitados e acesso ao editor basico.',
  },
  {
    question: 'Consigo personalizar o visual do quiz?',
    answer: 'Totalmente. Ajuste cores, tipografia, blocos e mensagens para combinar com sua marca.',
  },
];

export const FAQAlt = () => {
  return (
    <section id="faq" className="py-20 bg-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/60">Duvidas comuns</p>
          <h2 className="mt-4 text-3xl font-semibold text-background sm:text-4xl">
            Respostas rapidas antes de voce comecar.
          </h2>
        </div>
        <div className="mt-10 grid gap-4">
          {faqs.map((item, index) => (
            <motion.div
              key={item.question}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="rounded-[var(--radius)] border border-border bg-background/5 p-6"
            >
              <h3 className="text-lg font-semibold text-background">{item.question}</h3>
              <p className="mt-2 text-sm text-background/70">{item.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
