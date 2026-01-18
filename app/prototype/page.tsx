'use client';

import { useState } from 'react';

// ============================================
// BLOCK-BASED ARCHITECTURE
// Each step is composed of reorderable blocks
// ============================================

type StepType = 'intro' | 'question' | 'lead-gen' | 'promo' | 'result';
type BlockType = 'text' | 'media' | 'options' | 'fields' | 'price' | 'button' | 'banner' | 'list';

// Block configurations
interface TextConfig {
  title?: string;
  description?: string;
}

interface MediaConfig {
  type: 'image' | 'video';
  url?: string;
}

interface OptionsConfig {
  items: string[];
  selectionType: 'single' | 'multiple';
}

interface FieldItem {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'textarea';
  placeholder?: string;
  required?: boolean;
}

interface FieldsConfig {
  items: FieldItem[];
}

interface PriceConfig {
  productTitle: string;
  value: string;
  prefix?: string;
  suffix?: string;
  highlight?: boolean;
  highlightText?: string;
}

interface ButtonConfig {
  text: string;
  action: 'url' | 'next_step';
  url?: string;
}

interface BannerConfig {
  urgency: 'info' | 'warning' | 'danger';
  text: string;
  emoji?: string;
}

interface ListItem {
  id: string;
  emoji?: string;
  text: string;
}

interface ListConfig {
  items: ListItem[];
}

type BlockConfig = TextConfig | MediaConfig | OptionsConfig | FieldsConfig | PriceConfig | ButtonConfig | BannerConfig | ListConfig;

interface Block {
  id: string;
  type: BlockType;
  enabled: boolean;
  config: BlockConfig;
}

interface StepSettings {
  showProgress: boolean;
  allowBack: boolean;
}

interface Step {
  id: string;
  type: StepType;
  label: string;
  isFixed?: boolean;
  blocks: Block[];
  settings: StepSettings;
}

interface Outcome {
  id: string;
  name: string;
  blocks: Block[];
}

// ============================================
// HELPERS
// ============================================

const createBlock = (type: BlockType, config: BlockConfig, enabled = true): Block => ({
  id: `block-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  enabled,
  config,
});

const blockIcons: Record<BlockType, string> = {
  text: '📝',
  media: '🖼',
  options: '☰',
  fields: '📋',
  price: '💰',
  button: '🔘',
  banner: '⚡',
  list: '📌',
};

const blockLabels: Record<BlockType, string> = {
  text: 'Texto',
  media: 'Mídia',
  options: 'Opções',
  fields: 'Campos',
  price: 'Preço',
  button: 'Botão',
  banner: 'Banner',
  list: 'Lista',
};

const availableBlocksPerType: Record<StepType, BlockType[]> = {
  intro: ['text', 'media', 'fields', 'button'],
  question: ['text', 'media', 'options'],
  'lead-gen': ['text', 'media', 'fields', 'button'],
  promo: ['banner', 'text', 'media', 'list', 'button'],
  result: ['text', 'media', 'price', 'list', 'button'],
};

// ============================================
// INITIAL DATA
// ============================================

const initialOutcomes: Outcome[] = [
  {
    id: 'o1',
    name: 'Pele Radiante',
    blocks: [
      createBlock('text', { title: 'Pele Radiante', description: 'O resultado ideal para você!' } as TextConfig),
      createBlock('media', { type: 'image', url: '' } as MediaConfig, false),
      createBlock('price', { productTitle: 'Kit Hidratação', value: 'R$ 149,90', prefix: '20% off', suffix: 'à vista', highlight: true, highlightText: 'RECOMENDADO' } as PriceConfig),
      createBlock('button', { text: 'Comprar agora', action: 'url', url: 'https://exemplo.com/kit' } as ButtonConfig),
    ]
  },
  {
    id: 'o2',
    name: 'Pele Equilibrada',
    blocks: [
      createBlock('text', { title: 'Pele Equilibrada', description: 'Controle perfeito!' } as TextConfig),
      createBlock('media', { type: 'image', url: '' } as MediaConfig, false),
      createBlock('price', { productTitle: 'Kit Controle', value: 'R$ 99,90', suffix: 'à vista', highlight: false } as PriceConfig),
      createBlock('button', { text: 'Ver produto', action: 'url', url: '' } as ButtonConfig),
    ]
  },
];

const defaultStepSettings: StepSettings = {
  showProgress: true,
  allowBack: true,
};

const initialSteps: Step[] = [
  {
    id: 'intro',
    type: 'intro',
    label: 'Intro',
    isFixed: true,
    blocks: [
      createBlock('text', { title: 'Bem-vindo ao Quiz!', description: 'Descubra qual produto é ideal para você' } as TextConfig),
      createBlock('media', { type: 'image', url: '' } as MediaConfig, false),
      createBlock('button', { text: 'Começar', action: 'next_step' } as ButtonConfig),
    ],
    settings: { showProgress: true, allowBack: false }, // Intro doesn't allow back
  },
  {
    id: 'q1',
    type: 'question',
    label: 'P1',
    blocks: [
      createBlock('text', { title: 'Qual seu tipo de pele?' } as TextConfig),
      createBlock('media', { type: 'image', url: '' } as MediaConfig, false),
      createBlock('options', { items: ['Seca', 'Oleosa', 'Mista', 'Normal'], selectionType: 'single' } as OptionsConfig),
    ],
    settings: { ...defaultStepSettings },
  },
  {
    id: 'q2',
    type: 'question',
    label: 'P2',
    blocks: [
      createBlock('text', { title: 'Com que frequência você hidrata?' } as TextConfig),
      createBlock('media', { type: 'image', url: '' } as MediaConfig, false),
      createBlock('options', { items: ['Diariamente', 'Às vezes', 'Raramente'], selectionType: 'single' } as OptionsConfig),
    ],
    settings: { ...defaultStepSettings },
  },
  {
    id: 'lead',
    type: 'lead-gen',
    label: 'Captura',
    blocks: [
      createBlock('text', { title: 'Quase lá!', description: 'Deixe seus dados para ver o resultado' } as TextConfig),
      createBlock('fields', { items: [
        { id: 'f1', label: 'Nome', type: 'text', placeholder: 'Seu nome', required: true },
        { id: 'f2', label: 'Email', type: 'email', placeholder: 'seu@email.com', required: true },
      ]} as FieldsConfig),
      createBlock('button', { text: 'Ver meu resultado', action: 'next_step' } as ButtonConfig),
    ],
    settings: { ...defaultStepSettings },
  },
  {
    id: 'result',
    type: 'result',
    label: 'Resultado',
    isFixed: true,
    blocks: [],
    settings: { showProgress: false, allowBack: false }, // Result doesn't show progress or back
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function PrototypePage() {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [outcomes, setOutcomes] = useState<Outcome[]>(initialOutcomes);
  const [activeStepId, setActiveStepId] = useState('intro');
  const [selectedOutcomeId, setSelectedOutcomeId] = useState('o1');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isAddStepSheetOpen, setIsAddStepSheetOpen] = useState(false);
  const [isAddBlockSheetOpen, setIsAddBlockSheetOpen] = useState(false);
  const [isBrandKitOpen, setIsBrandKitOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'preview' | 'edit' | 'chat'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [isEditingStepLabel, setIsEditingStepLabel] = useState(false);
  const [editingOutcomeName, setEditingOutcomeName] = useState(false);

  const activeStep = steps.find(s => s.id === activeStepId) || steps[0];
  const selectedOutcome = outcomes.find(o => o.id === selectedOutcomeId) || outcomes[0];
  const currentBlocks = activeStep.type === 'result' ? selectedOutcome.blocks : activeStep.blocks;
  const selectedBlock = currentBlocks.find(b => b.id === selectedBlockId) || null;

  // ============================================
  // HANDLERS
  // ============================================

  const handleStepChange = (stepId: string) => {
    setActiveStepId(stepId);
    setSelectedBlockId(null);
    setIsEditingStepLabel(false);
    setEditingOutcomeName(false);
  };

  const handleOutcomeChange = (outcomeId: string) => {
    setSelectedOutcomeId(outcomeId);
    setSelectedBlockId(null);
    setEditingOutcomeName(false);
  };

  const updateBlockConfig = (blockId: string, configUpdates: Partial<BlockConfig>) => {
    if (activeStep.type === 'result') {
      setOutcomes(outcomes.map(o => {
        if (o.id !== selectedOutcomeId) return o;
        return {
          ...o,
          blocks: o.blocks.map(b => b.id === blockId ? { ...b, config: { ...b.config, ...configUpdates } } : b)
        };
      }));
    } else {
      setSteps(steps.map(s => {
        if (s.id !== activeStepId) return s;
        return {
          ...s,
          blocks: s.blocks.map(b => b.id === blockId ? { ...b, config: { ...b.config, ...configUpdates } } : b)
        };
      }));
    }
  };

  const toggleBlock = (blockId: string) => {
    const block = currentBlocks.find(b => b.id === blockId);
    if (!block) return;

    if (activeStep.type === 'result') {
      setOutcomes(outcomes.map(o => {
        if (o.id !== selectedOutcomeId) return o;
        return {
          ...o,
          blocks: o.blocks.map(b => b.id === blockId ? { ...b, enabled: !b.enabled } : b)
        };
      }));
    } else {
      setSteps(steps.map(s => {
        if (s.id !== activeStepId) return s;
        return {
          ...s,
          blocks: s.blocks.map(b => b.id === blockId ? { ...b, enabled: !b.enabled } : b)
        };
      }));
    }
  };

  const addBlock = (type: BlockType) => {
    const defaultConfigs: Record<BlockType, BlockConfig> = {
      text: { title: '', description: '' } as TextConfig,
      media: { type: 'image', url: '' } as MediaConfig,
      options: { items: ['Opção 1', 'Opção 2'], selectionType: 'single' } as OptionsConfig,
      fields: { items: [{ id: `f-${Date.now()}`, label: 'Novo campo', type: 'text', placeholder: '', required: false }] } as FieldsConfig,
      price: { productTitle: 'Produto', value: 'R$ 0,00', highlight: false } as PriceConfig,
      button: { text: 'Continuar', action: 'next_step' } as ButtonConfig,
      banner: { urgency: 'info', text: 'Mensagem importante', emoji: '💡' } as BannerConfig,
      list: { items: [{ id: `l-${Date.now()}`, emoji: '✓', text: 'Item da lista' }] } as ListConfig,
    };

    const newBlock = createBlock(type, defaultConfigs[type]);

    if (activeStep.type === 'result') {
      setOutcomes(outcomes.map(o => {
        if (o.id !== selectedOutcomeId) return o;
        return { ...o, blocks: [...o.blocks, newBlock] };
      }));
    } else {
      setSteps(steps.map(s => {
        if (s.id !== activeStepId) return s;
        return { ...s, blocks: [...s.blocks, newBlock] };
      }));
    }
    setIsAddBlockSheetOpen(false);
    setSelectedBlockId(newBlock.id);
  };

  const removeBlock = (blockId: string) => {
    if (activeStep.type === 'result') {
      setOutcomes(outcomes.map(o => {
        if (o.id !== selectedOutcomeId) return o;
        return { ...o, blocks: o.blocks.filter(b => b.id !== blockId) };
      }));
    } else {
      setSteps(steps.map(s => {
        if (s.id !== activeStepId) return s;
        return { ...s, blocks: s.blocks.filter(b => b.id !== blockId) };
      }));
    }
    setSelectedBlockId(null);
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const blocks = [...currentBlocks];
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];

    if (activeStep.type === 'result') {
      setOutcomes(outcomes.map(o => o.id === selectedOutcomeId ? { ...o, blocks } : o));
    } else {
      setSteps(steps.map(s => s.id === activeStepId ? { ...s, blocks } : s));
    }
  };

  const addStep = (type: StepType) => {
    const questionCount = steps.filter(s => s.type === 'question').length;
    const promoCount = steps.filter(s => s.type === 'promo').length;
    const captureCount = steps.filter(s => s.type === 'lead-gen').length;

    const labels: Record<StepType, string> = {
      intro: 'Intro',
      question: `P${questionCount + 1}`,
      'lead-gen': captureCount > 0 ? `Captura${captureCount + 1}` : 'Captura',
      promo: promoCount > 0 ? `Promo${promoCount + 1}` : 'Promo',
      result: 'Resultado',
    };

    const defaultBlocks: Record<StepType, Block[]> = {
      intro: [
        createBlock('text', { title: 'Novo título', description: '' } as TextConfig),
        createBlock('button', { text: 'Começar', action: 'next_step' } as ButtonConfig),
      ],
      question: [
        createBlock('text', { title: 'Nova pergunta?' } as TextConfig),
        createBlock('options', { items: ['Opção 1', 'Opção 2'], selectionType: 'single' } as OptionsConfig),
      ],
      'lead-gen': [
        createBlock('text', { title: 'Seus dados', description: 'Preencha para continuar' } as TextConfig),
        createBlock('fields', { items: [
          { id: `f-${Date.now()}-1`, label: 'Email', type: 'email', placeholder: 'seu@email.com', required: true },
        ]} as FieldsConfig),
        createBlock('button', { text: 'Continuar', action: 'next_step' } as ButtonConfig),
      ],
      promo: [
        createBlock('banner', { urgency: 'warning', text: 'Oferta especial!', emoji: '🔥' } as BannerConfig),
        createBlock('text', { title: 'Oferta Especial!', description: 'Aproveite essa oportunidade' } as TextConfig),
        createBlock('button', { text: 'Quero aproveitar', action: 'url', url: '' } as ButtonConfig),
      ],
      result: [],
    };

    const newStep: Step = {
      id: `${type}-${Date.now()}`,
      type,
      label: labels[type],
      blocks: defaultBlocks[type],
      settings: { ...defaultStepSettings },
    };

    const resultIndex = steps.findIndex(s => s.type === 'result');
    const newSteps = [...steps];
    newSteps.splice(resultIndex, 0, newStep);

    setSteps(newSteps);
    setActiveStepId(newStep.id);
    setIsAddStepSheetOpen(false);
  };

  const deleteStep = (id: string) => {
    const stepToDelete = steps.find(s => s.id === id);
    if (!stepToDelete || stepToDelete.isFixed) return;

    const newSteps = steps.filter(s => s.id !== id);
    setSteps(newSteps);
    if (activeStepId === id) {
      setActiveStepId(newSteps[0].id);
    }
  };

  const addOutcome = () => {
    const newOutcome: Outcome = {
      id: `o-${Date.now()}`,
      name: `Resultado ${outcomes.length + 1}`,
      blocks: [
        createBlock('header', { title: 'Novo Resultado', subtitle: 'Descrição do resultado' } as HeaderConfig),
        createBlock('button', { text: 'Ver mais', action: 'url', url: '' } as ButtonConfig),
      ]
    };
    setOutcomes([...outcomes, newOutcome]);
    setSelectedOutcomeId(newOutcome.id);
  };

  const deleteOutcome = (id: string) => {
    if (outcomes.length <= 1) return;
    const newOutcomes = outcomes.filter(o => o.id !== id);
    setOutcomes(newOutcomes);
    if (selectedOutcomeId === id) {
      setSelectedOutcomeId(newOutcomes[0].id);
    }
  };

  const updateStepLabel = (newLabel: string) => {
    if (!newLabel.trim()) return;
    setSteps(steps.map(s => s.id === activeStepId ? { ...s, label: newLabel.trim() } : s));
    setIsEditingStepLabel(false);
  };

  const updateOutcomeName = (newName: string) => {
    if (!newName.trim()) return;
    setOutcomes(outcomes.map(o => o.id === selectedOutcomeId ? { ...o, name: newName.trim() } : o));
    setEditingOutcomeName(false);
  };

  const getStepDisplayName = (step: Step): string => {
    // For questions, find the index among all questions
    if (step.type === 'question') {
      const questionSteps = steps.filter(s => s.type === 'question');
      const index = questionSteps.findIndex(s => s.id === step.id);
      return `Pergunta ${index + 1}`;
    }

    // For other types, use proper Portuguese names
    const typeLabels: Record<StepType, string> = {
      intro: 'Introdução',
      question: 'Pergunta',
      'lead-gen': 'Captura',
      promo: 'Promocional',
      result: 'Resultado',
    };
    return typeLabels[step.type];
  };

  const updateStepSettings = (settingKey: keyof StepSettings, value: boolean) => {
    setSteps(steps.map(s =>
      s.id === activeStepId
        ? { ...s, settings: { ...s.settings, [settingKey]: value } }
        : s
    ));
  };

  // ============================================
  // RENDER BLOCK IN PREVIEW
  // ============================================

  const renderBlockPreview = (block: Block) => {
    if (!block.enabled) return null;

    const isSelected = selectedBlockId === block.id;
    const baseClasses = `cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 rounded-lg' : 'hover:bg-gray-50 rounded-lg'}`;

    switch (block.type) {
      case 'text': {
        const config = block.config as TextConfig;
        const hasContent = config.title || config.description;
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={`${baseClasses} p-3 text-center`}>
            {config.title && <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>}
            {config.description && <p className="text-gray-600 mt-1">{config.description}</p>}
            {!hasContent && <p className="text-gray-400 italic">Clique para adicionar texto</p>}
          </div>
        );
      }

      case 'media': {
        const config = block.config as MediaConfig;
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={`${baseClasses} p-2`}>
            <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
              {config.url ? (
                config.type === 'video' ? (
                  <div className="text-gray-400">🎬 Vídeo</div>
                ) : (
                  <img src={config.url} alt="" className="w-full h-full object-cover rounded-lg" />
                )
              ) : (
                <span className="text-gray-400">{config.type === 'video' ? '🎬 Adicionar vídeo' : '🖼 Adicionar imagem'}</span>
              )}
            </div>
          </div>
        );
      }

      case 'options': {
        const config = block.config as OptionsConfig;
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={`${baseClasses} p-2 space-y-2`}>
            {config.items.map((item, i) => (
              <div key={i} className="p-3 border-2 border-gray-200 rounded-lg flex items-center gap-3 text-gray-800">
                {config.selectionType === 'multiple' && (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                )}
                {item}
              </div>
            ))}
          </div>
        );
      }

      case 'fields': {
        const config = block.config as FieldsConfig;
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={`${baseClasses} p-2 space-y-3`}>
            {config.items.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 resize-none" rows={3} readOnly />
                ) : (
                  <input type={field.type} placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" readOnly />
                )}
              </div>
            ))}
          </div>
        );
      }

      case 'price': {
        const config = block.config as PriceConfig;
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={`${baseClasses} p-2`}>
            <div className={`relative p-4 border-2 rounded-xl ${config.highlight ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-white' : 'border-gray-200'}`}>
              {config.highlight && config.highlightText && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                  {config.highlightText}
                </div>
              )}
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-1">{config.productTitle}</div>
                {config.prefix && <div className="text-green-600 text-sm font-semibold mb-1">{config.prefix}</div>}
                <div className="text-3xl font-bold text-gray-900">{config.value}</div>
                {config.suffix && <div className="text-gray-500 text-sm mt-1">{config.suffix}</div>}
              </div>
            </div>
          </div>
        );
      }

      case 'button': {
        const config = block.config as ButtonConfig;
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={`${baseClasses} p-2`}>
            <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium pointer-events-none">
              {config.text}
            </button>
          </div>
        );
      }

      case 'banner': {
        const config = block.config as BannerConfig;
        const urgencyColors = {
          info: 'bg-blue-100 text-blue-800',
          warning: 'bg-amber-100 text-amber-800',
          danger: 'bg-red-100 text-red-800',
        };
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={`${baseClasses}`}>
            <div className={`${urgencyColors[config.urgency]} text-center py-2 px-4 text-sm font-medium rounded-lg`}>
              {config.emoji && <span className="mr-2">{config.emoji}</span>}
              {config.text}
            </div>
          </div>
        );
      }

      case 'list': {
        const config = block.config as ListConfig;
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={`${baseClasses} p-2 space-y-2`}>
            {config.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-gray-700">
                <span>{item.emoji || '•'}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ============================================
  // RENDER BLOCK CONFIG IN PANEL
  // ============================================

  const renderBlockConfig = (block: Block) => {
    switch (block.type) {
      case 'text': {
        const config = block.config as TextConfig;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => updateBlockConfig(block.id, { title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
              <textarea
                value={config.description || ''}
                onChange={(e) => updateBlockConfig(block.id, { description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 resize-none"
                placeholder="Opcional"
                rows={3}
              />
            </div>
          </div>
        );
      }

      case 'media': {
        const config = block.config as MediaConfig;
        return (
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={block.enabled}
                onChange={() => toggleBlock(block.id)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Mostrar mídia</span>
                <p className="text-xs text-gray-500">Ativar ou desativar este bloco</p>
              </div>
            </label>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateBlockConfig(block.id, { type: 'image' })}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium ${config.type === 'image' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-100 text-gray-600 border-2 border-transparent'}`}
                >
                  🖼 Imagem
                </button>
                <button
                  onClick={() => updateBlockConfig(block.id, { type: 'video' })}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium ${config.type === 'video' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-100 text-gray-600 border-2 border-transparent'}`}
                >
                  🎬 Vídeo
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">URL</label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => updateBlockConfig(block.id, { url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                placeholder="https://..."
              />
            </div>
          </div>
        );
      }

      case 'options': {
        const config = block.config as OptionsConfig;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de seleção</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateBlockConfig(block.id, { selectionType: 'single' })}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium ${config.selectionType === 'single' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-100 text-gray-600 border-2 border-transparent'}`}
                >
                  ○ Única
                </button>
                <button
                  onClick={() => updateBlockConfig(block.id, { selectionType: 'multiple' })}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium ${config.selectionType === 'multiple' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-100 text-gray-600 border-2 border-transparent'}`}
                >
                  ☐ Múltipla
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Opções</label>
              <div className="space-y-2">
                {config.items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newItems = [...config.items];
                        newItems[i] = e.target.value;
                        updateBlockConfig(block.id, { items: newItems });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                    />
                    <button
                      onClick={() => {
                        const newItems = config.items.filter((_, idx) => idx !== i);
                        updateBlockConfig(block.id, { items: newItems });
                      }}
                      className="px-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateBlockConfig(block.id, { items: [...config.items, `Opção ${config.items.length + 1}`] })}
                  className="w-full py-2 border-2 border-dashed rounded text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500"
                >
                  + Adicionar opção
                </button>
              </div>
            </div>
          </div>
        );
      }

      case 'fields': {
        const config = block.config as FieldsConfig;
        return (
          <div className="space-y-3">
            {config.items.map((field, index) => (
              <div key={field.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-2 mb-2">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => {
                      const newItems = [...config.items];
                      newItems[index] = { ...newItems[index], label: e.target.value };
                      updateBlockConfig(block.id, { items: newItems });
                    }}
                    placeholder="Nome do campo"
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 font-medium"
                  />
                  <button
                    onClick={() => {
                      const newItems = config.items.filter((_, i) => i !== index);
                      updateBlockConfig(block.id, { items: newItems });
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    ×
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const newItems = [...config.items];
                      newItems[index] = { ...newItems[index], type: e.target.value as FieldItem['type'] };
                      updateBlockConfig(block.id, { items: newItems });
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 bg-white"
                  >
                    <option value="text">Texto</option>
                    <option value="email">Email</option>
                    <option value="phone">Telefone</option>
                    <option value="number">Número</option>
                    <option value="textarea">Texto longo</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required || false}
                      onChange={(e) => {
                        const newItems = [...config.items];
                        newItems[index] = { ...newItems[index], required: e.target.checked };
                        updateBlockConfig(block.id, { items: newItems });
                      }}
                      className="rounded border-gray-300"
                    />
                    Obrigatório
                  </label>
                </div>
                <input
                  type="text"
                  value={field.placeholder || ''}
                  onChange={(e) => {
                    const newItems = [...config.items];
                    newItems[index] = { ...newItems[index], placeholder: e.target.value };
                    updateBlockConfig(block.id, { items: newItems });
                  }}
                  placeholder="Placeholder"
                  className="w-full mt-2 px-2 py-1 border border-gray-200 rounded text-xs text-gray-600"
                />
              </div>
            ))}
            <button
              onClick={() => {
                const newField: FieldItem = { id: `f-${Date.now()}`, label: 'Novo campo', type: 'text', placeholder: '', required: false };
                updateBlockConfig(block.id, { items: [...config.items, newField] });
              }}
              className="w-full py-2 border-2 border-dashed rounded text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500"
            >
              + Adicionar campo
            </button>
          </div>
        );
      }

      case 'price': {
        const config = block.config as PriceConfig;
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Título do produto</label>
              <input
                type="text"
                value={config.productTitle}
                onChange={(e) => updateBlockConfig(block.id, { productTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Valor</label>
              <input
                type="text"
                value={config.value}
                onChange={(e) => updateBlockConfig(block.id, { value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                placeholder="R$ 0,00"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Prefixo</label>
                <input
                  type="text"
                  value={config.prefix || ''}
                  onChange={(e) => updateBlockConfig(block.id, { prefix: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                  placeholder="20% off"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sufixo</label>
                <input
                  type="text"
                  value={config.suffix || ''}
                  onChange={(e) => updateBlockConfig(block.id, { suffix: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                  placeholder="à vista"
                />
              </div>
            </div>
            <div className="border-t pt-3">
              <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.highlight || false}
                  onChange={(e) => updateBlockConfig(block.id, { highlight: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Destacar este preço
              </label>
              {config.highlight && (
                <input
                  type="text"
                  value={config.highlightText || ''}
                  onChange={(e) => updateBlockConfig(block.id, { highlightText: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                  placeholder="RECOMENDADO"
                />
              )}
            </div>
          </div>
        );
      }

      case 'button': {
        const config = block.config as ButtonConfig;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Texto do botão</label>
              <input
                type="text"
                value={config.text}
                onChange={(e) => updateBlockConfig(block.id, { text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ação</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateBlockConfig(block.id, { action: 'next_step' })}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium ${config.action === 'next_step' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-100 text-gray-600 border-2 border-transparent'}`}
                >
                  → Próxima
                </button>
                <button
                  onClick={() => updateBlockConfig(block.id, { action: 'url' })}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium ${config.action === 'url' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-100 text-gray-600 border-2 border-transparent'}`}
                >
                  🔗 URL
                </button>
              </div>
            </div>
            {config.action === 'url' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">URL de destino</label>
                <input
                  type="text"
                  value={config.url || ''}
                  onChange={(e) => updateBlockConfig(block.id, { url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
        );
      }

      case 'banner': {
        const config = block.config as BannerConfig;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Urgência</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateBlockConfig(block.id, { urgency: 'info' })}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium ${config.urgency === 'info' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-100 text-gray-600 border-2 border-transparent'}`}
                >
                  💡 Info
                </button>
                <button
                  onClick={() => updateBlockConfig(block.id, { urgency: 'warning' })}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium ${config.urgency === 'warning' ? 'bg-amber-100 text-amber-700 border-2 border-amber-300' : 'bg-gray-100 text-gray-600 border-2 border-transparent'}`}
                >
                  ⚠️ Alerta
                </button>
                <button
                  onClick={() => updateBlockConfig(block.id, { urgency: 'danger' })}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium ${config.urgency === 'danger' ? 'bg-red-100 text-red-700 border-2 border-red-300' : 'bg-gray-100 text-gray-600 border-2 border-transparent'}`}
                >
                  🔴 Urgente
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Emoji</label>
              <input
                type="text"
                value={config.emoji || ''}
                onChange={(e) => updateBlockConfig(block.id, { emoji: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                placeholder="⚡"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Texto</label>
              <input
                type="text"
                value={config.text}
                onChange={(e) => updateBlockConfig(block.id, { text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
              />
            </div>
          </div>
        );
      }

      case 'list': {
        const config = block.config as ListConfig;
        return (
          <div className="space-y-3">
            {config.items.map((item, index) => (
              <div key={item.id} className="flex gap-2">
                <input
                  type="text"
                  value={item.emoji || ''}
                  onChange={(e) => {
                    const newItems = [...config.items];
                    newItems[index] = { ...newItems[index], emoji: e.target.value };
                    updateBlockConfig(block.id, { items: newItems });
                  }}
                  className="w-12 px-2 py-2 border border-gray-300 rounded text-sm text-center"
                  placeholder="✓"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const newItems = [...config.items];
                    newItems[index] = { ...newItems[index], text: e.target.value };
                    updateBlockConfig(block.id, { items: newItems });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                />
                <button
                  onClick={() => {
                    const newItems = config.items.filter((_, i) => i !== index);
                    updateBlockConfig(block.id, { items: newItems });
                  }}
                  className="px-2 text-red-500 hover:bg-red-50 rounded"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newItem: ListItem = { id: `l-${Date.now()}`, emoji: '✓', text: 'Novo item' };
                updateBlockConfig(block.id, { items: [...config.items, newItem] });
              }}
              className="w-full py-2 border-2 border-dashed rounded text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500"
            >
              + Adicionar item
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* HEADER */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button className="text-gray-700 hover:text-gray-900 font-medium">← Voltar</button>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-900">Quiz Skincare</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsBrandKitOpen(true)} className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-medium">
            🎨 Brand Kit
          </button>
          <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Publicar</button>
        </div>
      </header>

      {/* STEP TABS */}
      <div className="h-12 bg-white border-b flex items-center justify-center px-4 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1">
          {steps.filter(s => s.type !== 'result').map((step) => (
            <div
              key={step.id}
              onClick={() => handleStepChange(step.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (step.isFixed) return;
                if (confirm(`Deletar "${step.label}"?`)) deleteStep(step.id);
              }}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-sm transition-all
                ${activeStepId === step.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100 text-gray-700'}
                ${step.isFixed ? 'border border-gray-200' : ''}
              `}
            >
              {!step.isFixed && <span className="text-gray-400 cursor-grab">⋮⋮</span>}
              <span>{step.label}</span>
              {step.isFixed && <span className="text-[10px] text-gray-400">●</span>}
            </div>
          ))}

          <button
            onClick={() => setIsAddStepSheetOpen(true)}
            className="mx-1 px-3 py-1.5 flex items-center gap-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            <span>+</span>
            <span>Etapa</span>
          </button>

          {steps.filter(s => s.type === 'result').map((step) => (
            <div
              key={step.id}
              onClick={() => handleStepChange(step.id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-sm border border-gray-200 transition-all
                ${activeStepId === step.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100 text-gray-700'}
              `}
            >
              <span>{step.label}</span>
              <span className="text-[10px] text-gray-400">●</span>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* CHAT PANEL */}
        <aside className={`hidden md:flex flex-col bg-white border-r transition-all duration-300 shrink-0 ${isChatExpanded ? 'w-72' : 'w-16'}`}>
          <div className="p-3 border-b flex items-center justify-between">
            {isChatExpanded ? (
              <>
                <span className="font-semibold text-gray-900 text-sm">AI Assistente</span>
                <button onClick={() => setIsChatExpanded(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </>
            ) : (
              <button onClick={() => setIsChatExpanded(true)} className="w-full flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600">
                <span className="text-xl">🤖</span>
                <span className="text-[10px]">Chat</span>
              </button>
            )}
          </div>
          {isChatExpanded && (
            <>
              <div className="flex-1 p-3 overflow-y-auto">
                <div className="text-xs text-gray-500 text-center">Inicie uma conversa com o assistente</div>
              </div>
              <div className="p-3 border-t">
                <input type="text" placeholder="Digite sua mensagem..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </>
          )}
        </aside>

        {/* PREVIEW */}
        <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
          {/* Floating controls */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-white rounded-lg shadow-md p-1">
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`p-2.5 rounded-md transition-all ${previewDevice === 'mobile' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`p-2.5 rounded-md transition-all ${previewDevice === 'desktop' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </button>
            {activeStep.type === 'result' && (
              <select
                value={selectedOutcomeId}
                onChange={(e) => handleOutcomeChange(e.target.value)}
                className="ml-1 text-sm border border-gray-200 rounded-md px-2 py-2 bg-white"
              >
                {outcomes.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => alert('Preview quiz - funcionalidade em breve')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 hover:bg-gray-50 rounded-lg shadow-md font-medium text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>Preview</span>
            </button>
          </div>

          {/* Preview content */}
          <div className="flex-1 flex items-center justify-center p-4 pt-20 overflow-auto">
            <div className={`bg-white rounded-2xl shadow-lg ${previewDevice === 'mobile' ? 'w-[375px]' : 'w-[600px]'} max-h-full overflow-y-auto`}>
              {/* Header with back button and progress bar */}
              {(activeStep.settings.showProgress || activeStep.settings.allowBack) && (
                <div className="px-6 pt-4 space-y-3">
                  {activeStep.settings.allowBack && (
                    <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                      <span>Voltar</span>
                    </button>
                  )}
                  {activeStep.settings.showProgress && (
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${((steps.findIndex(s => s.id === activeStepId) + 1) / steps.length) * 100}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="p-6 space-y-2">
                {currentBlocks.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    Nenhum bloco adicionado
                  </div>
                ) : (
                  currentBlocks.map(block => renderBlockPreview(block))
                )}
              </div>
            </div>
          </div>
        </main>

        {/* PROPERTIES PANEL */}
        <aside className="hidden md:flex flex-col w-80 bg-white border-l overflow-hidden">
          <div className="p-4 border-b">
            {activeStep.type === 'result' ? (
              /* For result step, show outcome name */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {editingOutcomeName ? (
                    <input
                      type="text"
                      defaultValue={selectedOutcome.name}
                      autoFocus
                      onBlur={(e) => updateOutcomeName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateOutcomeName(e.currentTarget.value);
                        if (e.key === 'Escape') setEditingOutcomeName(false);
                      }}
                      className="flex-1 font-semibold text-gray-900 px-1 py-0.5 border border-blue-300 rounded outline-none"
                    />
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-900">{selectedOutcome.name}</h3>
                      <button
                        onClick={() => setEditingOutcomeName(true)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Editar nome"
                      >
                        ✏️
                      </button>
                    </>
                  )}
                </div>
                {outcomes.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`Deletar resultado "${selectedOutcome.name}"?`)) {
                        deleteOutcome(selectedOutcome.id);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Deletar resultado"
                  >
                    🗑
                  </button>
                )}
              </div>
            ) : (
              /* For other steps, show step label */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isEditingStepLabel ? (
                    <input
                      type="text"
                      defaultValue={getStepDisplayName(activeStep)}
                      autoFocus
                      onBlur={(e) => updateStepLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateStepLabel(e.currentTarget.value);
                        if (e.key === 'Escape') setIsEditingStepLabel(false);
                      }}
                      className="flex-1 font-semibold text-gray-900 px-1 py-0.5 border border-blue-300 rounded outline-none"
                    />
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-900">{getStepDisplayName(activeStep)}</h3>
                      {!activeStep.isFixed && (
                        <button
                          onClick={() => setIsEditingStepLabel(true)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Editar nome"
                        >
                          ✏️
                        </button>
                      )}
                    </>
                  )}
                </div>
                {!activeStep.isFixed && (
                  <button
                    onClick={() => {
                      if (confirm(`Deletar "${getStepDisplayName(activeStep)}"?`)) {
                        deleteStep(activeStep.id);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Deletar etapa"
                  >
                    🗑
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedBlock ? (
              /* Block config view */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button onClick={() => setSelectedBlockId(null)} className="text-sm text-gray-600 hover:text-gray-900">
                    ← Voltar
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveBlock(selectedBlock.id, 'up')} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Mover para cima">↑</button>
                    <button onClick={() => moveBlock(selectedBlock.id, 'down')} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Mover para baixo">↓</button>
                    <button onClick={() => removeBlock(selectedBlock.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remover">🗑</button>
                  </div>
                </div>
                <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm text-blue-700 font-semibold">
                    {blockIcons[selectedBlock.type]} {blockLabels[selectedBlock.type]}
                  </span>
                </div>
                {renderBlockConfig(selectedBlock)}
              </div>
            ) : (
              /* Block list view with global settings */
              <div className="space-y-4">
                {/* Global step settings - only for middle steps (not intro or result) */}
                {activeStep.type !== 'result' && activeStep.type !== 'intro' && (
                  <div className="pb-4 border-b">
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Configurações da etapa</div>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <span className="text-sm text-gray-700">Mostrar progresso</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={activeStep.settings.showProgress}
                            onChange={(e) => updateStepSettings('showProgress', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-6 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors"></div>
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform"></div>
                        </div>
                      </label>
                      <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <span className="text-sm text-gray-700">Permitir voltar</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={activeStep.settings.allowBack}
                            onChange={(e) => updateStepSettings('allowBack', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-6 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors"></div>
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform"></div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {activeStep.type === 'result' && (
                  <div className="pb-4 border-b">
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Resultados</div>
                    <div className="space-y-2">
                      {outcomes.map(o => (
                        <div
                          key={o.id}
                          onClick={() => handleOutcomeChange(o.id)}
                          className={`p-2 rounded-lg cursor-pointer flex items-center justify-between ${selectedOutcomeId === o.id ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                        >
                          <span className="text-sm text-gray-800">{o.name}</span>
                          {outcomes.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); deleteOutcome(o.id); }} className="text-red-400 hover:text-red-600 text-sm">×</button>
                          )}
                        </div>
                      ))}
                      <button onClick={addOutcome} className="w-full py-2 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500">
                        + Adicionar resultado
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Blocos</div>
                {currentBlocks.map((block) => (
                  <div
                    key={block.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${block.enabled ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-50 opacity-50'}`}
                  >
                    <button onClick={() => moveBlock(block.id, 'up')} className="text-gray-400 hover:text-gray-600 text-xs">↑</button>
                    <button onClick={() => moveBlock(block.id, 'down')} className="text-gray-400 hover:text-gray-600 text-xs">↓</button>
                    <div onClick={() => setSelectedBlockId(block.id)} className="flex-1 flex items-center gap-2">
                      <span>{blockIcons[block.type]}</span>
                      <span className="text-sm text-gray-700">{blockLabels[block.type]}</span>
                    </div>
                    <button
                      onClick={() => toggleBlock(block.id)}
                      className={`text-xs px-2 py-0.5 rounded ${block.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                    >
                      {block.enabled ? 'ativo' : 'oculto'}
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setIsAddBlockSheetOpen(true)}
                  className="w-full py-2 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500"
                >
                  + Adicionar bloco
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ADD STEP SHEET */}
      {isAddStepSheetOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsAddStepSheetOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar etapa</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { type: 'question' as StepType, icon: '❓', label: 'Pergunta', desc: 'Múltipla escolha' },
                { type: 'lead-gen' as StepType, icon: '📋', label: 'Captura', desc: 'Formulário' },
                { type: 'promo' as StepType, icon: '🎁', label: 'Promocional', desc: 'Oferta especial' },
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => addStep(item.type)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 text-left transition-all"
                >
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <span className="font-semibold text-gray-900 block">{item.label}</span>
                  <span className="text-xs text-gray-500">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD BLOCK SHEET */}
      {isAddBlockSheetOpen && (() => {
        // Check which blocks should be disabled
        const hasOptionsBlock = currentBlocks.some(b => b.type === 'options');
        const allBlockTypes: BlockType[] = ['text', 'media', 'options', 'fields', 'price', 'button', 'banner', 'list'];

        const isBlockDisabled = (type: BlockType): boolean => {
          // Options: only one allowed per step (quiz logic conflict)
          if (type === 'options' && hasOptionsBlock) return true;
          return false;
        };

        const getDisabledReason = (type: BlockType): string | null => {
          if (type === 'options' && hasOptionsBlock) return 'Já existe um bloco de opções';
          return null;
        };

        return (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsAddBlockSheetOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar bloco</h3>
              <div className="grid grid-cols-4 gap-3">
                {allBlockTypes.map(type => {
                  const disabled = isBlockDisabled(type);
                  const reason = getDisabledReason(type);
                  return (
                    <button
                      key={type}
                      onClick={() => !disabled && addBlock(type)}
                      disabled={disabled}
                      title={reason || blockLabels[type]}
                      className={`p-3 border-2 rounded-xl text-center transition-all ${
                        disabled
                          ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <span className="text-xl mb-1 block">{blockIcons[type]}</span>
                      <span className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{blockLabels[type]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* BRAND KIT MODAL */}
      {isBrandKitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsBrandKitOpen(false)} />
          <div className="relative bg-white rounded-xl p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Brand Kit</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor primária</label>
                <input type="color" defaultValue="#2563eb" className="w-full h-10 rounded cursor-pointer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor secundária</label>
                <input type="color" defaultValue="#64748b" className="w-full h-10 rounded cursor-pointer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 text-sm cursor-pointer hover:border-blue-400">
                  Clique para fazer upload
                </div>
              </div>
            </div>
            <button onClick={() => setIsBrandKitOpen(false)} className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg font-medium">
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
