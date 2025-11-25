
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProtectedRoute } from '@/components/protected-route';
import { QuizService } from '@/lib/services/quiz-service';
import { useState } from 'react';

function BuilderContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { quiz, updateQuizField } = useQuizBuilderStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      await QuizService.saveQuiz(quiz, user.uid);
      alert('Quiz salvo com sucesso!');
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Erro ao salvar quiz');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (confirm('Tem certeza que deseja sair? Alterações não salvas serão perdidas.')) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft size={16} />
                Voltar
              </Button>
              <div className="border-l border-border h-6" />
              <h1 className="text-lg font-semibold">
                {quiz.title || 'Novo Quiz'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Chat/AI Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Criar com IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Converse com nossa IA para criar e editar seu quiz.
                </p>

                {/* Placeholder for chat interface */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">
                    Interface de chat em desenvolvimento
                  </p>
                  <p className="text-sm text-muted-foreground/80 mt-2">
                    Em breve você poderá conversar com a IA aqui
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Side - Visual Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Editor Visual</CardTitle>
            </CardHeader>
            <CardContent>
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
                          {q.options.length} opções
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
      </main>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <ProtectedRoute>
      <BuilderContent />
    </ProtectedRoute>
  );
}

