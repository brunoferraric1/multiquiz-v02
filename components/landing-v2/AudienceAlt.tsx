'use client';

import { motion } from 'framer-motion';

const audiences = [
  {
    title: 'Infoprodutores',
    description: 'Quizzes que preparam o lead para o pitch e aumentam a taxa de conversao das ofertas.',
  },
  {
    title: 'Agencias',
    description: 'Entregue funis personalizados para clientes com dados claros de performance.',
  },
  {
    title: 'SaaS e B2B',
    description: 'Qualifique com perguntas estrategicas e reduza o tempo ate o primeiro contato.',
  },
  {
    title: 'E-commerce',
    description: 'Recomende produtos certos com base no perfil do visitante e aumente o ticket.',
  },
];

export const AudienceAlt = () => {
  return (
    <section className="py-20 bg-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/60">Para quem</p>
          <h2 className="mt-4 text-3xl font-semibold text-background sm:text-4xl">
            Para times que transformam trafego em resultado.
          </h2>
          <p className="mt-4 text-background/70">
            Seja qual for o seu modelo de negocio, voce cria jornadas que falam direto com o cliente certo.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="rounded-[var(--radius)] border border-border bg-background/5 p-6"
            >
              <h3 className="text-lg font-semibold text-background">{audience.title}</h3>
              <p className="mt-2 text-sm text-background/70">{audience.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
