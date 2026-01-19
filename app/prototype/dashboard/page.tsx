'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'options' | 'form'>('options');
  const [quizName, setQuizName] = useState('');
  const [quizSlug, setQuizSlug] = useState('');

  const handleCreateBlank = () => {
    setModalStep('form');
  };

  const handleSubmit = () => {
    // Navigate to the builder
    router.push('/prototype');
  };

  const handleBack = () => {
    setModalStep('options');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalStep('options');
    setQuizName('');
    setQuizSlug('');
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setQuizName(name);
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setQuizSlug(slug);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-gray-900">Quiz Builder</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Prototype v0.3</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Quizzes</h1>
            <p className="text-gray-500 mt-1">Gerencie seus quizzes e funis</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            Criar quiz
          </button>
        </div>

        {/* Empty state */}
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum quiz criado</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Comece criando seu primeiro quiz para engajar seus clientes e capturar leads qualificados.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Criar meu primeiro quiz
          </button>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="p-6 pb-4 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Crie seu novo Quiz</h2>
                <p className="text-gray-500 mt-1">Crie quizzes personalizados que você pode salvar e reutilizar.</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6 pt-2">
              {modalStep === 'options' ? (
                /* Step 1: Choose creation method */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Assistente IA - Coming Soon */}
                  <div className="relative border-2 border-gray-200 rounded-xl p-6 text-center opacity-60 cursor-not-allowed">
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                      Em breve
                    </div>
                    <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Assistente IA</h3>
                    <p className="text-sm text-gray-500">Crie seu quiz com ajuda da IA</p>
                  </div>

                  {/* Funil em Branco - Active */}
                  <div
                    onClick={handleCreateBlank}
                    className="border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-xl p-6 text-center cursor-pointer transition-all"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Quiz em Branco</h3>
                    <p className="text-sm text-gray-500">Comece do zero e crie seu quiz personalizado</p>
                  </div>

                  {/* Temas - Coming Soon */}
                  <div className="relative border-2 border-gray-200 rounded-xl p-6 text-center opacity-60 cursor-not-allowed">
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                      Em breve
                    </div>
                    <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Temas</h3>
                    <p className="text-sm text-gray-500">Escolha entre nossos modelos prontos</p>
                  </div>
                </div>
              ) : (
                /* Step 2: Quiz details form */
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Nome do Quiz</label>
                    <input
                      type="text"
                      value={quizName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ex: Quiz de Skincare Personalizado"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">URL do Quiz</label>
                    <div className="flex">
                      <div className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">
                        seusite.com/
                      </div>
                      <input
                        type="text"
                        value={quizSlug}
                        onChange={(e) => setQuizSlug(e.target.value)}
                        placeholder="meu-quiz"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4">
                    <button
                      onClick={handleBack}
                      className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!quizName.trim()}
                      className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                        quizName.trim()
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Criar Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
