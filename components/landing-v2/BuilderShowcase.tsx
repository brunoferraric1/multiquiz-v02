'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BlockType = 'intro' | 'media' | 'question' | 'cta';

interface BlockItem {
  id: string;
  type: BlockType;
  title: string;
  subtitle: string;
  buttonLabel?: string;
}

const blockTemplates: Record<BlockType, Omit<BlockItem, 'id'>> = {
  intro: {
    type: 'intro',
    title: 'Bem-vindo!',
    subtitle: 'Descubra o resultado ideal para voce em poucos cliques.',
  },
  media: {
    type: 'media',
    title: 'Adicionar midia',
    subtitle: 'Arraste uma imagem ou escolha um arquivo.',
  },
  question: {
    type: 'question',
    title: 'Qual seu maior objetivo agora?',
    subtitle: 'Selecione uma opcao para personalizar a recomendacao.',
  },
  cta: {
    type: 'cta',
    title: 'Pronto para comecar?',
    subtitle: 'Clique para iniciar o quiz e responder as primeiras perguntas.',
    buttonLabel: 'Comecar agora',
  },
};

const blockLabels: Record<BlockType, string> = {
  intro: 'Abertura',
  media: 'Midia',
  question: 'Pergunta',
  cta: 'Chamada para acao',
};

const blockOrder: BlockType[] = ['intro', 'media', 'question', 'cta'];

const initialBlocks: BlockItem[] = [
  { id: 'block-intro', ...blockTemplates.intro },
  { id: 'block-media', ...blockTemplates.media },
  { id: 'block-question', ...blockTemplates.question },
  { id: 'block-cta', ...blockTemplates.cta },
];

const createId = () => `block-${Math.random().toString(36).slice(2, 9)}`;

export const BuilderShowcase = () => {
  const [blocks, setBlocks] = useState<BlockItem[]>(initialBlocks);
  const [activeId, setActiveId] = useState<string>(initialBlocks[0]?.id ?? '');

  const activeIndex = useMemo(
    () => blocks.findIndex((block) => block.id === activeId),
    [blocks, activeId]
  );
  const activeBlock = activeIndex >= 0 ? blocks[activeIndex] : null;

  const handleAddBlock = (type: BlockType) => {
    const template = blockTemplates[type];
    const newBlock = { id: createId(), ...template };
    setBlocks((prev) => [...prev, newBlock]);
    setActiveId(newBlock.id);
  };

  const handleUpdateBlock = (patch: Partial<BlockItem>) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === activeId ? { ...block, ...patch } : block))
    );
  };

  const handleMoveBlock = (direction: -1 | 1) => {
    if (activeIndex < 0) return;
    const targetIndex = activeIndex + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const reordered = [...blocks];
    const [selected] = reordered.splice(activeIndex, 1);
    reordered.splice(targetIndex, 0, selected);
    setBlocks(reordered);
  };

  const handleRemoveBlock = () => {
    if (!activeBlock || blocks.length <= 1) return;
    const nextBlocks = blocks.filter((block) => block.id !== activeBlock.id);
    setBlocks(nextBlocks);
    setActiveId(nextBlocks[Math.max(0, activeIndex - 1)]?.id ?? '');
  };

  return (
    <section className="relative overflow-hidden bg-foreground pb-20 pt-16 text-background lg:pt-24">
      <div className="absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-secondary/40 blur-3xl" aria-hidden="true" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-background/60">
            Construtor visual simplificado
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Monte um quiz interativo em minutos, com blocos que voce controla.
          </h1>
          <p className="mt-4 text-base text-background/70 sm:text-lg">
            Experimente ajustar textos, ordenar etapas e adicionar novos blocos. Tudo acontece localmente,
            sem salvar nada.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-[calc(var(--radius)+0.75rem)] border border-border bg-foreground p-6 shadow-xl"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-background">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Canvas do quiz
              </div>
              <span className="text-xs text-background/50">Demo local</span>
            </div>

            <div className="mt-6 space-y-4">
              {blocks.map((block, index) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => setActiveId(block.id)}
                  aria-pressed={activeId === block.id}
                  className={cn(
                    'w-full rounded-[calc(var(--radius)+0.25rem)] border px-4 py-4 text-left transition',
                    activeId === block.id
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border bg-background/5 hover:border-primary/30'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.2em] text-background/60">
                      {blockLabels[block.type]}
                    </span>
                    <span className="text-xs text-background/50">Etapa {index + 1}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="text-base font-semibold text-background">{block.title}</p>
                    <p className="text-sm text-background/70">{block.subtitle}</p>
                    {block.type === 'media' ? (
                      <div className="mt-4 rounded-[var(--radius)] border border-dashed border-border bg-background/5 px-4 py-6 text-center text-xs text-background/60">
                        Solte sua midia aqui
                      </div>
                    ) : null}
                    {block.type === 'question' ? (
                      <div className="mt-3 grid gap-2 text-xs">
                        {['Aumentar vendas', 'Qualificar leads', 'Automatizar follow-up'].map((option) => (
                          <div
                            key={option}
                            className="rounded-[var(--radius)] border border-border bg-foreground px-3 py-2 text-background/80"
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {block.type === 'cta' && block.buttonLabel ? (
                      <div className="mt-4 inline-flex items-center justify-center rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                        {block.buttonLabel}
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-[calc(var(--radius)+0.5rem)] border border-dashed border-border bg-background/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-background/60">Adicionar bloco</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {blockOrder.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAddBlock(type)}
                    className="rounded-full border border-border bg-foreground px-3 py-1 text-xs text-background/70 transition hover:border-primary/40 hover:text-background"
                  >
                    + {blockLabels[type]}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-[calc(var(--radius)+0.75rem)] border border-border bg-foreground p-6 shadow-xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-background/60">Editar bloco</p>
                <h2 className="mt-2 text-xl font-semibold text-background">
                  {activeBlock ? blockLabels[activeBlock.type] : 'Selecione um bloco'}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleMoveBlock(-1)}
                  disabled={activeIndex <= 0}
                  className="rounded-full border border-border px-3 py-1 text-background/70 transition hover:border-primary/40 hover:text-background disabled:opacity-40"
                >
                  Subir
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveBlock(1)}
                  disabled={activeIndex < 0 || activeIndex >= blocks.length - 1}
                  className="rounded-full border border-border px-3 py-1 text-background/70 transition hover:border-primary/40 hover:text-background disabled:opacity-40"
                >
                  Descer
                </button>
              </div>
            </div>

            {activeBlock ? (
              <div className="mt-6 space-y-4">
                <label className="space-y-2 text-sm">
                  <span className="text-xs uppercase tracking-[0.2em] text-background/60">Titulo</span>
                  <input
                    value={activeBlock.title}
                    onChange={(event) => handleUpdateBlock({ title: event.target.value })}
                    className="w-full rounded-[var(--radius)] border border-border bg-foreground px-3 py-2 text-sm text-background placeholder:text-background/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-xs uppercase tracking-[0.2em] text-background/60">Descricao</span>
                  <textarea
                    rows={3}
                    value={activeBlock.subtitle}
                    onChange={(event) => handleUpdateBlock({ subtitle: event.target.value })}
                    className="w-full rounded-[var(--radius)] border border-border bg-foreground px-3 py-2 text-sm text-background placeholder:text-background/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
                {activeBlock.type === 'cta' ? (
                  <label className="space-y-2 text-sm">
                    <span className="text-xs uppercase tracking-[0.2em] text-background/60">Texto do botao</span>
                    <input
                      value={activeBlock.buttonLabel ?? ''}
                      onChange={(event) => handleUpdateBlock({ buttonLabel: event.target.value })}
                      className="w-full rounded-[var(--radius)] border border-border bg-foreground px-3 py-2 text-sm text-background placeholder:text-background/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </label>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 rounded-[var(--radius)] border border-border bg-background/5 p-4 text-sm text-background/60">
                Adicione um bloco para comecar a editar.
              </div>
            )}

            <div className="mt-6 rounded-[var(--radius)] border border-border bg-background/5 p-4 text-xs text-background/60">
              Alteracoes sao locais e nao ficam salvas.
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button size="lg" className="h-11 text-base" disabled>
                Publicar teste
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 text-base bg-foreground text-background border-border hover:bg-background/5"
                onClick={() => handleAddBlock('question')}
              >
                Adicionar pergunta
              </Button>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <button
                type="button"
                onClick={handleRemoveBlock}
                disabled={!activeBlock || blocks.length <= 1}
                className="text-xs text-background/60 transition hover:text-background disabled:opacity-40"
              >
                Remover bloco selecionado
              </button>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
};
