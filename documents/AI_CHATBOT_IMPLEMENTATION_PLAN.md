# AI Chatbot Implementation Plan

## Visão Geral

### O Que Estamos Fazendo

O chatbot atual foi construído para o modelo de dados legado (questions/outcomes). O novo Visual Builder usa um modelo completamente diferente (Steps/Blocks). Em vez de adaptar o código antigo, vamos reconstruir o chatbot usando o **Vercel AI SDK** para ganhar:

- **Streaming**: Respostas aparecem progressivamente
- **Tool calling tipado**: Schema Zod com validação automática
- **Middleware**: Logging, guardrails e cache de forma declarativa
- **Multi-provider**: Trocar de OpenRouter para Anthropic/OpenAI = 1 linha
- **Menos código**: Elimina ~400 linhas de JSON repair e cleanup

### Arquitetura Alvo

```
┌─────────────────────────────────────────────────────────────────┐
│                        Visual Builder                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Sidebar    │    │   Preview    │    │   Properties     │  │
│  │   (Steps)    │    │   (Live)     │    │   (Editor)       │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │   AI Chat Panel   │◄── Floating button     │
│                    │   (Drawer/Modal)  │                        │
│                    └─────────┬─────────┘                        │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   useChat Hook      │ ◄── Vercel AI SDK
                    │   (State + Stream)  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   /api/chat Route   │ ◄── streamText()
                    │   (Tool Execution)  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │ addStep  │    │ update   │    │ generate │
        │ Tool     │    │ Block    │    │ Image    │
        └────┬─────┘    └────┬─────┘    └────┬─────┘
             │               │               │
             └───────────────┼───────────────┘
                             ▼
                    ┌──────────────────┐
                    │  Zustand Store   │ ◄── visual-builder-store
                    │  (Steps/Blocks)  │
                    └──────────────────┘
```

---

## Princípios de Design

1. **Tools = Actions**: Cada tool mapeia 1:1 para uma ação da store
2. **Estado único**: Zustand é a fonte de verdade, chat não duplica estado
3. **Streaming first**: Toda resposta é streamed por padrão
4. **Middleware para cross-cutting**: Logging, cleanup, guardrails via middleware
5. **Testável**: Cada tool é uma função pura que pode ser testada isoladamente

---

## Milestones & Tasks

### Milestone 0: Setup e Infraestrutura
*"Preparando o terreno"*

**Goal:** Vercel AI SDK instalado e funcionando com uma rota básica

**Tasks:**
- [ ] Instalar dependências (`ai`, `@ai-sdk/openai` ou provider escolhido)
- [ ] Criar provider wrapper para OpenRouter (compatível com OpenAI API)
- [ ] Criar rota `/api/chat` básica com `streamText()`
- [ ] Testar streaming com prompt simples (sem tools ainda)
- [ ] Configurar variáveis de ambiente para o novo setup
- [ ] Documentar decisão de provider no CLAUDE.md

**Success:** Rota `/api/chat` retornando streaming text

**Files:**
- `package.json` (novas deps)
- `lib/ai/provider.ts` (configuração do provider)
- `app/api/chat/route.ts` (nova rota)

---

### Milestone 1: Sistema de Tools
*"Dando mãos ao assistente"*

**Goal:** Tools básicas funcionando e manipulando a store

**Tasks:**
- [ ] Definir schema base para tools com Zod
- [ ] Criar tool `addStep` (question, lead-gen, promo)
- [ ] Criar tool `updateStep` (label, settings)
- [ ] Criar tool `deleteStep`
- [ ] Criar tool `addOutcome`
- [ ] Criar tool `updateOutcome`
- [ ] Criar tool `deleteOutcome`
- [ ] Criar mecanismo para tools acessarem a store (via closure ou context)
- [ ] Testar cada tool isoladamente
- [ ] Testar fluxo completo: mensagem → tool call → store update

**Success:** Usuário pode pedir "adicione uma pergunta" e a store é atualizada

**Files:**
- `lib/ai/tools/step-tools.ts`
- `lib/ai/tools/outcome-tools.ts`
- `lib/ai/tools/index.ts` (export all)
- `lib/ai/tools/__tests__/` (testes unitários)

---

### Milestone 2: Tools de Blocos
*"Controle granular do conteúdo"*

**Goal:** Assistente consegue manipular blocos dentro de steps/outcomes

**Tasks:**
- [ ] Criar tool `addBlock` (todos os 9 tipos)
- [ ] Criar tool `updateBlock` (config parcial)
- [ ] Criar tool `deleteBlock`
- [ ] Criar tool `toggleBlock` (enable/disable)
- [ ] Criar tool `reorderBlocks`
- [ ] Criar schemas Zod para cada tipo de BlockConfig
- [ ] Testar manipulação de blocos em steps
- [ ] Testar manipulação de blocos em outcomes

**Success:** Usuário pode pedir "adicione um banner de urgência na intro"

**Files:**
- `lib/ai/tools/block-tools.ts`
- `lib/ai/schemas/block-configs.ts`

---

### Milestone 3: Tools de Conteúdo
*"Preenchendo o quiz"*

**Goal:** Assistente consegue preencher conteúdo dos blocos

**Tasks:**
- [ ] Criar tool `setHeaderContent` (title, description)
- [ ] Criar tool `setButtonConfig` (text, action, url)
- [ ] Criar tool `addOption` (para bloco options)
- [ ] Criar tool `updateOption` (text, emoji, outcomeId)
- [ ] Criar tool `removeOption`
- [ ] Criar tool `addField` (para bloco fields)
- [ ] Criar tool `addPriceItem` (para bloco price)
- [ ] Criar tool `addListItem` (para bloco list)
- [ ] Criar tool `setBannerContent` (urgency, text, emoji)

**Success:** Usuário pode pedir "crie 3 opções para a pergunta 1"

**Files:**
- `lib/ai/tools/content-tools.ts`

---

### Milestone 4: Tools de Mídia
*"Imagens e vídeos"*

**Goal:** Assistente consegue gerenciar mídia

**Tasks:**
- [ ] Criar tool `setMediaUrl` (image ou video)
- [ ] Criar tool `generateCoverImage` (integração Unsplash/AI)
- [ ] Criar tool `generateOutcomeImage`
- [ ] Criar tool `setMediaFocalPoint`
- [ ] Reaproveitar lógica existente de busca de imagens do AIService atual
- [ ] Testar upload e preview de imagens

**Success:** Usuário pode pedir "coloque uma foto de café na intro"

**Files:**
- `lib/ai/tools/media-tools.ts`

---

### Milestone 5: System Prompt e Contexto
*"Ensinando o assistente"*

**Goal:** Prompt system otimizado para o novo modelo

**Tasks:**
- [ ] Escrever novo system prompt focado em Steps/Blocks
- [ ] Incluir descrição de cada tipo de step e quando usar
- [ ] Incluir descrição de cada tipo de bloco e quando usar
- [ ] Definir regras de UX writing (CTAs curtos, etc.) - reaproveitar do atual
- [ ] Criar função para injetar contexto do quiz atual (steps, outcomes)
- [ ] Definir fluxo conversacional (etapas recomendadas)
- [ ] Testar prompt com diferentes cenários

**Success:** Assistente entende a estrutura e sugere ações apropriadas

**Files:**
- `lib/ai/prompts/system-prompt.ts`
- `lib/ai/prompts/context-builder.ts`

---

### Milestone 6: Middleware Layer
*"Cross-cutting concerns"*

**Goal:** Logging, cleanup e guardrails via middleware

**Tasks:**
- [ ] Criar middleware de logging (requests/responses)
- [ ] Criar middleware de cleanup (remover pensamentos internos)
- [ ] Reaproveitar patterns de INTERNAL_LEAK_PATTERNS do código atual
- [ ] Criar middleware de rate limiting (opcional)
- [ ] Criar middleware de cache para respostas similares (opcional)
- [ ] Configurar stack de middlewares

**Success:** Responses limpas, logs úteis, sem vazamento de raciocínio

**Files:**
- `lib/ai/middleware/logging.ts`
- `lib/ai/middleware/cleanup.ts`
- `lib/ai/middleware/index.ts`

---

### Milestone 7: UI do Chat
*"Interface do usuário"*

**Goal:** Componente de chat integrado ao Visual Builder

**Tasks:**
- [ ] Criar hook `useQuizChat` que wrappa `useChat` com contexto do quiz
- [ ] Criar componente `ChatPanel` (drawer/modal)
- [ ] Criar componente `ChatMessage` (com suporte a markdown)
- [ ] Criar componente `ChatInput` (com auto-resize)
- [ ] Criar componente `TypingIndicator` (streaming feedback)
- [ ] Adicionar floating button no Visual Builder
- [ ] Implementar abertura/fechamento do chat panel
- [ ] Reaproveitar componentes de `components/chat/` se aplicável
- [ ] Implementar scroll automático para novas mensagens
- [ ] Adicionar suporte a i18n para UI do chat

**Success:** Usuário pode abrir chat, enviar mensagens e ver respostas streaming

**Files:**
- `lib/hooks/use-quiz-chat.ts`
- `components/visual-builder/chat/chat-panel.tsx`
- `components/visual-builder/chat/chat-message.tsx`
- `components/visual-builder/chat/chat-input.tsx`
- `components/visual-builder/chat/typing-indicator.tsx`
- `components/visual-builder/chat/chat-fab.tsx`

---

### Milestone 8: Sincronização de Estado
*"Mantendo tudo em sync"*

**Goal:** Chat e Visual Builder sempre sincronizados

**Tasks:**
- [ ] Garantir que tool executions atualizam a store imediatamente
- [ ] Implementar feedback visual quando tool é executada (toast/highlight)
- [ ] Implementar seleção automática do elemento criado/modificado
- [ ] Testar cenários de race condition
- [ ] Implementar undo/redo básico (opcional para este milestone)
- [ ] Garantir que auto-save funciona com mudanças via chat

**Success:** Mudanças via chat refletem instantaneamente no preview

**Files:**
- `lib/ai/tools/execution-context.ts`
- Modificações em `store/visual-builder-store.ts` se necessário

---

### Milestone 9: Mensagens de Contexto
*"Assistente sabe o que está acontecendo"*

**Goal:** Assistente tem consciência do estado atual do quiz

**Tasks:**
- [ ] Injetar estado atual como contexto em cada request
- [ ] Incluir steps atuais (tipos, labels, quantidade de blocos)
- [ ] Incluir outcomes atuais (nomes, quantidade de blocos)
- [ ] Incluir step/bloco selecionado atualmente
- [ ] Otimizar tamanho do contexto (não enviar tudo, só resumo)
- [ ] Testar que assistente não sugere criar o que já existe

**Success:** Assistente sabe que "já existem 3 perguntas" e age apropriadamente

**Files:**
- `lib/ai/context/quiz-state-serializer.ts`

---

### Milestone 10: Testes e Documentação
*"Qualidade e manutenibilidade"*

**Goal:** Código testado e documentado

**Tasks:**
- [ ] Testes unitários para cada tool
- [ ] Testes de integração para fluxos completos
- [ ] Testes E2E básicos (chat → store → preview)
- [ ] Documentar arquitetura no CLAUDE.md
- [ ] Documentar como adicionar novas tools
- [ ] Documentar middleware patterns
- [ ] Criar exemplos de uso no código

**Success:** Coverage adequado, docs atualizadas

**Files:**
- `lib/ai/**/__tests__/`
- `CLAUDE.md` (seção AI Chatbot)

---

### Milestone 11: Migração e Cleanup
*"Removendo o legado"*

**Goal:** Transição completa para o novo sistema

**Tasks:**
- [ ] Remover ou deprecar `lib/services/ai-service.ts`
- [ ] Remover rota `/api/openrouter` (se não usada em outro lugar)
- [ ] Atualizar referências no código
- [ ] Remover componentes de chat antigos não utilizados
- [ ] Atualizar documentação de API
- [ ] Final review de código morto

**Success:** Codebase limpo, apenas novo sistema em uso

---

## Decisões Técnicas

### Provider
- **Escolha:** OpenRouter (mantém flexibilidade de modelos)
- **Wrapper:** Usar `@ai-sdk/openai` com `baseURL` customizada
- **Fallback:** Configurar fallback para outro provider se rate limited

### Modelo
- **Default:** Manter configurável via env (`NEXT_PUBLIC_AI_MODEL`)
- **Recomendado:** Claude 3.5 Sonnet ou GPT-4o para tool calling confiável

### Estado do Chat
- **Persistência:** Apenas em memória durante a sessão
- **Histórico:** Não persistir entre sessões (quiz é o produto, não o chat)

### Execução de Tools
- **Modo:** Automático (sem confirmação do usuário)
- **Exceção:** Tools destrutivas (delete) podem pedir confirmação futuramente

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Tool calling inconsistente | Média | Alto | Schemas Zod rigorosos + testes |
| Latência de streaming | Baixa | Médio | Feedback visual imediato |
| Custo de API aumentar | Média | Médio | Cache de contexto, rate limiting |
| Modelo não seguir instruções | Média | Alto | Prompt engineering iterativo |
| Race conditions | Baixa | Alto | Zustand é síncrono, baixo risco |

---

## Métricas de Sucesso

1. **Funcional:** Usuário consegue criar quiz completo via chat
2. **Performance:** Primeira resposta em < 2s (streaming)
3. **Confiabilidade:** < 5% de tool calls falhando
4. **UX:** Feedback visual imediato em toda ação
5. **Manutenibilidade:** Adicionar nova tool em < 30 min

---

## Cronograma Estimado

| Milestone | Complexidade | Estimativa |
|-----------|--------------|------------|
| M0: Setup | Baixa | 0.5 dia |
| M1: Tools básicas | Média | 1 dia |
| M2: Tools de blocos | Média | 1 dia |
| M3: Tools de conteúdo | Média | 1 dia |
| M4: Tools de mídia | Média | 0.5 dia |
| M5: System prompt | Média | 1 dia |
| M6: Middleware | Baixa | 0.5 dia |
| M7: UI do chat | Alta | 1.5 dias |
| M8: Sincronização | Média | 0.5 dia |
| M9: Contexto | Baixa | 0.5 dia |
| M10: Testes/Docs | Média | 1 dia |
| M11: Migração | Baixa | 0.5 dia |

**Total estimado:** ~10 dias de trabalho

---

## Changelog

| Data | Mudança |
|------|---------|
| 2025-01-24 | Documento criado após análise de AG-UI, CopilotKit e Vercel AI SDK |
