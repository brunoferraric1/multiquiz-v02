# /create-plan-doc

Crie um documento de planejamento técnico detalhado para a feature ou projeto especificado pelo usuário.

## Entrada esperada

O usuário vai descrever:
- O que quer construir/implementar
- Contexto relevante (tecnologias, constraints, etc.)

## Processo

1. **Avalie o contexto da conversa**: Se já discutimos o tema nesta thread (pesquisas, análises, decisões), USE esse contexto diretamente - não repita pesquisas já feitas
2. **Pesquise apenas se necessário**: Só explore o codebase se for um comando isolado ou se faltar informação crítica que não foi discutida
3. **Pergunte se necessário**: Se faltar contexto crítico que não pode ser inferido, pergunte antes de criar o documento
4. **Crie o documento**: Salve em `documents/[FEATURE_NAME]_IMPLEMENTATION_PLAN.md`

**Importante:** Este comando geralmente é usado APÓS uma discussão sobre a feature. Aproveite todo o contexto já estabelecido na conversa (decisões tomadas, arquitetura discutida, trade-offs avaliados) em vez de começar do zero.

## Estrutura do Documento

O documento DEVE seguir esta estrutura:

```markdown
# [Nome da Feature] Implementation Plan

## Visão Geral

### O Que Estamos Fazendo
[Explicação em linguagem simples do que será construído e por quê]

### Arquitetura Alvo
[Diagrama ASCII mostrando componentes, fluxo de dados, e como se integra ao sistema existente]

---

## Princípios de Design

[Lista de 3-5 princípios que guiam as decisões técnicas]

---

## Milestones & Tasks

### Milestone 0: [Nome]
*"[Frase curta descrevendo o milestone]"*

**Goal:** [Objetivo claro em uma frase]

**Tasks:**
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Success:** [Critério de sucesso claro]

**Files:**
- `path/to/file1.ts`
- `path/to/file2.ts`

---

[Repetir para cada milestone...]

---

## Decisões Técnicas

[Tabela ou lista de decisões importantes com justificativas]

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| ... | ... | ... | ... |

---

## Métricas de Sucesso

[Lista numerada de como saber que foi bem sucedido]

---

## Cronograma Estimado

| Milestone | Complexidade | Estimativa |
|-----------|--------------|------------|
| ... | ... | ... |

**Total estimado:** X dias

---

## Changelog

| Data | Mudança |
|------|---------|
| YYYY-MM-DD | Documento criado |
```

## Regras

1. **Sem code snippets**: Apenas descrição das tasks, não código
2. **Milestones incrementais**: Cada milestone deve ser deployável/testável independentemente
3. **Tasks específicas**: Cada task deve ser clara o suficiente para executar sem ambiguidade
4. **Files section**: Sempre listar os arquivos que serão criados/modificados
5. **Diagrama ASCII**: Sempre incluir representação visual da arquitetura
6. **Linguagem**: Manter em português (PT-BR) consistente com o projeto
7. **Checkboxes**: Usar `- [ ]` para permitir tracking de progresso

## Exemplo de uso

Usuário: `/create-plan-doc quero implementar um sistema de notificações push`

Claude:
1. Pesquisa o codebase para entender arquitetura atual
2. Cria `documents/PUSH_NOTIFICATIONS_IMPLEMENTATION_PLAN.md`
3. Segue a estrutura acima com milestones específicos para push notifications
