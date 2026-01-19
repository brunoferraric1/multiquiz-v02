'use client';

import { useState, useEffect } from 'react';

// ============================================
// BLOCK-BASED ARCHITECTURE
// Each step is composed of reorderable blocks
// ============================================

type StepType = 'intro' | 'question' | 'lead-gen' | 'promo' | 'result';
type BlockType = 'header' | 'text' | 'media' | 'options' | 'fields' | 'price' | 'button' | 'banner' | 'list';

// Block configurations
interface HeaderConfig {
  title?: string;
  description?: string;
}

interface TextConfig {
  content: string;
}

interface MediaConfig {
  type: 'image' | 'video';
  url?: string;
}

interface OptionItem {
  id: string;
  text: string;
  outcomeId?: string;
}

interface OptionsConfig {
  items: OptionItem[];
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

type BlockConfig = HeaderConfig | TextConfig | MediaConfig | OptionsConfig | FieldsConfig | PriceConfig | ButtonConfig | BannerConfig | ListConfig;

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
  header: '🏷️',
  text: '📝',
  media: '🖼',
  options: '🔘',
  fields: '📋',
  price: '💰',
  button: '👆',
  banner: '⚡',
  list: '📌',
};

const blockLabels: Record<BlockType, string> = {
  header: 'Cabeçalho',
  text: 'Texto',
  media: 'Mídia',
  options: 'Opções',
  fields: 'Campos',
  price: 'Preço',
  button: 'Botão',
  banner: 'Banner',
  list: 'Lista',
};

// Step type icons for sidebar
const stepTypeIcons: Record<StepType, React.ReactNode> = {
  intro: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="10 8 16 12 10 16 10 8"/>
    </svg>
  ),
  question: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  'lead-gen': (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  ),
  promo: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  result: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10"/>
      <path d="M18 20V4"/>
      <path d="M6 20v-4"/>
    </svg>
  ),
};

// ============================================
// INITIAL DATA
// ============================================

const initialOutcomes: Outcome[] = [];

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
      createBlock('header', { title: 'Bem-vindo ao Quiz!', description: 'Descubra qual produto é ideal para você' } as HeaderConfig),
      createBlock('media', { type: 'image', url: '' } as MediaConfig, false),
      createBlock('button', { text: 'Começar', action: 'next_step' } as ButtonConfig),
    ],
    settings: { showProgress: true, allowBack: false },
  },
  {
    id: 'q1',
    type: 'question',
    label: 'P1',
    blocks: [
      createBlock('header', { title: 'Qual seu tipo de pele?' } as HeaderConfig),
      createBlock('media', { type: 'image', url: '' } as MediaConfig, false),
      createBlock('options', { items: [
        { id: 'opt-1', text: 'Seca' },
        { id: 'opt-2', text: 'Oleosa' },
        { id: 'opt-3', text: 'Mista' },
        { id: 'opt-4', text: 'Normal' },
      ], selectionType: 'single' } as OptionsConfig),
    ],
    settings: { ...defaultStepSettings },
  },
  {
    id: 'q2',
    type: 'question',
    label: 'P2',
    blocks: [
      createBlock('header', { title: 'Com que frequência você hidrata?' } as HeaderConfig),
      createBlock('media', { type: 'image', url: '' } as MediaConfig, false),
      createBlock('options', { items: [
        { id: 'opt-5', text: 'Diariamente' },
        { id: 'opt-6', text: 'Às vezes' },
        { id: 'opt-7', text: 'Raramente' },
      ], selectionType: 'single' } as OptionsConfig),
    ],
    settings: { ...defaultStepSettings },
  },
  {
    id: 'lead',
    type: 'lead-gen',
    label: 'Captura',
    blocks: [
      createBlock('header', { title: 'Quase lá!', description: 'Deixe seus dados para ver o resultado' } as HeaderConfig),
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
    settings: { showProgress: false, allowBack: false },
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function PrototypePage() {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [outcomes, setOutcomes] = useState<Outcome[]>(initialOutcomes);
  const [activeStepId, setActiveStepId] = useState('intro');
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isAddStepSheetOpen, setIsAddStepSheetOpen] = useState(false);
  const [isAddBlockSheetOpen, setIsAddBlockSheetOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [isEditingStepLabel, setIsEditingStepLabel] = useState(false);
  const [editingOutcomeName, setEditingOutcomeName] = useState(false);
  const [activeHeaderTab, setActiveHeaderTab] = useState<'editar' | 'assistente' | 'tema' | 'relatorio' | 'config'>('editar');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Mobile-specific state
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBlockDrawerOpen, setIsBlockDrawerOpen] = useState(false);
  const [draggingStepId, setDraggingStepId] = useState<string | null>(null);
  const [dragOverStepId, setDragOverStepId] = useState<string | null>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeStep = steps.find(s => s.id === activeStepId) || steps[0];
  const selectedOutcome = selectedOutcomeId ? outcomes.find(o => o.id === selectedOutcomeId) : outcomes[0];
  const currentBlocks = activeStep.type === 'result' ? (selectedOutcome?.blocks || []) : activeStep.blocks;
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
    if (selectedBlockId && activeStep.type === 'result') {
      const currentOutcome = outcomes.find(o => o.id === selectedOutcomeId);
      const newOutcome = outcomes.find(o => o.id === outcomeId);

      if (currentOutcome && newOutcome) {
        const currentBlockIndex = currentOutcome.blocks.findIndex(b => b.id === selectedBlockId);
        const currentBlock = currentOutcome.blocks[currentBlockIndex];

        if (currentBlockIndex !== -1 && newOutcome.blocks[currentBlockIndex]?.type === currentBlock?.type) {
          setSelectedOutcomeId(outcomeId);
          setSelectedBlockId(newOutcome.blocks[currentBlockIndex].id);
          setEditingOutcomeName(false);
          return;
        }
      }
    }

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
          blocks: o.blocks.map(b => b.id === blockId ? { ...b, config: { ...b.config, ...configUpdates } as BlockConfig } : b)
        };
      }));
    } else {
      setSteps(steps.map(s => {
        if (s.id !== activeStepId) return s;
        return {
          ...s,
          blocks: s.blocks.map(b => b.id === blockId ? { ...b, config: { ...b.config, ...configUpdates } as BlockConfig } : b)
        };
      }));
    }
  };

  const toggleBlock = (blockId: string) => {
    const block = currentBlocks.find(b => b.id === blockId);
    if (!block) return;

    if (activeStep.type === 'result') {
      const blockIndex = selectedOutcome?.blocks.findIndex(b => b.id === blockId) ?? -1;
      if (blockIndex === -1) return;

      setOutcomes(outcomes.map(o => ({
        ...o,
        blocks: o.blocks.map((b, i) => i === blockIndex ? { ...b, enabled: !block.enabled } : b)
      })));
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

  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);

  const addBlock = (type: BlockType, atIndex?: number) => {
    const getButtonDefault = (): ButtonConfig => {
      if (activeStep.type === 'result') {
        return { text: 'Ver mais', action: 'url', url: '' };
      }
      return { text: 'Continuar', action: 'next_step' };
    };

    const defaultConfigs: Record<BlockType, BlockConfig> = {
      header: { title: 'Título', description: '' } as HeaderConfig,
      text: { content: '' } as TextConfig,
      media: { type: 'image', url: '' } as MediaConfig,
      options: { items: [
        { id: `opt-${Date.now()}-1`, text: 'Opção 1' },
        { id: `opt-${Date.now()}-2`, text: 'Opção 2' },
      ], selectionType: 'single' } as OptionsConfig,
      fields: { items: [{ id: `f-${Date.now()}`, label: 'Novo campo', type: 'text', placeholder: '', required: false }] } as FieldsConfig,
      price: { productTitle: 'Produto', value: 'R$ 0,00', highlight: false } as PriceConfig,
      button: getButtonDefault(),
      banner: { urgency: 'info', text: 'Mensagem importante', emoji: '💡' } as BannerConfig,
      list: { items: [{ id: `l-${Date.now()}`, emoji: '✓', text: 'Item da lista' }] } as ListConfig,
    };

    const insertBlock = (blocks: Block[], newBlock: Block, index?: number) => {
      if (index !== undefined && index >= 0 && index <= blocks.length) {
        const newBlocks = [...blocks];
        newBlocks.splice(index, 0, newBlock);
        return newBlocks;
      }
      return [...blocks, newBlock];
    };

    if (activeStep.type === 'result') {
      const newBlockIds: Record<string, string> = {};
      setOutcomes(outcomes.map(o => {
        const newBlock = createBlock(type, { ...defaultConfigs[type] });
        newBlockIds[o.id] = newBlock.id;
        return { ...o, blocks: insertBlock(o.blocks, newBlock, atIndex) };
      }));
      if (selectedOutcomeId && outcomes.length > 0) {
        setTimeout(() => {
          const updatedOutcome = outcomes.find(o => o.id === selectedOutcomeId);
          if (updatedOutcome) {
            const targetIndex = atIndex !== undefined ? atIndex : updatedOutcome.blocks.length - 1;
            if (updatedOutcome.blocks[targetIndex]) {
              setSelectedBlockId(updatedOutcome.blocks[targetIndex].id);
            }
          }
        }, 0);
      }
    } else {
      const newBlock = createBlock(type, defaultConfigs[type]);
      setSteps(steps.map(s => {
        if (s.id !== activeStepId) return s;
        return { ...s, blocks: insertBlock(s.blocks, newBlock, atIndex) };
      }));
      setSelectedBlockId(newBlock.id);
    }
    setIsAddBlockSheetOpen(false);
    setInsertAtIndex(null);
  };

  const removeBlock = (blockId: string) => {
    if (activeStep.type === 'result') {
      const blockIndex = selectedOutcome?.blocks.findIndex(b => b.id === blockId) ?? -1;
      if (blockIndex === -1) return;

      setOutcomes(outcomes.map(o => ({
        ...o,
        blocks: o.blocks.filter((_, i) => i !== blockIndex)
      })));
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

    if (activeStep.type === 'result') {
      setOutcomes(outcomes.map(o => {
        const outcomeBlocks = [...o.blocks];
        if (outcomeBlocks.length > Math.max(index, newIndex)) {
          [outcomeBlocks[index], outcomeBlocks[newIndex]] = [outcomeBlocks[newIndex], outcomeBlocks[index]];
        }
        return { ...o, blocks: outcomeBlocks };
      }));
    } else {
      [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
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
        createBlock('header', { title: 'Novo título', description: '' } as HeaderConfig),
        createBlock('button', { text: 'Começar', action: 'next_step' } as ButtonConfig),
      ],
      question: [
        createBlock('header', { title: 'Nova pergunta?' } as HeaderConfig),
        createBlock('options', { items: [
          { id: `opt-${Date.now()}-1`, text: 'Opção 1' },
          { id: `opt-${Date.now()}-2`, text: 'Opção 2' },
        ], selectionType: 'single' } as OptionsConfig),
      ],
      'lead-gen': [
        createBlock('header', { title: 'Seus dados', description: 'Preencha para continuar' } as HeaderConfig),
        createBlock('fields', { items: [
          { id: `f-${Date.now()}-1`, label: 'Email', type: 'email', placeholder: 'seu@email.com', required: true },
        ]} as FieldsConfig),
        createBlock('button', { text: 'Continuar', action: 'next_step' } as ButtonConfig),
      ],
      promo: [
        createBlock('banner', { urgency: 'warning', text: 'Oferta especial!', emoji: '🔥' } as BannerConfig),
        createBlock('header', { title: 'Oferta Especial!', description: 'Aproveite essa oportunidade' } as HeaderConfig),
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
    const existingOutcome = outcomes[0];
    let newBlocks: Block[];

    if (existingOutcome) {
      newBlocks = existingOutcome.blocks.map(block => {
        const newBlock = createBlock(block.type, { ...block.config }, block.enabled);
        if (block.type === 'header') {
          (newBlock.config as HeaderConfig).title = '';
          (newBlock.config as HeaderConfig).description = '';
        } else if (block.type === 'text') {
          (newBlock.config as TextConfig).content = '';
        } else if (block.type === 'media') {
          (newBlock.config as MediaConfig).url = '';
        } else if (block.type === 'button') {
          (newBlock.config as ButtonConfig).text = 'Ver mais';
        }
        return newBlock;
      });
    } else {
      newBlocks = [
        createBlock('header', { title: 'Título do Resultado', description: 'Descrição do resultado' } as HeaderConfig),
        createBlock('media', { type: 'image', url: '' } as MediaConfig, false),
        createBlock('button', { text: 'Ver mais', action: 'url', url: '' } as ButtonConfig),
      ];
    }

    const newOutcome: Outcome = {
      id: `o-${Date.now()}`,
      name: '',
      blocks: newBlocks
    };
    setOutcomes(prev => [...prev, newOutcome]);
    setSelectedOutcomeId(newOutcome.id);
    setSelectedBlockId(null);
    setEditingOutcomeName(true);
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
    if (step.type === 'question') {
      const questionSteps = steps.filter(s => s.type === 'question');
      const index = questionSteps.findIndex(s => s.id === step.id);
      return `Pergunta ${index + 1}`;
    }

    const typeLabels: Record<StepType, string> = {
      intro: 'Introdução',
      question: 'Pergunta',
      'lead-gen': 'Captura',
      promo: 'Promocional',
      result: 'Resultado',
    };
    return typeLabels[step.type];
  };

  // Get step title from first header block
  const getStepTitle = (step: Step): string => {
    const headerBlock = step.blocks.find(b => b.type === 'header' && b.enabled);
    if (headerBlock) {
      const config = headerBlock.config as HeaderConfig;
      if (config.title) return config.title;
    }
    return '';
  };

  // Get outcome title from first header block
  const getOutcomeTitle = (outcome: Outcome): string => {
    const headerBlock = outcome.blocks.find(b => b.type === 'header' && b.enabled);
    if (headerBlock) {
      const config = headerBlock.config as HeaderConfig;
      if (config.title) return config.title;
    }
    return '';
  };

  const updateStepSettings = (settingKey: keyof StepSettings, value: boolean) => {
    setSteps(steps.map(s =>
      s.id === activeStepId
        ? { ...s, settings: { ...s.settings, [settingKey]: value } }
        : s
    ));
  };

  const getOutcomeDisplayName = (outcome: Outcome, index: number): string => {
    return outcome.name.trim() || `Resultado ${index + 1}`;
  };

  // ============================================
  // RENDER BLOCK IN PREVIEW
  // ============================================

  const renderBlockPreview = (block: Block) => {
    if (!block.enabled) return null;

    const isSelected = selectedBlockId === block.id;

    const wrapperClass = (extra: string = '') =>
      `group relative cursor-pointer transition-all rounded-lg ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50 hover:ring-2 hover:ring-gray-300'} ${extra}`;

    const hoverLabel = (
      <div className={`absolute -top-3 right-2 flex items-center gap-0.5 rounded-lg overflow-hidden transition-opacity z-10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBlockId(block.id);
          }}
          className={`p-1.5 transition-colors ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
          title="Editar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeBlock(block.id);
          }}
          className={`p-1.5 transition-colors ${isSelected ? 'bg-blue-500 text-white hover:bg-red-500' : 'bg-gray-700 text-white hover:bg-red-500'}`}
          title="Excluir"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    );

    switch (block.type) {
      case 'header': {
        const config = block.config as HeaderConfig;
        const hasContent = config.title || config.description;
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={wrapperClass('p-3 text-center')}>
            {hoverLabel}
            {hasContent ? (
              <>
                {config.title && <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>}
                {config.description && <p className="text-gray-600 mt-1">{config.description}</p>}
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-400">Título</h2>
                <p className="text-gray-400 mt-1">Descrição (opcional)</p>
              </>
            )}
          </div>
        );
      }

      case 'text': {
        const config = block.config as TextConfig;
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={wrapperClass('p-3')}>
            {hoverLabel}
            {config.content ? (
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{config.content}</p>
            ) : (
              <p className="text-gray-400 text-sm italic">Clique para adicionar texto...</p>
            )}
          </div>
        );
      }

      case 'media': {
        const config = block.config as MediaConfig;
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={wrapperClass('p-2')}>
            {hoverLabel}
            {config.url ? (
              <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {config.type === 'video' ? (
                  <div className="text-gray-400">🎬 Vídeo</div>
                ) : (
                  <img src={config.url} alt="" className="w-full h-full object-cover rounded-lg" />
                )}
              </div>
            ) : (
              <div className="h-40 border-2 border-dashed border-amber-300 bg-amber-50 rounded-lg flex flex-col items-center justify-center">
                <span className="text-2xl mb-1 opacity-50">{config.type === 'video' ? '🎬' : '🖼'}</span>
                <p className="text-amber-600 text-sm">⚠️ {config.type === 'video' ? 'Vídeo' : 'Imagem'} não configurado</p>
              </div>
            )}
          </div>
        );
      }

      case 'options': {
        const config = block.config as OptionsConfig;
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={wrapperClass('p-2 space-y-2')}>
            {hoverLabel}
            {config.items.map((item) => {
              const linkedOutcome = item.outcomeId ? outcomes.find(o => o.id === item.outcomeId) : null;
              return (
                <div key={item.id} className="p-3 border-2 border-gray-200 rounded-lg flex items-center gap-3 text-gray-800">
                  {config.selectionType === 'multiple' && (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                  )}
                  <span className="flex-1">{item.text}</span>
                  {linkedOutcome && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      → {linkedOutcome.name || `Resultado ${outcomes.findIndex(o => o.id === item.outcomeId) + 1}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      }

      case 'fields': {
        const config = block.config as FieldsConfig;
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={wrapperClass('p-2 space-y-3')}>
            {hoverLabel}
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
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={wrapperClass('p-2')}>
            {hoverLabel}
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
        const hasText = config.text && config.text.trim();
        return (
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={wrapperClass('p-2')}>
            {hoverLabel}
            {hasText ? (
              <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium pointer-events-none">
                {config.text}
              </button>
            ) : (
              <div className="w-full py-3 border-2 border-dashed border-amber-300 bg-amber-50 rounded-lg text-center">
                <p className="text-amber-600 text-sm">⚠️ Botão sem texto</p>
              </div>
            )}
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
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={wrapperClass()}>
            {hoverLabel}
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
          <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className={wrapperClass('p-2 space-y-2')}>
            {hoverLabel}
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
      case 'header': {
        const config = block.config as HeaderConfig;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => updateBlockConfig(block.id, { title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                placeholder="Digite o título"
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

      case 'text': {
        const config = block.config as TextConfig;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Conteúdo</label>
              <textarea
                value={config.content || ''}
                onChange={(e) => updateBlockConfig(block.id, { content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 resize-none"
                placeholder="Digite o texto aqui..."
                rows={5}
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
              <div className="space-y-3">
                {config.items.map((item, i) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    {/* Option text input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const newItems = [...config.items];
                          newItems[i] = { ...newItems[i], text: e.target.value };
                          updateBlockConfig(block.id, { items: newItems });
                        }}
                        placeholder="Texto da opção"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                      />
                      <button
                        onClick={() => {
                          const newItems = config.items.filter((_, idx) => idx !== i);
                          updateBlockConfig(block.id, { items: newItems });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title="Remover opção"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                    {/* Outcome assignment */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 shrink-0">→ Resultado:</span>
                      {outcomes.length === 0 ? (
                        <button
                          onClick={() => {
                            // Navigate to result step and create an outcome
                            const resultStep = steps.find(s => s.type === 'result');
                            if (resultStep) {
                              handleStepChange(resultStep.id);
                              addOutcome();
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-dashed border-blue-300 rounded text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          Criar resultado
                        </button>
                      ) : (
                        <select
                          value={item.outcomeId || ''}
                          onChange={(e) => {
                            const newItems = [...config.items];
                            newItems[i] = { ...newItems[i], outcomeId: e.target.value || undefined };
                            updateBlockConfig(block.id, { items: newItems });
                          }}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 bg-white"
                        >
                          <option value="">Não vinculado</option>
                          {outcomes.map((o, idx) => (
                            <option key={o.id} value={o.id}>
                              {o.name || `Resultado ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newItem: OptionItem = {
                      id: `opt-${Date.now()}`,
                      text: `Opção ${config.items.length + 1}`,
                    };
                    updateBlockConfig(block.id, { items: [...config.items, newItem] });
                  }}
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
                <div className="flex gap-2 mb-2">
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const newItems = [...config.items];
                      newItems[index] = { ...newItems[index], type: e.target.value as FieldItem['type'] };
                      updateBlockConfig(block.id, { items: newItems });
                    }}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                  >
                    <option value="text">Texto</option>
                    <option value="email">Email</option>
                    <option value="phone">Telefone</option>
                    <option value="number">Número</option>
                    <option value="textarea">Área de texto</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={field.required}
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
                  placeholder="Placeholder..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-500"
                />
              </div>
            ))}
            <button
              onClick={() => {
                const newField: FieldItem = { id: `f-${Date.now()}`, label: '', type: 'text', placeholder: '', required: false };
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
          <div className="space-y-4">
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">Texto antes do preço</label>
              <input
                type="text"
                value={config.prefix || ''}
                onChange={(e) => updateBlockConfig(block.id, { prefix: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                placeholder="Ex: De R$ 299 por apenas"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Valor</label>
              <input
                type="text"
                value={config.value}
                onChange={(e) => updateBlockConfig(block.id, { value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                placeholder="R$ 99,90"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Texto após o preço</label>
              <input
                type="text"
                value={config.suffix || ''}
                onChange={(e) => updateBlockConfig(block.id, { suffix: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                placeholder="Ex: ou 12x de R$ 9,99"
              />
            </div>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={config.highlight || false}
                onChange={(e) => updateBlockConfig(block.id, { highlight: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-900">Destacar preço</span>
            </label>
            {config.highlight && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Texto do destaque</label>
                <input
                  type="text"
                  value={config.highlightText || ''}
                  onChange={(e) => updateBlockConfig(block.id, { highlightText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                  placeholder="Ex: MELHOR OFERTA"
                />
              </div>
            )}
          </div>
        );
      }

      case 'button': {
        const config = block.config as ButtonConfig;
        const isIntro = activeStep.type === 'intro';
        const isResult = activeStep.type === 'result';

        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Texto do botão</label>
              <input
                type="text"
                value={config.text}
                onChange={(e) => updateBlockConfig(block.id, { text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                placeholder="Ex: Continuar"
              />
            </div>

            {isIntro && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">→ Próxima etapa</span><br />
                  <span className="text-xs text-gray-500">O botão avança para a primeira pergunta</span>
                </p>
              </div>
            )}

            {isResult && (
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

            {!isIntro && !isResult && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ação do botão</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateBlockConfig(block.id, { action: 'next_step' })}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium ${config.action === 'next_step' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-100 text-gray-600 border-2 border-transparent'}`}
                    >
                      → Próxima etapa
                    </button>
                    <button
                      onClick={() => updateBlockConfig(block.id, { action: 'url' })}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium ${config.action === 'url' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-100 text-gray-600 border-2 border-transparent'}`}
                    >
                      🔗 Abrir URL
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
              </>
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
  // MOBILE STEP REORDER HANDLERS
  // ============================================

  const handleMobileStepDragStart = (stepId: string) => {
    setDraggingStepId(stepId);
  };

  const handleMobileStepDragOver = (stepId: string) => {
    if (draggingStepId && stepId !== draggingStepId) {
      setDragOverStepId(stepId);
    }
  };

  const handleMobileStepDragEnd = () => {
    if (draggingStepId && dragOverStepId) {
      const draggedStep = steps.find(s => s.id === draggingStepId);
      const targetStep = steps.find(s => s.id === dragOverStepId);

      if (draggedStep && targetStep && !draggedStep.isFixed && !targetStep.isFixed) {
        const newSteps = [...steps];
        const fromIndex = newSteps.findIndex(s => s.id === draggingStepId);
        const toIndex = newSteps.findIndex(s => s.id === dragOverStepId);

        if (fromIndex !== -1 && toIndex !== -1) {
          const [removed] = newSteps.splice(fromIndex, 1);
          newSteps.splice(toIndex, 0, removed);
          setSteps(newSteps);
        }
      }
    }
    setDraggingStepId(null);
    setDragOverStepId(null);
  };

  // Open drawer when block is selected on mobile
  const handleBlockSelect = (blockId: string | null) => {
    setSelectedBlockId(blockId);
    if (isMobile && blockId) {
      setIsBlockDrawerOpen(true);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  // MOBILE LAYOUT
  if (isMobile) {
    const regularSteps = steps.filter(s => s.type !== 'result');
    let stepCounter = 0;

    return (
      <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
        {/* MOBILE HEADER */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button className="p-2 -ml-2 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <span className="font-semibold text-gray-900">Quiz Skincare</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </header>

        {/* MOBILE MAIN CONTENT */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT STEP RAIL */}
          <div className="w-14 bg-white border-r flex flex-col py-2 shrink-0">
            {/* Regular steps */}
            <div className="flex-1 overflow-y-auto space-y-1 px-1.5">
              {regularSteps.map((step) => {
                stepCounter++;
                const isActive = activeStepId === step.id;
                const isDragging = draggingStepId === step.id;
                const isDragOver = dragOverStepId === step.id;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepChange(step.id)}
                    onTouchStart={() => !step.isFixed && handleMobileStepDragStart(step.id)}
                    onTouchMove={(e) => {
                      if (draggingStepId) {
                        const touch = e.touches[0];
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        const stepButton = element?.closest('[data-step-id]');
                        if (stepButton) {
                          handleMobileStepDragOver(stepButton.getAttribute('data-step-id') || '');
                        }
                      }
                    }}
                    onTouchEnd={handleMobileStepDragEnd}
                    data-step-id={step.id}
                    className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isDragOver
                        ? 'bg-blue-100 border-2 border-blue-400 border-dashed'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${isDragging ? 'opacity-50 scale-95' : ''}`}
                  >
                    <div className="scale-75">{stepTypeIcons[step.type]}</div>
                    <span className="text-[10px] font-medium -mt-0.5">{stepCounter}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="mx-2 my-2 border-t border-gray-200" />

            {/* Results section */}
            <div className="space-y-1 px-1.5">
              {outcomes.map((outcome, idx) => {
                const isActive = activeStepId === 'result' && selectedOutcomeId === outcome.id;
                return (
                  <button
                    key={outcome.id}
                    onClick={() => {
                      handleStepChange('result');
                      setSelectedOutcomeId(outcome.id);
                    }}
                    className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18"/>
                      <path d="M18 17V9"/>
                      <path d="M13 17V5"/>
                      <path d="M8 17v-3"/>
                    </svg>
                    <span className="text-[10px] font-medium -mt-0.5">R{idx + 1}</span>
                  </button>
                );
              })}
              {/* Add result button */}
              <button
                onClick={addOutcome}
                className="w-11 h-11 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            {/* Add step button at bottom */}
            <div className="mt-2 px-1.5">
              <button
                onClick={() => setIsAddStepSheetOpen(true)}
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-gray-900 text-white hover:bg-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* PREVIEW AREA */}
          <div
            className="flex-1 overflow-y-auto p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedBlockId(null);
                setIsBlockDrawerOpen(false);
              }
            }}
          >
            {/* Header row: Step name + Preview button */}
            <div className="max-w-sm mx-auto flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">
                {activeStep.type === 'result'
                  ? (selectedOutcome ? getOutcomeDisplayName(selectedOutcome, outcomes.indexOf(selectedOutcome)) : 'Resultado')
                  : activeStep.label}
              </span>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Preview
              </button>
            </div>

            {/* Preview Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto">
              {/* Header with progress */}
              {(activeStep.settings.showProgress || activeStep.settings.allowBack) && (
                <div className="px-4 pt-4 space-y-2">
                  {activeStep.settings.allowBack && (
                    <button className="flex items-center gap-1 text-gray-500 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                      Voltar
                    </button>
                  )}
                  {activeStep.settings.showProgress && (
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${((steps.findIndex(s => s.id === activeStepId) + 1) / steps.length) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Blocks */}
              <div className="p-4 space-y-2">
                {activeStep.type === 'result' && outcomes.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                    <div className="text-3xl mb-2 opacity-50">🎯</div>
                    <p className="text-sm text-gray-500 mb-3">Nenhum resultado criado</p>
                    <button
                      onClick={addOutcome}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium"
                    >
                      + Criar resultado
                    </button>
                  </div>
                ) : currentBlocks.length === 0 ? (
                  <div className="text-center text-gray-400 py-6 text-sm">
                    Nenhum bloco
                  </div>
                ) : (
                  currentBlocks.map((block) => (
                    <div
                      key={block.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlockSelect(block.id);
                      }}
                      className={`relative rounded-lg transition-all cursor-pointer ${
                        selectedBlockId === block.id
                          ? 'ring-2 ring-blue-500 ring-offset-2'
                          : 'hover:ring-2 hover:ring-gray-300'
                      }`}
                    >
                      {renderBlockPreview(block)}
                    </div>
                  ))
                )}

                {/* Add block button - inside card */}
                <button
                  onClick={() => setIsAddBlockSheetOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span className="text-sm">Adicionar bloco</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI FAB */}
        <button
          onClick={() => setIsChatExpanded(true)}
          className="fixed bottom-6 right-4 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 z-30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>

        {/* MOBILE OVERFLOW MENU */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute top-14 right-4 bg-white rounded-xl shadow-xl overflow-hidden min-w-[200px] animate-in fade-in slide-in-from-top-2">
              {[
                { label: 'Publicar', icon: '🚀' },
                { label: 'Preview', icon: '▶️' },
                { label: 'Tema', icon: '🎨' },
                { label: 'Relatório', icon: '📊' },
                { label: 'Configurações', icon: '⚙️' },
                { label: 'Deletar', icon: '🗑️', danger: true },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                    item.danger ? 'text-red-600' : 'text-gray-700'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MOBILE BLOCK EDIT DRAWER */}
        {isBlockDrawerOpen && selectedBlock && (
          <div className="fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => {
                setIsBlockDrawerOpen(false);
                setSelectedBlockId(null);
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-hidden animate-in slide-in-from-bottom">
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{blockIcons[selectedBlock.type]}</span>
                  <span className="font-semibold text-gray-900">{blockLabels[selectedBlock.type]}</span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Move up */}
                  <button
                    onClick={() => {
                      const blocks = activeStep.type === 'result' ? selectedOutcome?.blocks : activeStep.blocks;
                      if (blocks) {
                        const idx = blocks.findIndex(b => b.id === selectedBlockId);
                        if (idx > 0) moveBlock(selectedBlockId!, 'up');
                      }
                    }}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 15l-6-6-6 6"/>
                    </svg>
                  </button>
                  {/* Move down */}
                  <button
                    onClick={() => {
                      const blocks = activeStep.type === 'result' ? selectedOutcome?.blocks : activeStep.blocks;
                      if (blocks) {
                        const idx = blocks.findIndex(b => b.id === selectedBlockId);
                        if (idx < blocks.length - 1) moveBlock(selectedBlockId!, 'down');
                      }
                    }}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => {
                      removeBlock(selectedBlockId!);
                      setIsBlockDrawerOpen(false);
                      setSelectedBlockId(null);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Drawer content - block config */}
              <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-4">
                {renderBlockConfig(selectedBlock)}
              </div>
            </div>
          </div>
        )}

        {/* MOBILE AI CHAT EXPANDED */}
        {isChatExpanded && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Assistente IA</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Beta</span>
              </div>
              <button
                onClick={() => setIsChatExpanded(false)}
                className="p-2 text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex justify-end">
                <div className="bg-gray-100 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%]">
                  <p className="text-sm text-gray-800">Adicione mais perguntas para mim</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-purple-50 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[85%]">
                  <p className="text-sm text-gray-800">Que tipo de perguntas você gostaria? Por exemplo, perguntas sobre preferências, comportamentos ou dados demográficos?</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500 shrink-0">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Converse com o assistente..."
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none"
                />
                <button className="p-2 text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD STEP SHEET (reuse existing) */}
        {isAddStepSheetOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsAddStepSheetOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar etapa</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'question' as StepType, icon: '❓', label: 'Pergunta', desc: 'Múltipla escolha' },
                  { type: 'lead-gen' as StepType, icon: '📋', label: 'Captura', desc: 'Coletar dados' },
                  { type: 'promo' as StepType, icon: '🎁', label: 'Promocional', desc: 'Oferta especial' },
                ].map(item => (
                  <button
                    key={item.type}
                    onClick={() => addStep(item.type)}
                    className="p-4 border-2 border-gray-200 rounded-xl text-center hover:border-blue-400 hover:bg-blue-50"
                  >
                    <span className="text-2xl mb-1 block">{item.icon}</span>
                    <span className="font-medium text-gray-900 text-sm block">{item.label}</span>
                    <span className="text-xs text-gray-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ADD BLOCK SHEET (reuse existing) */}
        {isAddBlockSheetOpen && (() => {
          const hasOptionsBlock = currentBlocks.some(b => b.type === 'options');
          const allBlockTypes: BlockType[] = ['text', 'media', 'options', 'fields', 'price', 'button', 'banner', 'list'];
          const isBlockDisabled = (type: BlockType): boolean => type === 'options' && hasOptionsBlock;

          return (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/50" onClick={() => { setIsAddBlockSheetOpen(false); setInsertAtIndex(null); }} />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar bloco</h3>
                <div className="grid grid-cols-4 gap-2">
                  {allBlockTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => !isBlockDisabled(type) && addBlock(type, insertAtIndex ?? undefined)}
                      disabled={isBlockDisabled(type)}
                      className={`p-3 border-2 rounded-xl text-center transition-all ${
                        isBlockDisabled(type)
                          ? 'border-gray-100 bg-gray-50 opacity-50'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <span className="text-lg block">{blockIcons[type]}</span>
                      <span className="text-xs text-gray-700">{blockLabels[type]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // DESKTOP LAYOUT
  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* HEADER - Typeform inspired */}
      <header className="h-14 bg-white border-b flex items-center px-4 shrink-0">
        {/* Left: Back + Quiz name */}
        <div className="flex items-center gap-3 w-48">
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="font-semibold text-gray-900 truncate">Quiz Skincare</span>
        </div>

        {/* Center: Navigation tabs */}
        <div className="flex-1 flex items-center justify-center">
          <nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveHeaderTab('editar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeHeaderTab === 'editar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
            <button
              onClick={() => setActiveHeaderTab('assistente')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeHeaderTab === 'assistente' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Assistente IA
            </button>
            <button
              onClick={() => setActiveHeaderTab('tema')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeHeaderTab === 'tema' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
              </svg>
              Tema
            </button>
            <button
              onClick={() => setActiveHeaderTab('relatorio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeHeaderTab === 'relatorio' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/>
                <path d="M18 17V9"/>
                <path d="M13 17V5"/>
                <path d="M8 17v-3"/>
              </svg>
              Relatório
            </button>
            <button
              onClick={() => setActiveHeaderTab('config')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeHeaderTab === 'config' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Configurações
            </button>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-48 justify-end">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Preview
          </button>
          <button className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Publicar
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Steps list (Typeform style) */}
        <aside className="w-64 bg-white border-r flex flex-col overflow-hidden shrink-0">
          {/* Steps header */}
          <div className="p-3 border-b">
            <button
              onClick={() => setIsAddStepSheetOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              <span className="text-lg">+</span>
              Adicionar etapa
            </button>
          </div>

          {/* Steps list */}
          <div className="flex-1 overflow-y-auto">
            {/* Regular steps (not result) */}
            <div className="p-2 space-y-1">
              {(() => {
                let stepNumber = 0;
                return steps.filter(s => s.type !== 'result').map((step) => {
                  stepNumber++;
                  const stepTitle = getStepTitle(step);
                  const isActive = activeStepId === step.id;

                  return (
                    <div
                      key={step.id}
                      onClick={() => handleStepChange(step.id)}
                      className={`group flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                        isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      {/* Step number badge with icon */}
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium shrink-0 ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {stepTypeIcons[step.type]}
                      </div>
                      {/* Step info */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                          {stepNumber}. {step.label}
                        </div>
                        {stepTitle && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">{stepTitle}</div>
                        )}
                      </div>
                      {/* Delete button (not for fixed steps) */}
                      {!step.isFixed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Deletar esta etapa?')) deleteStep(step.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Separator */}
            <div className="mx-4 my-2 border-t" />

            {/* Results section */}
            <div className="p-2">
              <div className="flex items-center justify-between px-2.5 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resultados</span>
                <button
                  onClick={addOutcome}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>

              {/* Result step */}
              {steps.filter(s => s.type === 'result').map((step) => {
                const isActive = activeStepId === step.id;
                return (
                  <div key={step.id} className="space-y-1">
                    {outcomes.length === 0 ? (
                      <div
                        onClick={() => {
                          handleStepChange(step.id);
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                          isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {stepTypeIcons.result}
                        </div>
                        <span className={`text-sm ${isActive ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                          Nenhum resultado criado
                        </span>
                      </div>
                    ) : (
                      outcomes.map((outcome, index) => {
                        const isOutcomeActive = isActive && selectedOutcomeId === outcome.id;
                        const outcomeTitle = getOutcomeTitle(outcome);
                        return (
                          <div
                            key={outcome.id}
                            onClick={() => {
                              handleStepChange(step.id);
                              handleOutcomeChange(outcome.id);
                            }}
                            className={`group flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                              isOutcomeActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium shrink-0 ${
                              isOutcomeActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm truncate ${isOutcomeActive ? 'text-blue-700 font-medium' : 'text-gray-900'}`}>
                                {getOutcomeDisplayName(outcome, index)}
                              </div>
                              {outcomeTitle && (
                                <div className="text-xs text-gray-500 truncate mt-0.5">{outcomeTitle}</div>
                              )}
                            </div>
                            {outcomes.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Deletar "${getOutcomeDisplayName(outcome, index)}"?`)) {
                                    deleteOutcome(outcome.id);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* PREVIEW */}
        <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
          {/* Floating controls - device toggle */}
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
          </div>

          {/* Preview content */}
          <div
            className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedBlockId(null);
              }
            }}
          >
            {/* Current card - centered */}
            <div
              className="bg-white rounded-2xl shadow-lg max-h-[80vh] overflow-y-auto"
              style={{ width: previewDevice === 'mobile' ? 375 : 600 }}
            >
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
                {activeStep.type === 'result' && outcomes.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50/50">
                    <div className="text-4xl mb-3 opacity-50">🎯</div>
                    <h3 className="text-base font-medium text-gray-600 mb-1">Nenhum resultado criado</h3>
                    <p className="text-sm text-gray-400 mb-4">Crie telas de resultado para mostrar ao final do quiz</p>
                    <button
                      onClick={addOutcome}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      + Criar tela resultado
                    </button>
                  </div>
                ) : currentBlocks.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    Nenhum bloco adicionado
                  </div>
                ) : (
                  <>
                    {currentBlocks.map((block, index) => (
                      <div key={block.id}>
                        {renderBlockPreview(block)}
                        {/* Insertion point AFTER this block */}
                        <div
                          className="group/insert relative h-0.5 flex items-center justify-center cursor-pointer transition-all duration-200 hover:h-6 hover:my-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInsertAtIndex(index + 1);
                            setIsAddBlockSheetOpen(true);
                          }}
                        >
                          <div className="absolute inset-x-2 inset-y-0.5 border border-dashed border-gray-200 rounded bg-gray-50/30 opacity-0 group-hover/insert:opacity-100 transition-opacity" />
                          <button className="relative z-10 w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold opacity-0 group-hover/insert:opacity-100 transition-all hover:scale-110 shadow-sm flex items-center justify-center">
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Floating AI Chat - Typeform style */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            {isChatExpanded ? (
              /* Expanded chat */
              <div className="w-[500px] bg-white rounded-2xl shadow-xl border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </div>
                    <span className="font-medium text-gray-900 text-sm">Assistente IA</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Beta</span>
                  </div>
                  <button
                    onClick={() => setIsChatExpanded(false)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                </div>
                <div className="h-64 overflow-y-auto p-4 space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-gray-100 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
                      <p className="text-sm text-gray-800">Adicione mais perguntas para mim</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-purple-50 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%]">
                      <p className="text-sm text-gray-800">Que tipo de perguntas você gostaria? Por exemplo, perguntas sobre preferências, comportamentos ou dados demográficos?</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Converse com o assistente IA..."
                      className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none"
                    />
                    <button className="p-1.5 text-gray-400 hover:text-purple-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Collapsed chat input */
              <div
                onClick={() => setIsChatExpanded(true)}
                className="flex items-center gap-3 bg-white rounded-full shadow-lg border px-5 py-3 cursor-pointer hover:shadow-xl transition-shadow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span className="text-gray-500 text-sm">Converse com o assistente IA...</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
            )}
          </div>
        </main>

        {/* PROPERTIES PANEL */}
        <aside className="hidden md:flex flex-col w-80 bg-white border-l overflow-hidden">
          <div className="p-4 border-b">
            {activeStep.type === 'result' ? (
              selectedOutcome ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {editingOutcomeName ? (
                      <input
                        type="text"
                        defaultValue={selectedOutcome.name}
                        placeholder={`Resultado ${outcomes.findIndex(o => o.id === selectedOutcomeId) + 1}`}
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
                        <h3 className="font-semibold text-gray-900 truncate">
                          {getOutcomeDisplayName(selectedOutcome, outcomes.findIndex(o => o.id === selectedOutcomeId))}
                        </h3>
                        <button
                          onClick={() => setEditingOutcomeName(true)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded shrink-0"
                          title="Editar nome"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  {outcomes.length > 1 && (
                    <button
                      onClick={() => {
                        const outcomeName = getOutcomeDisplayName(selectedOutcome, outcomes.findIndex(o => o.id === selectedOutcomeId));
                        if (confirm(`Deletar "${outcomeName}"?`)) {
                          deleteOutcome(selectedOutcome.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded shrink-0"
                      title="Deletar resultado"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <h3 className="font-semibold text-gray-900">Tela de resultados</h3>
              )
            ) : activeStep.type === 'intro' ? (
              <h3 className="font-semibold text-gray-900">Introdução</h3>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isEditingStepLabel ? (
                    <input
                      type="text"
                      defaultValue={activeStep.label}
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
                      <h3 className="font-semibold text-gray-900">{activeStep.label}</h3>
                      <button
                        onClick={() => setIsEditingStepLabel(true)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Editar nome"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Deletar "${activeStep.label}"?`)) {
                      deleteStep(activeStep.id);
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Deletar etapa"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
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
                    <button onClick={() => removeBlock(selectedBlock.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remover">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
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

                {/* Hide blocks section when no outcomes exist on result page */}
                {!(activeStep.type === 'result' && outcomes.length === 0) && (
                  <>
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
                  </>
                )}
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
        const hasOptionsBlock = currentBlocks.some(b => b.type === 'options');
        const allBlockTypes: BlockType[] = ['text', 'media', 'options', 'fields', 'price', 'button', 'banner', 'list'];

        const isBlockDisabled = (type: BlockType): boolean => {
          if (type === 'options' && hasOptionsBlock) return true;
          return false;
        };

        const getDisabledReason = (type: BlockType): string | null => {
          if (type === 'options' && hasOptionsBlock) return 'Já existe um bloco de opções';
          return null;
        };

        return (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => { setIsAddBlockSheetOpen(false); setInsertAtIndex(null); }} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar bloco</h3>
              <div className="grid grid-cols-4 gap-3">
                {allBlockTypes.map(type => {
                  const disabled = isBlockDisabled(type);
                  const reason = getDisabledReason(type);
                  return (
                    <button
                      key={type}
                      onClick={() => !disabled && addBlock(type, insertAtIndex ?? undefined)}
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
    </div>
  );
}
