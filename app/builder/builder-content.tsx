'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { useAutoSave } from '@/lib/hooks/use-auto-save';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChatInterface } from '@/components/chat/chat-interface';
import { SaveIndicator } from '@/components/builder/save-indicator';
import { useState } from 'react';

interface BuilderContentProps {
  isEditMode?: boolean;
}

export default function BuilderContent({ isEditMode = false }: BuilderContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { quiz, updateQuizField } = useQuizBuilderStore();
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save hook with 30-second debounce
  const { forceSave, cancelPendingSave } = useAutoSave({
    userId: user?.uid,
    enabled: true,
    debounceMs: 30000, // 30 seconds
  });

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      // Cancel pending auto-save and force immediate save
      cancelPendingSave();
      await forceSave();
      alert('Quiz salvo com sucesso!');
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Erro ao salvar quiz');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b shrink-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2"
                asChild
              >
                <Link href="/dashboard" className="flex items-center gap-2">
                  <ArrowLeft size={16} />
                  Voltar
                </Link>
              </Button>
              <div className="border-l border-border h-6" />
              <h1 className="text-lg font-semibold">
                {quiz.title || 'Novo Quiz'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <SaveIndicator />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // TODO: Implement preview
                  alert('Preview em desenvolvimento');
                }}
              >
                <Eye size={16} />
                Visualizar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                <Save size={16} />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Takes remaining height */}
      <main className="flex-1 overflow-hidden min-h-0">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Left Side - Chat/AI Interface */}
            <div className="h-full min-h-0">
              <ChatInterface />
            </div>

            {/* Right Side - Visual Builder */}
            <div className="h-full min-h-0">
              <Card className="flex flex-col h-full">
                <CardHeader className="flex-shrink-0">
                  <CardTitle>Estrutura do Quiz</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto min-h-0">
                  {/* Quiz Title Input */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Título do Quiz
                      </label>
                      <Input
                        type="text"
                        value={quiz.title}
                        onChange={(e) => updateQuizField('title', e.target.value)}
                        placeholder="Digite o título do seu quiz"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Descrição
                      </label>
                      <Textarea
                        value={quiz.description}
                        onChange={(e) => updateQuizField('description', e.target.value)}
                        placeholder="Descreva seu quiz"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Questions Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">
                      Perguntas ({quiz.questions?.length || 0})
                    </h3>
                    {quiz.questions && quiz.questions.length > 0 ? (
                      <div className="space-y-2">
                        {quiz.questions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="p-3 border rounded-lg bg-muted/50"
                          >
                            <p className="text-sm font-medium">
                              {idx + 1}. {q.text}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {q.options?.length || 0} opções
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <p className="text-muted-foreground text-sm">
                          Nenhuma pergunta criada ainda
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Outcomes Section */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">
                      Resultados ({quiz.outcomes?.length || 0})
                    </h3>
                    {quiz.outcomes && quiz.outcomes.length > 0 ? (
                      <div className="space-y-2">
                        {quiz.outcomes.map((outcome) => (
                          <div
                            key={outcome.id}
                            className="p-3 border rounded-lg bg-muted/50"
                          >
                            <p className="text-sm font-medium">
                              {outcome.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <p className="text-muted-foreground text-sm">
                          Nenhum resultado criado ainda
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
