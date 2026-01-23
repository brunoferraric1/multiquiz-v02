'use client';

import { motion } from 'framer-motion';

const featureItems = [
  {
    title: 'Editor visual com IA',
    description:
      'Monte o quiz em blocos, com sugestoes inteligentes para perguntas, logica e copy.',
  },
  {
    title: 'Pontuacao de lead',
    description:
      'Atribua scores automaticamente e envie o lead certo para o vendedor certo.',
  },
  {
    title: 'Segmentacao instantanea',
    description:
      'Tags e grupos automaticos alimentam campanhas personalizadas em tempo real.',
  },
  {
    title: 'Analise clara de conversao',
    description:
      'Veja o impacto de cada pergunta e ajuste o funil sem depender de dados soltos.',
  },
];

export const FeatureMosaic = () => {
  return (
    <section id="features" className="py-20 bg-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/60">Funil conversacional</p>
          <h2 className="mt-4 text-3xl font-semibold text-background sm:text-4xl">
            Um quiz que ja qualifica o lead antes do primeiro contato.
          </h2>
          <p className="mt-4 text-background/70">
            Cada resposta vira contexto. Cada etapa reduz friccao e aproxima a conversa do fechamento.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 rounded-[calc(var(--radius)+0.5rem)] border border-border bg-background/5 p-8"
          >
            <p className="text-xs uppercase text-background/60">Destaque</p>
            <h3 className="mt-3 text-2xl font-semibold text-background">
              Crie jornadas personalizadas com blocos de decisao.
            </h3>
            <p className="mt-3 text-background/70">
              Misture perguntas abertas, escolhas rapidas e telas de conversao para desenhar o caminho ideal.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {['Logica condicional', 'Biblioteca de modelos', 'Campos customizados', 'Integracoes prontas'].map((item) => (
                <div
                  key={item}
                  className="rounded-[var(--radius)] border border-border bg-foreground px-4 py-3 text-sm text-background"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-6">
            {featureItems.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="rounded-[var(--radius)] border border-border bg-foreground p-6"
              >
                <h4 className="text-lg font-semibold text-background">{feature.title}</h4>
                <p className="mt-2 text-sm text-background/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
