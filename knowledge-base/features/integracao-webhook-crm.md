---
title: Integração Webhook CRM
category: features
last_updated: 2026-01-23
status: ativo
---

# Integração Webhook CRM

## O que é?

A integração Webhook CRM permite enviar automaticamente os dados dos leads capturados nos seus quizzes para o seu sistema de CRM ou qualquer ferramenta de automação. Quando alguém completa um quiz, o MultiQuiz envia instantaneamente as informações para o destino que você configurar.

## Para quem serve?

- **Equipes de vendas** que querem leads diretamente no CRM
- **Equipes de marketing** que usam automações (Zapier, Make, n8n)
- **Empresas** que já têm um sistema próprio de gestão de leads

## Como funciona?

### Ativando a integração

1. Acesse **Configurações** no menu do Dashboard
2. Clique em **Integrações**
3. Encontre o card "Webhook CRM" e ative o botão
4. O painel de configuração vai expandir

### Configurando o destino

1. Cole a **URL do webhook** do seu CRM ou ferramenta de automação
2. Copie o **Segredo de verificação** (você vai precisar dele no seu CRM)
3. Clique em **Salvar**

### Testando a conexão

1. Após salvar, clique em **Enviar teste**
2. Se aparecer "Sucesso", a conexão está funcionando
3. Verifique no seu CRM se os dados de teste chegaram

## O que é enviado?

Quando alguém completa um quiz, enviamos:

| Informação | Descrição |
|------------|-----------|
| Dados do quiz | Nome e identificador do quiz |
| Dados do lead | Todos os campos preenchidos (nome, email, telefone, campos personalizados) |
| Resultado | Qual resultado/outcome a pessoa recebeu |
| Respostas | Todas as perguntas e respostas selecionadas |

## Dicas importantes

- **Uma configuração para todos os quizzes**: A integração vale para todos os seus quizzes automaticamente
- **Só envia quando completa**: Quizzes abandonados não disparam o webhook
- **Segredo é privado**: Nunca compartilhe o segredo de verificação publicamente
- **Teste antes de publicar**: Sempre faça um teste após configurar para garantir que está funcionando

## Perguntas frequentes

**P: Preciso configurar em cada quiz?**
R: Não! A configuração é por conta. Uma vez configurado, todos os seus quizzes enviam dados automaticamente.

**P: O que acontece se meu CRM estiver fora do ar?**
R: O quiz funciona normalmente para o usuário. Os dados ficam salvos no MultiQuiz, mas o envio para o CRM pode falhar nesse momento.

**P: Posso enviar para mais de um destino?**
R: Atualmente suportamos um destino por conta. Para múltiplos destinos, use uma ferramenta intermediária como Zapier ou Make.

**P: O teste deu erro. O que fazer?**
R: Verifique se a URL está correta e se o seu CRM está configurado para receber webhooks. Consulte a documentação do seu CRM sobre como configurar endpoints de webhook.

**P: Como meu CRM sabe que o webhook é realmente do MultiQuiz?**
R: Use o Segredo de verificação para validar a assinatura que enviamos no cabeçalho de cada requisição. Isso garante que ninguém está enviando dados falsos.

---

*Última atualização: 23/01/2026*
