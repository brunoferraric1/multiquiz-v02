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
  
  // Request counter to implement "latest request wins" pattern for cover suggestions
  // This prevents flickering when multiple requests are made in quick succession
  const coverRequestIdRef = useRef(0);
  // Track if main flow already triggered a cover suggestion (to avoid duplicate from extraction)
  const coverSuggestionTriggeredRef = useRef(false);

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

    // Combine available context - the AI translation endpoint will handle
    // converting this to optimal English Unsplash keywords
    const basePieces = [rawPrompt?.trim(), title, description].filter(Boolean) as string[];
    const base = basePieces.join(' ').trim();

    // Return just the base context - no more hardcoded category tags
    // The image-suggestion API now uses AI to translate to optimal search terms
    return base || 'abstract minimal background';
  };

  const maybeSuggestCover = async (
    prompt?: string,
    incomingCoverUrl?: string,
    options?: { force?: boolean }
  ) => {
    const effectivePrompt = buildCoverPrompt(prompt);
    console.log('[Cover] maybeSuggestCover called', { prompt: prompt?.slice(0, 30), force: options?.force });

    if (!effectivePrompt) {
      console.log('[Cover] Skipped: no effective prompt');
      return;
    }

    const latestQuiz = useQuizBuilderStore.getState().quiz;
    const currentCover = incomingCoverUrl || latestQuiz.coverImageUrl;
    const isAutoCover = Boolean(currentCover && (currentCover.includes('unsplash.com') || currentCover.includes('source.unsplash.com')));
    const coverIsSuggested = currentCover && currentCover === lastSuggestedCoverUrl;
    const promptChanged = effectivePrompt && effectivePrompt !== lastCoverPrompt;

    const hasManualCover = Boolean(currentCover && !isAutoCover && !coverIsSuggested);
    if (hasManualCover && !options?.force) {
      console.log('[Cover] Skipped: has manual cover', { currentCover: currentCover?.slice(0, 40) });
      return;
    }

    const alreadyUpToDate = Boolean(currentCover && !options?.force && coverIsSuggested && !promptChanged);
    if (alreadyUpToDate) {
      console.log('[Cover] Skipped: already up to date');
      return;
    }

    // Increment request ID - this request will only apply if it's still the latest when it completes
    coverRequestIdRef.current += 1;
    const thisRequestId = coverRequestIdRef.current;
    
    console.log('[Cover] Request started', { requestId: thisRequestId, prompt: effectivePrompt.slice(0, 50) });
    setIsCoverSuggesting(true);

    try {
      const response = await fetch('/api/image-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: effectivePrompt }),
      });

      console.log('[Cover] Response received', { ok: response.ok, status: response.status });

      if (!response.ok) {
        throw new Error(`Erro ao sugerir capa (${response.status})`);
      }

      const data = (await response.json()) as { url?: string };
      console.log('[Cover] Data parsed', { hasUrl: !!data?.url, url: data?.url?.slice(0, 50) });

      // "Latest request wins" - only apply if this is still the most recent request
      if (thisRequestId !== coverRequestIdRef.current) {
        console.log('[Cover] Discarded (superseded)', { thisRequestId, currentRequestId: coverRequestIdRef.current });
        return;
      }

      if (data?.url) {
        const currentQuiz = useQuizBuilderStore.getState().quiz;
        console.log('[Cover] Applying to quiz', { quizId: currentQuiz.id });
        setQuiz({ ...currentQuiz, coverImageUrl: data.url });
        setLastCoverPrompt(effectivePrompt);
        setLastSuggestedCoverUrl(data.url);
        console.log('[Cover] Applied successfully', { url: data.url.slice(0, 60) });
      } else {
        console.log('[Cover] No URL in response');
      }
    } catch (error) {
      console.error('[Cover] Error:', error);
    } finally {
      // Only clear the loading state if this is still the latest request
      if (thisRequestId === coverRequestIdRef.current) {
        setIsCoverSuggesting(false);
      }
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

      // Reset flag at start of each message processing
      coverSuggestionTriggeredRef.current = false;

      console.log('[Flow] Message processed', {
        forceCoverRefresh,
        hasCoverPrompt: !!coverPrompt,
        hasExtraction: !!extraction,
        extractionKeys: extraction ? Object.keys(extraction) : [],
        shouldApplyExtraction,
        combinedCoverPrompt: combinedCoverPrompt?.slice(0, 30),
      });

      if (shouldApplyExtraction && Object.keys(extraction || {}).length > 0) {
        console.log('[Flow] Taking extraction branch');
        const updatedQuiz = { ...quiz };

        if (extraction.title) updatedQuiz.title = extraction.title;
        if (extraction.description) updatedQuiz.description = extraction.description;
        if (extraction.coverImageUrl) updatedQuiz.coverImageUrl = extraction.coverImageUrl;
        if (extraction.ctaText) updatedQuiz.ctaText = extraction.ctaText;
        if (extraction.ctaUrl) updatedQuiz.ctaUrl = extraction.ctaUrl;
        if (extraction.questions) updatedQuiz.questions = extraction.questions;
        if (extraction.outcomes) updatedQuiz.outcomes = extraction.outcomes;

        setQuiz(updatedQuiz);
        
        // Auto-suggest cover when title/description are confirmed
        // Priority: 1) AI-provided coverPrompt, 2) extraction.coverImagePrompt, 3) generate from title/desc
        const finalTitle = updatedQuiz.title || quiz.title;
        const finalDescription = updatedQuiz.description || quiz.description;
        const hasTitleOrDescription = finalTitle && finalTitle !== 'Meu Novo Quiz';
        
        const finalCoverPrompt = combinedCoverPrompt || 
          (forceCoverRefresh ? content : undefined) ||
          (hasTitleOrDescription ? `${finalTitle} ${finalDescription}`.trim() : undefined);
        
        console.log('[Flow] finalCoverPrompt for extraction branch:', finalCoverPrompt?.slice(0, 40));
        if (finalCoverPrompt) {
          coverSuggestionTriggeredRef.current = true;
          void maybeSuggestCover(finalCoverPrompt, updatedQuiz.coverImageUrl, {
            force:
              forceCoverRefresh ||
              Boolean(coverPrompt) ||
              Boolean(extraction.coverImagePrompt && extraction.coverImagePrompt !== lastCoverPrompt),
          });
        }
      } else {
        console.log('[Flow] Taking else branch (fallback)');
        // Fallback: only extract if we believe the user confirmed and we got no tool payload
        const shouldExtract = shouldExtractQuizStructure(content, response);
        console.log('Should extract quiz structure (fallback)?', shouldExtract, 'User message:', content);

        if (shouldExtract) {
          console.log('Triggering extraction fallback...');
          // Run extraction in the background to avoid blocking the chat UI
          void extractQuizStructure();
        }

        if (combinedCoverPrompt || forceCoverRefresh) {
          console.log('[Flow] Calling maybeSuggestCover from else branch', { 
            combinedCoverPrompt: combinedCoverPrompt?.slice(0, 30), 
            forceCoverRefresh 
          });
          coverSuggestionTriggeredRef.current = true;
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

        // Auto-suggest cover image when title/description are set
        // User shouldn't need to explicitly ask - it should happen automatically
        if (!coverSuggestionTriggeredRef.current) {
          const finalTitle = updatedQuiz.title || quiz.title;
          const finalDescription = updatedQuiz.description || quiz.description;
          const hasTitleOrDescription = finalTitle && finalTitle !== 'Meu Novo Quiz';
          
          // Use AI-provided coverImagePrompt if available, otherwise generate from title/description
          const coverPromptToUse = extracted.coverImagePrompt || 
            (hasTitleOrDescription ? `${finalTitle} ${finalDescription}`.trim() : undefined);
          
          if (coverPromptToUse) {
            console.log('[Extraction] Auto-triggering cover suggestion', {
              source: extracted.coverImagePrompt ? 'AI provided' : 'generated from title/desc',
              prompt: coverPromptToUse?.slice(0, 50),
            });
            void maybeSuggestCover(coverPromptToUse, updatedQuiz.coverImageUrl);
          }
        }
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
