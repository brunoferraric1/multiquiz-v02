'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { Button } from '@/components/ui/button';
import { ChatMessageComponent } from './chat-message';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { AIService } from '@/lib/services/ai-service';

export function ChatInterface() {
  const chatHistory = useQuizBuilderStore((state) => state.chatHistory);
  const addChatMessage = useQuizBuilderStore((state) => state.addChatMessage);
  const setChatHistory = useQuizBuilderStore((state) => state.setChatHistory);
  const setExtracting = useQuizBuilderStore((state) => state.setExtracting);
  const setError = useQuizBuilderStore((state) => state.setError);

  const [isLoading, setIsLoading] = useState(false);
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
    const WELCOME_MESSAGE = 'Olá! Sou o seu Arquiteto de Quizzes. Vamos criar algo incrível para engajar sua audiência. Para começar, sobre o que será o seu quiz?';

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

      // Call AI service to get response
      const response = await aiService.sendMessage(content);

      // Add assistant response
      const assistantMessage = {
        role: 'assistant' as const,
        content: response,
        timestamp: Date.now(),
      };
      addChatMessage(assistantMessage);

      // Stop blocking the input once the assistant reply arrives
      setIsLoading(false);

      // Only extract quiz structure if user confirmed something or bot suggests update
      const shouldExtract = shouldExtractQuizStructure(content, response);
      console.log('Should extract quiz structure?', shouldExtract, 'User message:', content);

      if (shouldExtract) {
        console.log('Triggering extraction...');
        // Run extraction in the background to avoid blocking the chat UI
        void extractQuizStructure();
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
        if (extracted.questions) updatedQuiz.questions = extracted.questions;
        if (extracted.outcomes) updatedQuiz.outcomes = extracted.outcomes;

        setQuiz(updatedQuiz);
      }
    } catch (error) {
      console.error('Error extracting quiz structure:', error);
      // Don't show error to user, this is a background operation
    } finally {
      setExtracting(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Tem certeza que deseja limpar o histórico de chat?')) {
      setChatHistory([]);
      aiService.clearHistory();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg">
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <h2 className="text-lg font-semibold">Criador com IA</h2>
        {chatHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Trash2 size={16} />
            Limpar
          </Button>
        )}
      </div>

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
