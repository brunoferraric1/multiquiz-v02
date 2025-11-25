'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { Button } from '@/components/ui';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
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
              <div className="border-l border-gray-300 h-6" />
              <h1 className="text-lg font-semibold text-gray-900">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Criar com IA
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Converse com nossa IA para criar e editar seu quiz.
              </p>

              {/* Placeholder for chat interface */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  Interface de chat em desenvolvimento
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Em breve você poderá conversar com a IA aqui
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Visual Builder */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Editor Visual
            </h2>

            {/* Quiz Title Input */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Quiz
                </label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) => updateQuizField('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Digite o título do seu quiz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={quiz.description}
                  onChange={(e) => updateQuizField('description', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Descreva seu quiz"
                  rows={3}
                />
              </div>
            </div>

            {/* Questions Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Perguntas ({quiz.questions?.length || 0})
              </h3>
              {quiz.questions && quiz.questions.length > 0 ? (
                <div className="space-y-2">
                  {quiz.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {idx + 1}. {q.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {q.options.length} opções
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-gray-500 text-sm">
                    Nenhuma pergunta criada ainda
                  </p>
                </div>
              )}
            </div>

            {/* Outcomes Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Resultados ({quiz.outcomes?.length || 0})
              </h3>
              {quiz.outcomes && quiz.outcomes.length > 0 ? (
                <div className="space-y-2">
                  {quiz.outcomes.map((outcome) => (
                    <div
                      key={outcome.id}
                      className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {outcome.title}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-gray-500 text-sm">
                    Nenhum resultado criado ainda
                  </p>
                </div>
              )}
            </div>
          </div>
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
