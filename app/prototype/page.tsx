'use client';

import { useState } from 'react';

// Simple prototype - HTML/CSS/JS style, no complex components
// Goal: Feel the UX before committing to full implementation

type StepType = 'intro' | 'question' | 'lead-gen' | 'result';

interface Step {
  id: string;
  type: StepType;
  label: string;
  content: {
    title: string;
    description?: string;
    options?: string[];
  };
}

const initialSteps: Step[] = [
  { id: 'intro', type: 'intro', label: 'Intro', content: { title: 'Bem-vindo ao Quiz!', description: 'Descubra qual produto é ideal para você' } },
  { id: 'q1', type: 'question', label: 'P1', content: { title: 'Qual seu tipo de pele?', options: ['Seca', 'Oleosa', 'Mista', 'Normal'] } },
  { id: 'q2', type: 'question', label: 'P2', content: { title: 'Com que frequência você hidrata?', options: ['Diariamente', 'Às vezes', 'Raramente'] } },
  { id: 'lead', type: 'lead-gen', label: 'Leads', content: { title: 'Deixe seu email', description: 'Receba seu resultado personalizado' } },
  { id: 'r1', type: 'result', label: 'R1', content: { title: 'Seu resultado: Pele Radiante', description: 'Recomendamos o Kit Hidratação Intensiva' } },
];

export default function PrototypePage() {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [activeStepId, setActiveStepId] = useState('intro');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [propertyTab, setPropertyTab] = useState<'content' | 'style' | 'settings'>('content');
  const [mobileTab, setMobileTab] = useState<'preview' | 'edit' | 'chat'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  const activeStep = steps.find(s => s.id === activeStepId) || steps[0];

  // Update step content
  const updateStepContent = (field: string, value: string) => {
    setSteps(steps.map(s =>
      s.id === activeStepId
        ? { ...s, content: { ...s.content, [field]: value } }
        : s
    ));
  };

  // Add new step
  const addStep = (type: StepType) => {
    const count = steps.filter(s => s.type === type).length + 1;
    const labels: Record<StepType, string> = {
      intro: 'Intro',
      question: `P${count}`,
      'lead-gen': 'Leads',
      result: `R${count}`,
    };
    const newStep: Step = {
      id: `${type}-${Date.now()}`,
      type,
      label: labels[type],
      content: {
        title: type === 'question' ? 'Nova pergunta?' : type === 'result' ? 'Novo resultado' : 'Novo conteúdo',
        options: type === 'question' ? ['Opção 1', 'Opção 2'] : undefined,
      },
    };
    setSteps([...steps, newStep]);
    setActiveStepId(newStep.id);
    setIsAddSheetOpen(false);
  };

  // Delete step
  const deleteStep = (id: string) => {
    if (steps.length <= 1) return;
    const newSteps = steps.filter(s => s.id !== id);
    setSteps(newSteps);
    if (activeStepId === id) {
      setActiveStepId(newSteps[0].id);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* ===== HEADER ===== */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button className="text-gray-700 hover:text-gray-900 font-medium">&larr; Voltar</button>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-900">Quiz Skincare</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-medium">Preview</button>
          <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Publicar</button>
        </div>
      </header>

      {/* ===== STEP TABS ===== */}
      <div className="h-12 bg-white border-b flex items-center gap-1 px-4 overflow-x-auto shrink-0">
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={() => setActiveStepId(step.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (confirm(`Deletar "${step.label}"?`)) deleteStep(step.id);
            }}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-sm
              transition-all duration-200
              ${activeStepId === step.id
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'hover:bg-gray-100 text-gray-700'}
            `}
          >
            <span className="text-gray-400 cursor-grab">⋮⋮</span>
            <span>{step.label}</span>
          </div>
        ))}

        {/* Add button */}
        <button
          onClick={() => setIsAddSheetOpen(true)}
          className="ml-2 w-8 h-8 flex items-center justify-center rounded border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          +
        </button>
      </div>

      {/* ===== MAIN CONTENT (Desktop: 3 columns, Mobile: tabs) ===== */}
      <div className="flex-1 flex overflow-hidden">

        {/* === CHAT PANEL (collapsible) === */}
        <aside
          className={`
            hidden md:flex flex-col bg-white border-r
            transition-all duration-300 ease-in-out shrink-0
            ${isChatExpanded ? 'w-72' : 'w-16'}
          `}
        >
          {/* Chat header */}
          <div className="h-12 flex items-center justify-between px-3 border-b">
            {isChatExpanded && <span className="font-medium text-sm">AI Assistant</span>}
            <button
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
            >
              {isChatExpanded ? '◀' : '▶'}
            </button>
          </div>

          {/* Chat content */}
          {isChatExpanded ? (
            <>
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-800">
                  Olá! Como posso ajudar com seu quiz?
                </div>
                <div className="bg-blue-100 rounded-lg p-3 text-sm ml-4 text-blue-900">
                  Adicione 3 perguntas sobre skincare
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-800">
                  Criando 3 perguntas sobre skincare...
                </div>
              </div>
              <div className="p-3 border-t">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-500"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center pt-4 gap-3">
              <button
                onClick={() => setIsChatExpanded(true)}
                className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"
              >
                💬
              </button>
            </div>
          )}
        </aside>

        {/* === PREVIEW PANEL (center) === */}
        <main className="flex-1 flex flex-col bg-gray-200 overflow-hidden">
          {/* Preview toolbar */}
          <div className="h-10 bg-white/80 backdrop-blur border-b flex items-center justify-center gap-2 px-4">
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`px-3 py-1 text-xs rounded font-medium ${previewDevice === 'mobile' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              📱 Mobile
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`px-3 py-1 text-xs rounded font-medium ${previewDevice === 'desktop' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              🖥 Desktop
            </button>
          </div>

          {/* Preview canvas */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            <div
              className={`
                bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300
                ${previewDevice === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full max-w-2xl h-full'}
              `}
            >
              {/* Preview content - clickable areas */}
              <div className="h-full flex flex-col p-6">
                {activeStep.type === 'intro' && (
                  <>
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      {/* Clickable title */}
                      <div
                        onClick={() => { setHighlightedField('title'); setPropertyTab('content'); }}
                        className={`
                          p-2 rounded cursor-pointer transition-all
                          ${highlightedField === 'title' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                        `}
                      >
                        <h1 className="text-2xl font-bold text-gray-900">{activeStep.content.title}</h1>
                      </div>

                      {/* Clickable description */}
                      <div
                        onClick={() => { setHighlightedField('description'); setPropertyTab('content'); }}
                        className={`
                          p-2 rounded cursor-pointer transition-all mt-2
                          ${highlightedField === 'description' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                        `}
                      >
                        <p className="text-gray-700">{activeStep.content.description}</p>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium">
                      Começar Quiz
                    </button>
                  </>
                )}

                {activeStep.type === 'question' && (
                  <>
                    <div className="mb-2 text-sm text-gray-500 font-medium">Pergunta {steps.filter(s => s.type === 'question').findIndex(s => s.id === activeStep.id) + 1}</div>

                    {/* Clickable question title */}
                    <div
                      onClick={() => { setHighlightedField('title'); setPropertyTab('content'); }}
                      className={`
                        p-2 rounded cursor-pointer transition-all mb-6
                        ${highlightedField === 'title' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                      `}
                    >
                      <h2 className="text-xl font-semibold text-gray-900">{activeStep.content.title}</h2>
                    </div>

                    {/* Clickable options */}
                    <div
                      onClick={() => { setHighlightedField('options'); setPropertyTab('content'); }}
                      className={`
                        space-y-3 p-2 rounded cursor-pointer transition-all
                        ${highlightedField === 'options' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                      `}
                    >
                      {activeStep.content.options?.map((opt, i) => (
                        <div key={i} className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-gray-800 font-medium">
                          {opt}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeStep.type === 'lead-gen' && (
                  <div className="flex-1 flex flex-col justify-center">
                    <div
                      onClick={() => { setHighlightedField('title'); setPropertyTab('content'); }}
                      className={`
                        p-2 rounded cursor-pointer transition-all mb-4
                        ${highlightedField === 'title' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                      `}
                    >
                      <h2 className="text-xl font-semibold text-center text-gray-900">{activeStep.content.title}</h2>
                    </div>
                    <div className="space-y-3">
                      <input type="text" placeholder="Seu nome" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500" />
                      <input type="email" placeholder="Seu email" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500" />
                      <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium">
                        Ver meu resultado
                      </button>
                    </div>
                  </div>
                )}

                {activeStep.type === 'result' && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-3xl mb-4">
                      🎉
                    </div>
                    <div
                      onClick={() => { setHighlightedField('title'); setPropertyTab('content'); }}
                      className={`
                        p-2 rounded cursor-pointer transition-all
                        ${highlightedField === 'title' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                      `}
                    >
                      <h2 className="text-xl font-bold text-gray-900">{activeStep.content.title}</h2>
                    </div>
                    <div
                      onClick={() => { setHighlightedField('description'); setPropertyTab('content'); }}
                      className={`
                        p-2 rounded cursor-pointer transition-all mt-2
                        ${highlightedField === 'description' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                      `}
                    >
                      <p className="text-gray-700">{activeStep.content.description}</p>
                    </div>
                    <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">
                      Ver produto recomendado
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* === PROPERTIES PANEL (right) === */}
        <aside className="hidden md:flex w-80 flex-col bg-white border-l shrink-0">
          {/* Properties tabs */}
          <div className="h-12 flex items-center border-b">
            {(['content', 'style', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPropertyTab(tab)}
                className={`
                  flex-1 h-full text-sm font-medium transition-colors
                  ${propertyTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                {tab === 'content' ? 'Conteúdo' : tab === 'style' ? 'Estilo' : 'Config'}
              </button>
            ))}
          </div>

          {/* Properties content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {propertyTab === 'content' && (
              <div className="space-y-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  {activeStep.type === 'intro' ? 'Introdução' :
                   activeStep.type === 'question' ? 'Pergunta' :
                   activeStep.type === 'lead-gen' ? 'Captura de Leads' : 'Resultado'}
                </div>

                {/* Title field */}
                <div className={`transition-all ${highlightedField === 'title' ? 'ring-2 ring-blue-500 rounded-lg p-2 -m-2 bg-blue-50' : ''}`}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
                  <input
                    type="text"
                    value={activeStep.content.title}
                    onChange={(e) => updateStepContent('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                  />
                </div>

                {/* Description field */}
                {(activeStep.type === 'intro' || activeStep.type === 'result' || activeStep.type === 'lead-gen') && (
                  <div className={`transition-all ${highlightedField === 'description' ? 'ring-2 ring-blue-500 rounded-lg p-2 -m-2 bg-blue-50' : ''}`}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={activeStep.content.description || ''}
                      onChange={(e) => updateStepContent('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                      rows={3}
                    />
                  </div>
                )}

                {/* Options for questions */}
                {activeStep.type === 'question' && (
                  <div className={`transition-all ${highlightedField === 'options' ? 'ring-2 ring-blue-500 rounded-lg p-2 -m-2 bg-blue-50' : ''}`}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Opções</label>
                    <div className="space-y-2">
                      {activeStep.content.options?.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...(activeStep.content.options || [])];
                              newOptions[i] = e.target.value;
                              setSteps(steps.map(s =>
                                s.id === activeStepId
                                  ? { ...s, content: { ...s.content, options: newOptions } }
                                  : s
                              ));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                          />
                          <button
                            onClick={() => {
                              const newOptions = activeStep.content.options?.filter((_, idx) => idx !== i);
                              setSteps(steps.map(s =>
                                s.id === activeStepId
                                  ? { ...s, content: { ...s.content, options: newOptions } }
                                  : s
                              ));
                            }}
                            className="px-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newOptions = [...(activeStep.content.options || []), `Opção ${(activeStep.content.options?.length || 0) + 1}`];
                          setSteps(steps.map(s =>
                            s.id === activeStepId
                              ? { ...s, content: { ...s.content, options: newOptions } }
                              : s
                          ));
                        }}
                        className="w-full py-2 border-2 border-dashed rounded text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500"
                      >
                        + Adicionar opção
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {propertyTab === 'style' && (
              <div className="space-y-4">
                <div className="text-xs text-gray-400 uppercase tracking-wide">Estilo</div>
                <div className="p-8 text-center text-gray-400 border-2 border-dashed rounded-lg">
                  Opções de estilo aqui
                  <br />
                  <span className="text-xs">(cores, fontes, espaçamento)</span>
                </div>
              </div>
            )}

            {propertyTab === 'settings' && (
              <div className="space-y-4">
                <div className="text-xs text-gray-400 uppercase tracking-wide">Configurações</div>

                {activeStep.type === 'question' && (
                  <>
                    <div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded" />
                        Permitir múltipla escolha
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded" />
                        Mostrar imagem
                      </label>
                    </div>
                  </>
                )}

                {activeStep.type === 'lead-gen' && (
                  <>
                    <div className="text-sm font-medium">Campos a coletar:</div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" defaultChecked className="rounded" />
                        Nome
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" defaultChecked className="rounded" />
                        Email
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded" />
                        Telefone
                      </label>
                    </div>
                  </>
                )}

                {(activeStep.type === 'intro' || activeStep.type === 'result') && (
                  <div className="p-8 text-center text-gray-400 border-2 border-dashed rounded-lg">
                    Configurações do {activeStep.type === 'intro' ? 'Intro' : 'Resultado'}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ===== MOBILE TAB BAR ===== */}
      <div className="md:hidden h-14 bg-white border-t flex shrink-0">
        {(['preview', 'edit', 'chat'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`
              flex-1 flex flex-col items-center justify-center text-xs
              ${mobileTab === tab ? 'text-blue-600' : 'text-gray-500'}
            `}
          >
            <span className="text-lg mb-0.5">
              {tab === 'preview' ? '👁' : tab === 'edit' ? '✏️' : '💬'}
            </span>
            {tab === 'preview' ? 'Preview' : tab === 'edit' ? 'Editar' : 'Chat'}
          </button>
        ))}
      </div>

      {/* ===== ADD STEP BOTTOM SHEET ===== */}
      {isAddSheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsAddSheetOpen(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-6 animate-slide-up">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

            <h3 className="text-lg font-bold text-gray-900 mb-4">Adicionar etapa</h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => addStep('question')}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="text-2xl mb-2">❓</div>
                <div className="font-semibold text-gray-900">Pergunta</div>
                <div className="text-xs text-gray-600">Múltipla escolha</div>
              </button>

              <button
                onClick={() => addStep('result')}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-semibold text-gray-900">Resultado</div>
                <div className="text-xs text-gray-600">Outcome do quiz</div>
              </button>

              <button
                onClick={() => addStep('lead-gen')}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="text-2xl mb-2">📧</div>
                <div className="font-semibold text-gray-900">Captura</div>
                <div className="text-xs text-gray-600">Coletar dados</div>
              </button>

              <button
                onClick={() => addStep('intro')}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="text-2xl mb-2">👋</div>
                <div className="font-semibold text-gray-900">Intro</div>
                <div className="text-xs text-gray-600">Página inicial</div>
              </button>
            </div>

            <button
              onClick={() => setIsAddSheetOpen(false)}
              className="w-full mt-4 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
