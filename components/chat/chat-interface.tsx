'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { ChatMessageComponent } from './chat-message';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { AIService } from '@/lib/services/ai-service';

export function ChatInterface() {
  const chatHistory = useQuizBuilderStore((state) => state.chatHistory);
  const addChatMessage = useQuizBuilderStore((state) => state.addChatMessage);
  const setExtracting = useQuizBuilderStore((state) => state.setExtracting);
  const setError = useQuizBuilderStore((state) => state.setError);

  const [isLoading, setIsLoading] = useState(false);
  const [isCoverSuggesting, setIsCoverSuggesting] = useState(false);
  const [lastCoverPrompt, setLastCoverPrompt] = useState('');
  const [lastSuggestedCoverUrl, setLastSuggestedCoverUrl] = useState('');
  const [aiService] = useState(() => new AIService());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevChatLength = useRef(chatHistory.length);

  // Load conversation history into AI service when it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      aiService.loadHistory(chatHistory);
    }
  }, [chatHistory, aiService]);

  // Send welcome message when chat becomes empty (new quiz or cleared chat)
  useEffect(() => {
    const WELCOME_MESSAGE = [
      'Olá! Sou o seu Arquiteto de Quizzes. Vamos criar algo incrível para engajar sua audiência.',
      '',
      'Para começar, me conta rapidinho:',
      '',
      '- Tema do quiz',
      '- Objetivo principal (ex: gerar leads, educar, segmentar)',
      '- Quem é a audiência (perfil + nível de maturidade no tema)',
    ].join('\n');

    // Check if chat is empty and the last message wasn't already the welcome message
    const isEmptyChat = chatHistory.length === 0;
    const lastMessage = chatHistory[chatHistory.length - 1];
    const lastMessageIsWelcome = lastMessage?.content === WELCOME_MESSAGE;

    if (isEmptyChat && !lastMessageIsWelcome) {
      const welcomeMessage = {
        role: 'assistant' as const,
        content: WELCOME_MESSAGE,
        timestamp: Date.now(),
      };
      addChatMessage(welcomeMessage);
    }

    prevChatLength.current = chatHistory.length;
  }, [chatHistory.length, chatHistory, addChatMessage]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const quiz = useQuizBuilderStore((state) => state.quiz);
  const updateQuizField = useQuizBuilderStore((state) => state.updateQuizField);
  const setQuiz = useQuizBuilderStore((state) => state.setQuiz);

  const isCoverComplaint = (message: string) => {
    const text = message.toLowerCase();
    const complaintKeywords = [
      'imagem',
      'image',
      'capa',
      'cover',
      'foto',
      'photo',
      'figur',
      'figure',
      'troca',
      'mudar',
      'change',
      'swap',
      'sem relação',
      'off topic',
      'errada',
      'wrong',
    ];
    return complaintKeywords.some((word) => text.includes(word));
  };

  const buildCoverPrompt = (rawPrompt?: string) => {
    const currentQuiz = useQuizBuilderStore.getState().quiz;
    const title = currentQuiz.title || '';
    const description = currentQuiz.description || '';

    const basePieces = [rawPrompt?.trim(), title, description].filter(Boolean) as string[];
    const base = basePieces.join(' ').trim();
    const lowerBase = base.toLowerCase();

    const weddingTags =
      'papelaria de casamento, convite de casamento, envelopes com lacre de cera, fitas de cetim, flores delicadas, flat lay, papel texturizado, luz natural suave, sem pessoas, sem arquitetura';
    const stationeryTags =
      'papelaria artesanal, convites elegantes, envelopes, lacres de cera, fitas, flat lay, sem pessoas, sem arquitetura';
    const actionFigureTags =
      'action figure, colecionável, toy figurine, product photo, diorama, tabletop, luz de estúdio, fundo neutro, sem rosto humano, sem pessoas, spider-man figure';

    if (lowerBase.includes('casamento')) {
      return `${base}, ${weddingTags}`;
    }

    if (lowerBase.includes('papelaria')) {
      return `${base}, ${stationeryTags}`;
    }

    if (
      lowerBase.includes('boneco') ||
      lowerBase.includes('action figure') ||
      lowerBase.includes('ação') ||
      lowerBase.includes('acao') ||
      lowerBase.includes('aranha')
    ) {
      return `${base}, ${actionFigureTags}`;
    }

    const fallbackBase = base || 'capa de quiz temática';
    return `${fallbackBase}, ilustração temática, elementos do assunto em destaque, sem pessoas, sem arquitetura, sem estradas, sem rosto humano`;
  };

  const maybeSuggestCover = async (
    prompt?: string,
    incomingCoverUrl?: string,
    options?: { force?: boolean }
  ) => {
    const effectivePrompt = buildCoverPrompt(prompt);

    if (!effectivePrompt || isCoverSuggesting) return;

    const latestQuiz = useQuizBuilderStore.getState().quiz;
    const currentCover = incomingCoverUrl || latestQuiz.coverImageUrl;
    const isAutoCover = Boolean(currentCover && (currentCover.includes('unsplash.com') || currentCover.includes('source.unsplash.com')));
    const coverIsSuggested = currentCover && currentCover === lastSuggestedCoverUrl;
    const promptChanged = effectivePrompt && effectivePrompt !== lastCoverPrompt;

    const shouldForce = Boolean(
      options?.force ||
        (promptChanged && (coverIsSuggested || isAutoCover))
    );
    const hasCover = Boolean(currentCover);
    if (hasCover && !shouldForce) return;

    setIsCoverSuggesting(true);

    try {
      const response = await fetch('/api/image-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: effectivePrompt }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao sugerir capa (${response.status})`);
      }

      const data = (await response.json()) as { url?: string };

      // Avoid overriding if the user added a cover while we were fetching
      const currentQuiz = useQuizBuilderStore.getState().quiz;
      if (currentQuiz.coverImageUrl && !options?.force) return;

      if (data?.url) {
        setQuiz({ ...currentQuiz, coverImageUrl: data.url });
        setLastCoverPrompt(effectivePrompt);
        setLastSuggestedCoverUrl(data.url);
      }
    } catch (error) {
      console.error('Erro ao buscar sugestão de capa', error);
    } finally {
      setIsCoverSuggesting(false);
    }
  };

  const shouldExtractQuizStructure = (userMessage: string, assistantResponse: string): boolean => {
    // Check if user message contains confirmation keywords
    const confirmationKeywords = [
      'sim', 'confirmo', 'confirma', 'pode ir', 'pode usar', 'pode', 'usar',
      'perfeito', 'ok', 'okay', 'ótimo', 'otimo', 'está ótimo', 'esta otimo',
      'isso', 'exato', 'correto', 'certo', 'concordo', 'legal',
      'maravilha', 'beleza', 'show', 'top', 'segue', 'vamos', 'vai',
      'esses', 'essas', 'esse', 'essa', 'ficou bom', 'ficou ótimo',
      'aprovo', 'aprovado', 'pode seguir', 'continua', 'próximo', 'proximo'
    ];

    const userMessageLower = userMessage.toLowerCase();
    const hasConfirmation = confirmationKeywords.some(keyword =>
      userMessageLower.includes(keyword)
    );

    // Also check if assistant's response suggests they've updated something
    const assistantLower = assistantResponse.toLowerCase();
    const suggestsUpdate =
      assistantLower.includes('vou atualizar') ||
      assistantLower.includes('vou adicionar') ||
      assistantLower.includes('adicionei') ||
      assistantLower.includes('atualizei') ||
      assistantLower.includes('criei') ||
      assistantLower.includes('vamos aos');

    return hasConfirmation || suggestsUpdate;
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage = {
      role: 'user' as const,
      content,
      timestamp: Date.now(),
    };
    addChatMessage(userMessage);

    try {
      setIsLoading(true);
      setError(null);

      // Call AI service to get response + structured extraction in a single round-trip
      const { text: response, extraction, coverPrompt } = await aiService.sendMessageWithExtraction(
        content,
        quiz
      );

      // Add assistant response
      const assistantMessage = {
        role: 'assistant' as const,
        content: response,
        timestamp: Date.now(),
      };
      addChatMessage(assistantMessage);

      // Stop blocking the input once the assistant reply arrives
      setIsLoading(false);

      const forceCoverRefresh = isCoverComplaint(content);
      const combinedCoverPrompt = coverPrompt || extraction?.coverImagePrompt;
      // Apply extracted quiz updates immediately if present AND confirmed OR when user explicitly asks to change cover
      const shouldApplyExtraction =
        extraction && (shouldExtractQuizStructure(content, response) || forceCoverRefresh);

      if (shouldApplyExtraction && Object.keys(extraction || {}).length > 0) {
        const updatedQuiz = { ...quiz };

        if (extraction.title) updatedQuiz.title = extraction.title;
        if (extraction.description) updatedQuiz.description = extraction.description;
        if (extraction.coverImageUrl) updatedQuiz.coverImageUrl = extraction.coverImageUrl;
        if (extraction.ctaText) updatedQuiz.ctaText = extraction.ctaText;
        if (extraction.ctaUrl) updatedQuiz.ctaUrl = extraction.ctaUrl;
        if (extraction.questions) updatedQuiz.questions = extraction.questions;
        if (extraction.outcomes) updatedQuiz.outcomes = extraction.outcomes;

        setQuiz(updatedQuiz);
        const finalCoverPrompt = combinedCoverPrompt || (forceCoverRefresh ? content : undefined);
        if (finalCoverPrompt) {
          void maybeSuggestCover(finalCoverPrompt, updatedQuiz.coverImageUrl, {
            force:
              forceCoverRefresh ||
              Boolean(coverPrompt) ||
              Boolean(extraction.coverImagePrompt && extraction.coverImagePrompt !== lastCoverPrompt),
          });
        }
      } else {
        // Fallback: only extract if we believe the user confirmed and we got no tool payload
        const shouldExtract = shouldExtractQuizStructure(content, response);
        console.log('Should extract quiz structure (fallback)?', shouldExtract, 'User message:', content);

        if (shouldExtract) {
          console.log('Triggering extraction fallback...');
          // Run extraction in the background to avoid blocking the chat UI
          void extractQuizStructure();
        }

        if (combinedCoverPrompt || forceCoverRefresh) {
          // User asked to fix the image even without confirmation flow
          void maybeSuggestCover(combinedCoverPrompt || content, quiz.coverImageUrl, {
            force: true,
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Erro ao comunicar com a IA');
      setIsLoading(false);

      // Add error message to chat
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: Date.now(),
      };
      addChatMessage(errorMessage);
    }
  };

  const extractQuizStructure = async () => {
    try {
      setExtracting(true);

      // Get updated chat history (includes the latest messages)
      const updatedHistory = useQuizBuilderStore.getState().chatHistory;

      // Call extraction service
      const extracted = await aiService.extractQuizStructure(updatedHistory, quiz);

      // Apply extracted changes if any
      if (Object.keys(extracted).length > 0) {
        const updatedQuiz = { ...quiz };

        if (extracted.title) updatedQuiz.title = extracted.title;
        if (extracted.description) updatedQuiz.description = extracted.description;
        if (extracted.coverImageUrl) updatedQuiz.coverImageUrl = extracted.coverImageUrl;
        if (extracted.ctaText) updatedQuiz.ctaText = extracted.ctaText;
        if (extracted.ctaUrl) updatedQuiz.ctaUrl = extracted.ctaUrl;
        if (extracted.questions) updatedQuiz.questions = extracted.questions;
        if (extracted.outcomes) updatedQuiz.outcomes = extracted.outcomes;

        setQuiz(updatedQuiz);
        void maybeSuggestCover(extracted.coverImagePrompt, updatedQuiz.coverImageUrl);
      }
    } catch (error) {
      console.error('Error extracting quiz structure:', error);
      // Don't show error to user, this is a background operation
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg">
      {/* Header removed as requested */}

      {/* Messages List - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
      >
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h4 className="text-sm font-medium mb-2">
              Comece uma conversa
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              Descreva o quiz que você quer criar e a IA vai te ajudar a estruturá-lo
            </p>
          </div>
        ) : (
          <>
            {chatHistory.map((message, index) => (
              <ChatMessageComponent key={index} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div className="flex-shrink-0">
        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading}
          placeholder="Digite sua mensagem..."
        />
      </div>
    </div>
  );
}
