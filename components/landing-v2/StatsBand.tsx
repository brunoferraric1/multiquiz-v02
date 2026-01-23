'use client';

import { motion } from 'framer-motion';

const stats = [
  {
    value: '4x',
    label: 'mais respostas quando o quiz vira conversa guiada',
  },
  {
    value: '10 min',
    label: 'para publicar um funil completo com IA',
  },
  {
    value: '1 clique',
    label: 'para enviar lead segmentado ao time comercial',
  },
];

export const StatsBand = () => {
  return (
    <section className="relative py-10 bg-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="rounded-[var(--radius)] border border-border bg-background/5 p-6"
            >
              <p className="text-3xl font-semibold text-background">{stat.value}</p>
              <p className="mt-2 text-sm text-background/70">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
