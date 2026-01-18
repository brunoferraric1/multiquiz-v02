# Knowledge Base — Regras de Escrita

Este arquivo contém as regras para escrever e atualizar a documentação da Knowledge Base.

**Público-alvo**: Co-founders, CS, equipe de vendas — pessoas NÃO técnicas.

---

## 🚫 Regras de Ouro

### 1. ZERO Código
Nunca inclua:
- Snippets de código
- Comandos de terminal
- Nomes de funções, variáveis, ou tabelas
- Termos como "API", "hook", "query", "Firebase", "trigger"

### 2. Linguagem Simples
- Escreva como se estivesse explicando para sua mãe
- Se um termo técnico for inevitável, explique entre parênteses
- Frases curtas, parágrafos curtos

### 3. Foco no Usuário
Explique:
- ✅ O que o usuário pode fazer
- ✅ Como fazer (passo a passo)
- ✅ Por que isso é útil

Não explique:
- ❌ Como funciona internamente
- ❌ Detalhes de implementação
- ❌ Arquitetura técnica

### 4. Português BR
- Toda documentação em português do Brasil
- Termos em inglês só quando são usados assim no produto (ex: "Quiz", "Builder")

---

## 📁 Estrutura por Categoria

### `features/` — Funcionalidades

**Estrutura:**
```
# [Nome da Feature]

## O que é?
[2-3 frases explicando a funcionalidade]

## Para quem serve?
[Lista de perfis que usam]

## Como funciona?
[Passo a passo numerado]

## Dicas importantes
[Bullet points com dicas práticas]

## Perguntas frequentes
[P: Pergunta? / R: Resposta]
```

**Exemplo de linguagem:**
- ❌ "O componente QuizBuilder renderiza as páginas dinamicamente"
- ✅ "O Editor de Quiz permite criar perguntas e personalizar a aparência"

---

### `processes/` — Processos

**Estrutura:**
```
# [Nome do Processo]

## Visão geral
[O que esse processo representa]

## Etapas

### 1. [Primeira etapa]
**O que acontece**: [descrição]
**Como fazer**: [passo a passo]

### 2. [Segunda etapa]
...

## Pontos de atenção
[Cuidados importantes]

## Onde ver isso no sistema?
[Tabela com etapa → tela do MultiQuiz]
```

---

### `decisions/` — Decisões

**Estrutura:**
```
# [Nome da Decisão]

## Contexto
[Por que precisávamos decidir isso?]

## O que decidimos
[Explicação clara da decisão]

## Por que escolhemos isso?
[Motivos em linguagem simples]

## O que isso significa na prática?
[Impacto para cada perfil de usuário]

## Alternativas consideradas
[O que mais foi avaliado]
```

---

### `changelog/` — Novidades

**Formato:** Um arquivo por mês (`YYYY-MM.md`)

**Categorias:**
| Emoji | Tipo | Quando usar |
|-------|------|-------------|
| 🚀 | Novo | Nova funcionalidade |
| 🔧 | Melhoria | Melhoria em funcionalidade existente |
| 🐛 | Correção | Bug fix |

**Estrutura:**
```markdown
# Novidades de [Mês Ano]

## Resumo do Mês

| Data | Tipo | Mudança |
|------|------|---------|
| DD/MM | 🚀 | Título da mudança |
| DD/MM | 🐛 | Outra mudança |

**Legenda**: 🚀 Novo | 🔧 Melhoria | 🐛 Correção

---

## 🚀 Título da Mudança
**DD de Mês**

Uma ou duas frases explicando a mudança.

> [!info] Detalhes
> - Detalhe 1 (se necessário)
> - Detalhe 2
```

---

## ✍️ Checklist Antes de Salvar

- [ ] Nenhum código ou termo técnico?
- [ ] Uma pessoa não-técnica entenderia?
- [ ] Está em português BR?
- [ ] Tem a estrutura correta para a categoria?
- [ ] Frontmatter YAML está preenchido?
- [ ] `last_updated` está com a data de hoje?
- [ ] `index.md` foi atualizado (se arquivo novo)?

---

## 📋 Frontmatter Padrão

Todo arquivo deve começar com:

```yaml
---
title: [Título]
category: features | processes | decisions | changelog
last_updated: YYYY-MM-DD
status: ativo | em-desenvolvimento | planejado | decidido
---
```

Campos adicionais por categoria:
- `decisions/`: adicionar `decided_at: YYYY-MM-DD`

---

## 🔄 Mantendo Atualizado

### Ao criar novo arquivo:
1. Adicione link no `index.md`
2. Verifique se a seção da categoria existe no index

### Ao atualizar arquivo existente:
1. Atualize `last_updated` no frontmatter
2. Se mudança significativa no changelog, considere adicionar nota

### Ao remover funcionalidade:
1. Mova arquivo para `_archive/` (não delete)
2. Remova do `index.md`
