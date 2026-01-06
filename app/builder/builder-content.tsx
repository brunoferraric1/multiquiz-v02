'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  AlertTriangle,
  Eye,
  ImageIcon,
  Lock,
  Palette,
  Plus,
  Rocket,
  Trash2,
  X,
  MessageSquare,
  MoreVertical,
  PenSquare,
  Contact as ContactIcon,
  Link2,
  MousePointerClick,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { useAutoSave } from '@/lib/hooks/use-auto-save';
import { cn, compressImage } from '@/lib/utils';
import type { BrandKit, BrandKitColors, BrandKitMode, Outcome, Question } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChatInterface } from '@/components/chat/chat-interface';
import { BuilderHeader } from '@/components/builder/builder-header';
import { SaveIndicator } from '@/components/builder/save-indicator';
import { EditQuestionModal } from '@/components/builder/edit-question-modal';
import { PublishSuccessModal } from '@/components/builder/publish-success-modal';
import { DrawerFooter } from '@/components/builder/drawer-footer';
import { UpgradeModal } from '@/components/upgrade-modal';
import { Upload } from '@/components/ui/upload';
import { LoadingCard } from '@/components/ui/loading-card';
import { LeadGenSheet } from '@/components/builder/lead-gen-sheet';
import { QuizPlayer } from '@/components/quiz/quiz-player';
import { QuizService } from '@/lib/services/quiz-service';
import { deleteBrandKit, getBrandKit, saveBrandKit } from '@/lib/services/brand-kit-service';
import { useSubscription, isPro } from '@/lib/services/subscription-service';
import {
  SidebarCard,
  SidebarCardActionTrigger,
} from '@/components/builder/sidebar-card';
import { SortableQuestionsList } from '@/components/builder/sortable-questions-list';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ActiveSheet =
  | { type: 'introduction' }
  | { type: 'outcome'; id: string }
  | { type: 'lead-gen' }
  | { type: 'brand-kit' };
type MobileViewMode = 'chat' | 'editor';

const fieldLabelClass = 'text-sm font-medium text-muted-foreground';
const fullHexColorRegex = /^#([0-9a-fA-F]{6})$/;
const shortHexColorRegex = /^#([0-9a-fA-F]{3})$/;
const DEFAULT_PRIMARY_COLOR = '#4F46E5';

function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (shortHexColorRegex.test(withHash)) {
    const hex = withHash.slice(1);
    return `#${hex.split('').map((char) => char + char).join('')}`;
  }
  return withHash;
}

function isValidHexColor(value: string): boolean {
  return fullHexColorRegex.test(value);
}

// UUID v4 generator with crypto.randomUUID fallback
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Stable stringify to avoid false positives from key order differences
function stableStringify(value: unknown): string {
  const seen = new WeakSet();

  const sortObject = (input: any): any => {
    if (input === null || typeof input !== 'object') return input;
    if (seen.has(input)) return input;
    seen.add(input);

    if (Array.isArray(input)) {
      return input.map(sortObject);
    }

    const sorted: Record<string, unknown> = {};
    Object.keys(input)
      .sort()
      .forEach((key) => {
        const val = (input as Record<string, unknown>)[key];
        if (val !== undefined) {
          sorted[key] = sortObject(val);
        }
      });
    return sorted;
  };

  return JSON.stringify(sortObject(value));
}

export default function BuilderContent({ isEditMode = false }: { isEditMode?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Store hooks - must be at top to be available for other hooks/refs
  const quiz = useQuizBuilderStore((state) => state.quiz);
  const updateQuizField = useQuizBuilderStore((state) => state.updateQuizField);
  const addQuestion = useQuizBuilderStore((state) => state.addQuestion);
  const updateQuestion = useQuizBuilderStore((state) => state.updateQuestion);
  const deleteQuestion = useQuizBuilderStore((state) => state.deleteQuestion);
  const addOutcome = useQuizBuilderStore((state) => state.addOutcome);
  const updateOutcome = useQuizBuilderStore((state) => state.updateOutcome);
  const deleteOutcome = useQuizBuilderStore((state) => state.deleteOutcome);
  const reorderQuestions = useQuizBuilderStore((state) => state.reorderQuestions);
  const publishedVersion = useQuizBuilderStore((state) => state.publishedVersion);
  const setPublishedVersion = useQuizBuilderStore((state) => state.setPublishedVersion);
  const loadPublishedVersion = useQuizBuilderStore((state) => state.loadPublishedVersion);
  const loadingSections = useQuizBuilderStore((state) => state.loadingSections);

  const [isPublishing, setIsPublishing] = useState(false);
  const searchParams = useSearchParams();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [outcomeFile, setOutcomeFile] = useState<File | null>(null);

  // Initialize from URL param if present
  const [isPreviewOpen, setIsPreviewOpen] = useState(() => {
    return searchParams.get('mode') === 'preview';
  });
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [brandKitDialogOpen, setBrandKitDialogOpen] = useState(false);
  const [brandKitDeleteDialogOpen, setBrandKitDeleteDialogOpen] = useState(false);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [brandKitName, setBrandKitName] = useState('');
  const [brandKitColors, setBrandKitColors] = useState<BrandKitColors>({
    primary: '',
    secondary: '',
    accent: '',
  });
  const [brandKitLogoFile, setBrandKitLogoFile] = useState<File | null>(null);
  const [brandKitLogoPreview, setBrandKitLogoPreview] = useState('');
  const [isBrandKitLoading, setIsBrandKitLoading] = useState(false);
  const [isBrandKitSaving, setIsBrandKitSaving] = useState(false);
  const [isBrandKitDeleting, setIsBrandKitDeleting] = useState(false);
  const [mobileView, setMobileView] = useState<MobileViewMode>('chat');
  const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false);
  const [ctaWarningOpen, setCtaWarningOpen] = useState(false);
  const [ctaWarningOutcomes, setCtaWarningOutcomes] = useState<Partial<Outcome>[]>([]);
  const [pendingPublishType, setPendingPublishType] = useState<'publish' | 'update' | null>(null);
  const pendingPublishResolveRef = useRef<(() => void) | null>(null);
  const pendingPublishRejectRef = useRef<((error?: Error) => void) | null>(null);
  const clearPendingPublishPromises = (shouldReject = false) => {
    if (shouldReject) {
      pendingPublishRejectRef.current?.();
    }
    pendingPublishResolveRef.current = null;
    pendingPublishRejectRef.current = null;
  };

  // Draft state for Introduction
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftCtaText, setDraftCtaText] = useState('');
  const [draftCoverImageUrl, setDraftCoverImageUrl] = useState('');

  // Draft state for Outcome
  const [draftOutcomeTitle, setDraftOutcomeTitle] = useState('');
  const [draftOutcomeDescription, setDraftOutcomeDescription] = useState('');
  const [draftOutcomeCtaText, setDraftOutcomeCtaText] = useState('');
  const [draftOutcomeCtaUrl, setDraftOutcomeCtaUrl] = useState('');
  const [draftOutcomeImageUrl, setDraftOutcomeImageUrl] = useState('');
  const [upgradeModalState, setUpgradeModalState] = useState<{ open: boolean; reason: 'draft-limit' | 'publish-limit' | 'brand-kit' }>({
    open: false,
    reason: 'draft-limit',
  });

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const hasShownOnboardingRef = useRef(false);
  // Track previous title to detect transition from default -> set
  const prevTitleRef = useRef(quiz.title);
  const onboardingStorageKey = useMemo(() => {
    return quiz.id ? `builder-onboarding-${quiz.id}` : null;
  }, [quiz.id]);

  const markOnboardingSeen = useCallback(() => {
    if (!onboardingStorageKey || typeof window === 'undefined') return;
    try {
      localStorage.setItem(onboardingStorageKey, 'true');
    } catch (error) {
      console.warn('[Onboarding] Failed to persist seen state', error);
    }
  }, [onboardingStorageKey]);

  const openUpgradeModal = useCallback((reason: 'draft-limit' | 'publish-limit' | 'brand-kit') => {
    setUpgradeModalState({ open: true, reason });
  }, []);

  const { forceSave, cancelPendingSave } = useAutoSave({
    userId: user?.uid,
    enabled: true,
    debounceMs: 30000,
    isNewQuiz: !isEditMode,
    onLimitError: (error) => {
      const errorCode = (error as any)?.code || (error as Error)?.message;
      if (errorCode === 'DRAFT_LIMIT_REACHED') {
        toast.error('Limite de rascunhos no plano gratuito');
        openUpgradeModal('draft-limit');
      }
    },
  });
  const { subscription, isLoading: isSubscriptionLoading } = useSubscription(user?.uid);
  const isProUser = isPro(subscription);
  const themeColorDefaults = useMemo<BrandKitColors>(() => {
    if (typeof window === 'undefined') {
      return { primary: '#000000', secondary: '#000000', accent: '#000000' };
    }

    const styles = getComputedStyle(document.documentElement);
    const getValue = (variable: string) => styles.getPropertyValue(variable).trim() || '#000000';

    return {
      primary: getValue('--color-primary'),
      secondary: getValue('--color-secondary'),
      accent: getValue('--color-accent'),
    };
  }, []);
  const brandKitColorFields = useMemo<Array<{ key: keyof BrandKitColors; label: string; helper: string }>>(
    () => [
      { key: 'primary', label: 'Cor do botão', helper: 'Botões, barra de progresso e seleção de respostas.' },
      { key: 'secondary', label: 'Cor dos cards', helper: 'Fundo dos cards e áreas de conteúdo. Também influencia o fundo dos campos.' },
      { key: 'accent', label: 'Cor do fundo', helper: 'Fundo da página do quiz.' },
    ],
    []
  );

  const resolvedUserName = useMemo(() => {
    const fromDisplayName = user?.displayName?.trim();
    const fromEmail = user?.email ? user.email.split('@')[0]?.trim() : '';
    const base = fromDisplayName || fromEmail || '';
    if (!base) return 'Criador';

    const cleaned = base.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) return 'Criador';

    const firstName = cleaned.split(' ')[0] || cleaned;
    const normalizedFirstName = firstName.charAt(0).toLocaleUpperCase('pt-BR') + firstName.slice(1);
    return normalizedFirstName;
  }, [user?.displayName, user?.email]);

  const brandKitMode: BrandKitMode = quiz.brandKitMode ?? 'default';
  const previewCloseButtonStyle = useMemo(() => {
    if (brandKitMode !== 'custom' || !brandKit?.colors?.primary) return undefined;
    const hex = brandKit.colors.primary.replace('#', '');
    if (hex.length !== 6) return undefined;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((channel) => Number.isNaN(channel))) return undefined;
    const toLinear = (channel: number) => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    const textColor = luminance > 0.6 ? '#0f172a' : '#f8fafc';
    return {
      backgroundColor: brandKit.colors.primary,
      color: textColor,
    };
  }, [brandKit?.colors?.primary, brandKitMode]);

  useEffect(() => {
    if (!user?.uid) {
      setBrandKit(null);
      return;
    }

    let isActive = true;
    setIsBrandKitLoading(true);

    getBrandKit(user.uid)
      .then((kit) => {
        if (!isActive) return;
        setBrandKit(kit);
      })
      .catch((error) => {
        if (!isActive) return;
        console.error('Error loading brand kit:', error);
        toast.error('Erro ao carregar kit da marca');
      })
      .finally(() => {
        if (!isActive) return;
        setIsBrandKitLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (brandKitMode !== 'custom' || !brandKit) return;
    if (quiz.primaryColor !== brandKit.colors.primary) {
      updateQuizField('primaryColor', brandKit.colors.primary);
    }
  }, [brandKit, brandKitMode, quiz.primaryColor, updateQuizField]);

  // Refs for sidebar sections (for auto-scroll)
  const introductionRef = useRef<HTMLElement>(null);
  const questionsRef = useRef<HTMLElement>(null);
  const outcomesRef = useRef<HTMLElement>(null);
  const leadGenRef = useRef<HTMLElement>(null);

  // Auto-scroll to loading sections
  useEffect(() => {
    // Find the first section that is loading and scroll to it
    let targetRef: React.RefObject<HTMLElement | null> | null = null;

    if (loadingSections.introduction) {
      targetRef = introductionRef;
    } else if (loadingSections.outcomes) {
      targetRef = outcomesRef;
    } else if (loadingSections.questions) {
      targetRef = questionsRef;
    } else if (loadingSections.leadGen) {
      targetRef = leadGenRef;
    }

    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loadingSections]);

  // Compute hasUnpublishedChanges
  // Explicitly depend on stringified questions/outcomes to detect nested changes
  const questionsJson = useMemo(() => JSON.stringify(quiz.questions), [quiz.questions]);
  const outcomesJson = useMemo(() => JSON.stringify(quiz.outcomes), [quiz.outcomes]);

  const hasUnpublishedChanges = useMemo(() => {
    if (!quiz.isPublished) return false;

    // For legacy quizzes published before draft/live separation,
    // publishedVersion will be null. Show indicator so user can push initial snapshot.
    if (!publishedVersion) return true;

    // Build current snapshot with same shape as what we compare against
    const currentSnapshot = {
      title: quiz.title,
      description: quiz.description,
      coverImageUrl: quiz.coverImageUrl,
      ctaText: quiz.ctaText,
      primaryColor: quiz.primaryColor,
      brandKitMode: quiz.brandKitMode ?? 'default',
      questions: quiz.questions,
      outcomes: quiz.outcomes,
      leadGen: quiz.leadGen,
    };

    // Build a comparable version of publishedVersion with leadGen included
    // This handles legacy published versions that don't have leadGen
    const comparablePublishedVersion = {
      ...publishedVersion,
      leadGen: publishedVersion.leadGen, // will be undefined for legacy
      brandKitMode: publishedVersion.brandKitMode ?? 'default',
    };

    // For comparison, normalize both: if one has undefined leadGen and other has default, treat as equal
    const normalizedCurrent = {
      ...currentSnapshot,
      leadGen: currentSnapshot.leadGen?.enabled ? currentSnapshot.leadGen : undefined,
      brandKitMode: currentSnapshot.brandKitMode ?? 'default',
    };
    const normalizedPublished = {
      ...comparablePublishedVersion,
      leadGen: comparablePublishedVersion.leadGen?.enabled ? comparablePublishedVersion.leadGen : undefined,
      brandKitMode: comparablePublishedVersion.brandKitMode ?? 'default',
    };

    return stableStringify(normalizedCurrent) !== stableStringify(normalizedPublished);
  }, [
    quiz.isPublished,
    quiz.title,
    quiz.description,
    quiz.coverImageUrl,
    quiz.ctaText,
    quiz.primaryColor,
    quiz.brandKitMode,
    quiz.leadGen,
    questionsJson,
    outcomesJson,
    publishedVersion,
  ]);

  const questions = quiz.questions ?? [];
  const outcomes = quiz.outcomes ?? [];

  const editingQuestion = editingQuestionId
    ? questions.find((question) => question.id === editingQuestionId) ?? null
    : null;
  const editingQuestionIndex =
    editingQuestionId && editingQuestion
      ? questions.findIndex((question) => question.id === editingQuestionId)
      : -1;
  const activeOutcome =
    activeSheet?.type === 'outcome'
      ? outcomes.find((outcome) => outcome.id === activeSheet.id)
      : undefined;

  useEffect(() => {
    if (activeSheet?.type === 'outcome' && !activeOutcome) {
      setActiveSheet(null);
    }
  }, [activeSheet, activeOutcome]);

  useEffect(() => {
    if (!quiz.coverImageUrl) {
      setCoverFile(null);
    }
  }, [quiz.coverImageUrl]);

  useEffect(() => {
    if (!activeOutcome?.imageUrl) {
      setOutcomeFile(null);
    }
  }, [activeOutcome?.imageUrl, activeOutcome?.id]);

  // Onboarding Trigger Logic
  useEffect(() => {
    // Helper to check if title is "default" or empty
    const isDefaultTitle = (t: string | undefined) => !t || t === 'Meu Novo Quiz';

    const wasDefault = isDefaultTitle(prevTitleRef.current);
    const isNowSet = !isDefaultTitle(quiz.title);
    const hasDescription = Boolean(quiz.description);
    const hasSeenOnboarding = (() => {
      if (!onboardingStorageKey || typeof window === 'undefined') return false;
      try {
        return localStorage.getItem(onboardingStorageKey) === 'true';
      } catch (error) {
        console.warn('[Onboarding] Failed to read seen state', error);
        return false;
      }
    })();

    // Trigger ONLY when transitioning from Default -> Set AND description exists
    // This avoids triggering on page load if the quiz was already created
    if (wasDefault && isNowSet && hasDescription && !hasShownOnboardingRef.current && !hasSeenOnboarding) {
      // Add a small delay to ensure UI is ready and animation is smooth
      const timer = setTimeout(() => {
        setShowOnboarding(true);
        hasShownOnboardingRef.current = true;
        markOnboardingSeen();
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Update ref for next render
    prevTitleRef.current = quiz.title;
  }, [quiz.title, quiz.description, onboardingStorageKey, markOnboardingSeen]);


  // Sync draft state when Introduction sheet opens
  useEffect(() => {
    if (activeSheet?.type === 'introduction') {
      setDraftTitle(quiz.title ?? '');
      setDraftDescription(quiz.description ?? '');
      setDraftCtaText(quiz.ctaText ?? '');
      setDraftCoverImageUrl(quiz.coverImageUrl ?? '');
      setCoverFile(null);
    }
  }, [activeSheet, quiz.title, quiz.description, quiz.ctaText, quiz.coverImageUrl]);

  // Sync draft state when Outcome sheet opens
  useEffect(() => {
    if (activeSheet?.type === 'outcome' && activeOutcome) {
      setDraftOutcomeTitle(activeOutcome.title ?? '');
      setDraftOutcomeDescription(activeOutcome.description ?? '');
      setDraftOutcomeCtaText(activeOutcome.ctaText ?? '');
      setDraftOutcomeCtaUrl(activeOutcome.ctaUrl ?? '');
      setDraftOutcomeImageUrl(activeOutcome.imageUrl ?? '');
      setOutcomeFile(null);
    }
  }, [activeSheet, activeOutcome]);

  const handleAddQuestion = () => {
    const newQuestion: Partial<Question> = {
      id: generateUUID(),
      text: '',
      options: [],
    };
    addQuestion(newQuestion);
    if (newQuestion.id) {
      setEditingQuestionId(newQuestion.id);
    }
  };

  const handleQuestionSave = (updatedQuestion: Partial<Question>, destinationIndex?: number) => {
    if (updatedQuestion.id) {
      updateQuestion(updatedQuestion.id, updatedQuestion);
      const currentIndex = questions.findIndex((question) => question.id === updatedQuestion.id);
      if (
        currentIndex !== -1 &&
        typeof destinationIndex === 'number' &&
        destinationIndex >= 0 &&
        destinationIndex < questions.length &&
        destinationIndex !== currentIndex
      ) {
        reorderQuestions(currentIndex, destinationIndex);
      }
    }
    setEditingQuestionId(null);
  };

  const handleDeleteQuestion = (id?: string) => {
    if (!id) return;
    deleteQuestion(id);
    if (editingQuestionId === id) {
      setEditingQuestionId(null);
    }
    toast.success('Pergunta removida');
  };

  const handleAddOutcome = () => {
    const newOutcome: Partial<Outcome> = {
      id: generateUUID(),
      title: 'Novo resultado',
      description: '',
    };
    addOutcome(newOutcome);
    if (newOutcome.id) {
      setActiveSheet({ type: 'outcome', id: newOutcome.id });
    }
  };

  const handleCoverImageChange = async (file: File | null) => {
    setCoverFile(file);

    if (!file) {
      setDraftCoverImageUrl('');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setDraftCoverImageUrl(compressedDataUrl);
    } catch (error) {
      console.error('Error compressing cover image:', error);
      // Fallback to original file if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        setDraftCoverImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOutcomeImageChange = async (file: File | null) => {
    setOutcomeFile(file);

    if (!file) {
      setDraftOutcomeImageUrl('');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setDraftOutcomeImageUrl(compressedDataUrl);
    } catch (error) {
      console.error('Error compressing outcome image:', error);
      // Fallback to original file if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        setDraftOutcomeImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveIntroduction = async () => {
    updateQuizField('title', draftTitle);
    updateQuizField('description', draftDescription);
    updateQuizField('ctaText', draftCtaText);
    updateQuizField('coverImageUrl', draftCoverImageUrl);
    await forceSave();
    setActiveSheet(null);
    toast.success('Salvo');
  };

  const handleCancelIntroduction = () => {
    setDraftTitle(quiz.title ?? '');
    setDraftDescription(quiz.description ?? '');
    setDraftCtaText(quiz.ctaText ?? '');
    setDraftCoverImageUrl(quiz.coverImageUrl ?? '');
    setCoverFile(null);
    setActiveSheet(null);
  };

  const handleSaveOutcome = async () => {
    if (!activeOutcome?.id) return;

    updateOutcome(activeOutcome.id, {
      title: draftOutcomeTitle,
      description: draftOutcomeDescription,
      ctaText: draftOutcomeCtaText,
      ctaUrl: draftOutcomeCtaUrl,
      imageUrl: draftOutcomeImageUrl,
    });
    await forceSave();
    setActiveSheet(null);
    toast.success('Salvo');
  };

  const handleCancelOutcome = () => {
    if (activeOutcome) {
      setDraftOutcomeTitle(activeOutcome.title ?? '');
      setDraftOutcomeDescription(activeOutcome.description ?? '');
      setDraftOutcomeCtaText(activeOutcome.ctaText ?? '');
      setDraftOutcomeCtaUrl(activeOutcome.ctaUrl ?? '');
      setDraftOutcomeImageUrl(activeOutcome.imageUrl ?? '');
      setOutcomeFile(null);
    }
    setActiveSheet(null);
  };

  const handleDeleteOutcome = (id?: string) => {
    if (!id) return;
    deleteOutcome(id);
    if (activeSheet?.type === 'outcome' && activeSheet.id === id) {
      setActiveSheet(null);
    }
    toast.success('Resultado removido');
  };

  const findOutcomesMissingCtaUrl = () => {
    return (quiz.outcomes || []).filter((outcome) => {
      const hasCtaText = Boolean(outcome.ctaText && outcome.ctaText.trim());
      const hasCtaUrl = Boolean(outcome.ctaUrl && outcome.ctaUrl.trim());
      return hasCtaText && !hasCtaUrl;
    });
  };

  const requireCtaUrlBeforePublish = (type: 'publish' | 'update') => {
    const missing = findOutcomesMissingCtaUrl();
    if (missing.length) {
      setCtaWarningOutcomes(missing);
      setPendingPublishType(type);
      setCtaWarningOpen(true);
      return true;
    }
    return false;
  };

  const executePublish = async () => {
    if (!user || !quiz.id) return;

    try {
      setIsPublishing(true);
      cancelPendingSave();

      // First save any pending changes
      await forceSave();

      // Then publish using the new service method
      const result = await QuizService.publishQuiz(quiz.id, user.uid);
      if (result.status === 'limit-reached') {
        toast.error('Limite de publicação no plano gratuito');
        openUpgradeModal('publish-limit');
        return;
      }

      // Update local state with the new published version
      const snapshot = {
        title: quiz.title || '',
        description: quiz.description || '',
        coverImageUrl: quiz.coverImageUrl,
        ctaText: quiz.ctaText,
        primaryColor: quiz.primaryColor || DEFAULT_PRIMARY_COLOR,
        brandKitMode: quiz.brandKitMode ?? 'default',
        questions: (quiz.questions || []) as any,
        outcomes: (quiz.outcomes || []) as any,
        leadGen: quiz.leadGen,
      };
      setPublishedVersion(snapshot, Date.now());
      updateQuizField('isPublished', true);

      setShowPublishModal(true);
      toast.success('Quiz publicado com sucesso!');
    } catch (error) {
      console.error('Error publishing quiz:', error);
      toast.error('Erro ao publicar quiz');
    } finally {
      setIsPublishing(false);
    }
  };

  const executePublishUpdate = async () => {
    if (!user || !quiz.id) return;

    try {
      setIsPublishing(true);
      cancelPendingSave();

      // First save any pending changes
      await forceSave();

      // Then update the published version
      const result = await QuizService.publishQuiz(quiz.id, user.uid);
      if (result.status === 'limit-reached') {
        toast.error('Limite de publicação no plano gratuito');
        openUpgradeModal('publish-limit');
        return;
      }

      // Update local state with the new published version
      const snapshot = {
        title: quiz.title || '',
        description: quiz.description || '',
        coverImageUrl: quiz.coverImageUrl,
        ctaText: quiz.ctaText,
        primaryColor: quiz.primaryColor || DEFAULT_PRIMARY_COLOR,
        brandKitMode: quiz.brandKitMode ?? 'default',
        questions: (quiz.questions || []) as any,
        outcomes: (quiz.outcomes || []) as any,
        leadGen: quiz.leadGen,
      };
      setPublishedVersion(snapshot, Date.now());

      toast.success('Quiz atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating published quiz:', error);
      toast.error('Erro ao atualizar quiz');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBack = async () => {
    if (!user) {
      router.push('/dashboard');
      return;
    }

    try {
      cancelPendingSave();
      await forceSave();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving quiz before leaving:', error);
      // Navigate anyway - data is likely already auto-saved
      router.push('/dashboard');
    }
  };

  const handlePublish = async () => {
    if (!user || !quiz.id) return;
    if (requireCtaUrlBeforePublish('publish')) return;
    await executePublish();
  };

  // Called from header - opens confirmation modal
  const handlePublishUpdateClick = () => {
    setShowUpdateConfirmModal(true);
  };

  const handlePublishUpdateAndExit = async () => {
    if (!user || !quiz.id) return;

    if (requireCtaUrlBeforePublish('update')) {
      return new Promise<void>((resolve, reject) => {
        pendingPublishResolveRef.current = resolve;
        pendingPublishRejectRef.current = reject;
      });
    }

    await executePublishUpdate();
  };

  // Called when user confirms in the modal
  const handlePublishUpdateConfirm = async () => {
    if (!user || !quiz.id) return;

    setShowUpdateConfirmModal(false);
    if (requireCtaUrlBeforePublish('update')) return;
    await executePublishUpdate();
  };

  const handleConfirmCtaWarning = async () => {
    if (!pendingPublishType) {
      setCtaWarningOpen(false);
      clearPendingPublishPromises();
      return;
    }

    setCtaWarningOpen(false);
    if (pendingPublishType === 'publish') {
      await executePublish();
    } else {
      await executePublishUpdate();
    }
    pendingPublishResolveRef.current?.();
    clearPendingPublishPromises();
    setPendingPublishType(null);
  };

  const handleUnpublish = async () => {
    if (!user || !quiz.id) return;

    try {
      setIsPublishing(true);
      cancelPendingSave();

      await QuizService.unpublishQuiz(quiz.id, user.uid);
      updateQuizField('isPublished', false);

      toast.success('Quiz despublicado');
    } catch (error) {
      console.error('Error unpublishing quiz:', error);
      toast.error('Erro ao despublicar quiz');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscardChanges = () => {
    if (!publishedVersion) {
      toast.error('Não é possível descartar', {
        description: 'Este quiz foi publicado antes do sistema de versões. Publique novamente para habilitar esta função.',
      });
      return;
    }

    loadPublishedVersion();
    toast.success('Alterações descartadas');
  };

  const handleShowPublishModal = () => {
    setShowPublishModal(true);
  };

  const handleBrandKitLogoChange = async (file: File | null) => {
    setBrandKitLogoFile(file);

    if (!file) {
      setBrandKitLogoPreview('');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file, 800, 800, 0.8);
      setBrandKitLogoPreview(compressedDataUrl);
    } catch (error) {
      console.error('Error compressing brand kit logo:', error);
      const reader = new FileReader();
      reader.onload = () => {
        setBrandKitLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyBrandKitMode = useCallback(
    (mode: BrandKitMode) => {
      if (mode === 'custom') {
        if (!brandKit) {
          toast.error('Crie um kit da marca para aplicar.');
          return;
        }
        if (quiz.brandKitMode !== 'custom') {
          updateQuizField('brandKitMode', 'custom');
        }
        const nextPrimaryColor = brandKit.colors.primary;
        if (quiz.primaryColor !== nextPrimaryColor) {
          updateQuizField('primaryColor', nextPrimaryColor);
        }
        return;
      }

      if (quiz.brandKitMode !== 'default') {
        updateQuizField('brandKitMode', 'default');
      }
      if (quiz.primaryColor !== DEFAULT_PRIMARY_COLOR) {
        updateQuizField('primaryColor', DEFAULT_PRIMARY_COLOR);
      }
    },
    [brandKit, quiz.brandKitMode, quiz.primaryColor, updateQuizField]
  );

  const handleOpenBrandKitDialog = () => {
    if (isSubscriptionLoading) return;
    if (!isProUser) {
      openUpgradeModal('brand-kit');
      return;
    }
    const defaults = brandKit?.colors ?? themeColorDefaults;
    setBrandKitColors({
      primary: brandKit?.colors.primary ?? defaults.primary,
      secondary: brandKit?.colors.secondary ?? defaults.secondary,
      accent: brandKit?.colors.accent ?? defaults.accent,
    });
    setBrandKitName(brandKit?.name ?? '');
    setBrandKitLogoPreview(brandKit?.logoUrl ?? '');
    setBrandKitLogoFile(null);
    setBrandKitDialogOpen(true);
  };

  const handleSaveBrandKit = async () => {
    if (!user?.uid) return;

    const normalizedColors = {
      primary: normalizeHexColor(brandKitColors.primary),
      secondary: normalizeHexColor(brandKitColors.secondary),
      accent: normalizeHexColor(brandKitColors.accent),
    };

    const invalidColors = Object.values(normalizedColors).some((color) => !isValidHexColor(color));
    if (invalidColors) {
      toast.error('Informe cores válidas no formato #RRGGBB.');
      return;
    }

    try {
      setIsBrandKitSaving(true);
      const nextKit: BrandKit = {
        name: brandKitName.trim() || undefined,
        logoUrl: brandKitLogoPreview || null,
        colors: normalizedColors,
      };
      await saveBrandKit(user.uid, nextKit);
      setBrandKit(nextKit);
      if (quiz.brandKitMode !== 'custom') {
        updateQuizField('brandKitMode', 'custom');
      }
      if (quiz.primaryColor !== nextKit.colors.primary) {
        updateQuizField('primaryColor', nextKit.colors.primary);
      }
      setBrandKitDialogOpen(false);
      toast.success('Kit da marca salvo');
    } catch (error) {
      console.error('Error saving brand kit:', error);
      toast.error('Erro ao salvar kit da marca');
    } finally {
      setIsBrandKitSaving(false);
    }
  };

  const handleDeleteBrandKit = async () => {
    if (isSubscriptionLoading) return;
    if (!isProUser) {
      openUpgradeModal('brand-kit');
      return;
    }
    if (!user?.uid) return;

    try {
      setIsBrandKitDeleting(true);
      await deleteBrandKit(user.uid);
      setBrandKit(null);
      setBrandKitName('');
      if (quiz.brandKitMode !== 'default') {
        updateQuizField('brandKitMode', 'default');
      }
      if (quiz.primaryColor !== DEFAULT_PRIMARY_COLOR) {
        updateQuizField('primaryColor', DEFAULT_PRIMARY_COLOR);
      }
      setBrandKitColors({
        primary: themeColorDefaults.primary,
        secondary: themeColorDefaults.secondary,
        accent: themeColorDefaults.accent,
      });
      setBrandKitLogoPreview('');
      setBrandKitLogoFile(null);
      setBrandKitDialogOpen(false);
      setBrandKitDeleteDialogOpen(false);
      toast.success('Kit da marca removido');
    } catch (error) {
      console.error('Error deleting brand kit:', error);
      toast.error('Erro ao remover kit da marca');
    } finally {
      setIsBrandKitDeleting(false);
    }
  };

  const introDescription = quiz.description
    ? quiz.description
    : 'Conte mais sobre o que torna esse quiz especial.';
  const coverImagePreview = quiz.coverImageUrl ? quiz.coverImageUrl : undefined;
  const isDefaultBrandKitSelected = brandKitMode === 'default';
  const isCustomBrandKitSelected = brandKitMode === 'custom';
  const activeBrandKitColors =
    isCustomBrandKitSelected && brandKit ? brandKit.colors : themeColorDefaults;
  const activeBrandKitName = isCustomBrandKitSelected
    ? brandKit?.name || 'Seu kit da marca'
    : 'Padrão MultiQuiz';

  const sheetOpen = Boolean(activeSheet);
  const isBrandKitLocked = !isSubscriptionLoading && !isProUser;
  const mobileViewOptions: { id: MobileViewMode; label: string; icon: LucideIcon }[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'editor', label: 'Editor', icon: PenSquare },
  ];

  const editorPanel = (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Estrutura do Quiz</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye size={16} />
            Visualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-10 overflow-y-auto min-h-0 p-6 pt-0">
        <section ref={introductionRef} className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Introdução
          </div>
          <LoadingCard isLoading={loadingSections.introduction}>
            <SidebarCard onClick={() => setActiveSheet({ type: 'introduction' })}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-2xl border border-border bg-primary/10 text-primary">
                  {quiz.coverImageUrl ? (
                    <img
                      src={quiz.coverImageUrl}
                      alt="Capa do quiz"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {quiz.title || 'Meu Novo Quiz'}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {introDescription}
                  </p>
                </div>
              </div>
            </SidebarCard>
          </LoadingCard>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Kit da Marca
          </div>
          <SidebarCard
            onClick={() => setActiveSheet({ type: 'brand-kit' })}
            className="relative"
          >
            <div className="flex items-center gap-4 pr-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary">
                <Palette className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {activeBrandKitName}
                </p>
              </div>
              {isBrandKitLocked && (
                <Badge variant="outline" className="shrink-0 gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  Pro
                </Badge>
              )}
            </div>
            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center -space-x-1">
              <span
                className="h-4 w-4 rounded-full border border-border/40 ring-1 ring-white/10"
                style={{ backgroundColor: activeBrandKitColors.primary }}
                aria-hidden="true"
              />
              <span
                className="h-4 w-4 rounded-full border border-border/40 ring-1 ring-white/10"
                style={{ backgroundColor: activeBrandKitColors.secondary }}
                aria-hidden="true"
              />
              <span
                className="h-4 w-4 rounded-full border border-border/40 ring-1 ring-white/10"
                style={{ backgroundColor: activeBrandKitColors.accent }}
                aria-hidden="true"
              />
            </div>
          </SidebarCard>
        </section>

        <section ref={outcomesRef} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Resultados ({outcomes.length})
            </span>
            <button
              type="button"
              onClick={handleAddOutcome}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-primary transition hover:bg-primary/10"
              aria-label="Adicionar resultado"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {outcomes.length === 0 ? (
              <button
                type="button"
                onClick={handleAddOutcome}
                className="w-full rounded-2xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground transition hover:border-border/80 hover:bg-muted/40 cursor-[var(--cursor-interactive)]"
                aria-label="Adicionar resultado"
              >
                Nenhum resultado definido
              </button>
            ) : (
              outcomes.map((outcome) => {
                const hasCtaText = Boolean(outcome.ctaText && outcome.ctaText.trim());
                const hasCtaUrl = Boolean(outcome.ctaUrl && outcome.ctaUrl.trim());
                const shouldWarnMissingCtaUrl = hasCtaText && !hasCtaUrl;

                return (
                  <LoadingCard key={outcome.id} isLoading={loadingSections.outcomes}>
                    <div className="relative group">
                      <SidebarCard
                        onClick={() => outcome.id && setActiveSheet({ type: 'outcome', id: outcome.id })}
                        withActionPadding
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-primary/10 text-primary">
                            {outcome.imageUrl ? (
                              <img
                                src={outcome.imageUrl}
                                alt="Resultado"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center">
                                <Rocket className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {outcome.title || 'Novo resultado'}
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {outcome.description || 'Sem descrição'}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge
                                variant={outcome.ctaText ? 'outline' : 'disabled'}
                                className="max-w-[14rem] min-w-0 overflow-hidden whitespace-nowrap px-3 py-1 text-[11px] font-medium"
                              >
                                <MousePointerClick className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span
                                  className="block max-w-full truncate"
                                  title={outcome.ctaText || 'Sem texto'}
                                >
                                  {outcome.ctaText || 'Sem texto'}
                                </span>
                              </Badge>
                              <Badge
                                variant={outcome.ctaUrl ? 'outline' : 'disabled'}
                                className="max-w-[16rem] min-w-0 overflow-hidden whitespace-nowrap px-3 py-1 text-[11px] font-medium"
                              >
                                {shouldWarnMissingCtaUrl ? (
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                                ) : (
                                  <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                )}
                                <span
                                  className="block max-w-full truncate"
                                  title={outcome.ctaUrl || 'Sem URL'}
                                >
                                  {outcome.ctaUrl || 'Sem URL'}
                                </span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </SidebarCard>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarCardActionTrigger
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => event.stopPropagation()}
                            aria-label="Opções do resultado"
                            className="absolute right-3 top-3"
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </SidebarCardActionTrigger>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onSelect={(event) => {
                              event.preventDefault();
                              if (outcome.id) {
                                setActiveSheet({ type: 'outcome', id: outcome.id });
                              }
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(event) => {
                              event.preventDefault();
                              handleDeleteOutcome(outcome.id);
                            }}
                          >
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </LoadingCard>
                );
              })
            )}
          </div>
        </section>

        <section ref={questionsRef} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Perguntas ({questions.length})
            </span>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-primary transition hover:bg-primary/10"
              aria-label="Adicionar pergunta"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <SortableQuestionsList
            questions={questions}
            isLoading={loadingSections.questions}
            onReorder={reorderQuestions}
            onEdit={setEditingQuestionId}
            onDelete={handleDeleteQuestion}
            onAdd={handleAddQuestion}
          />
        </section>

        <section ref={leadGenRef} className="space-y-3 pb-8">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Captura de Leads
          </div>
          <LoadingCard isLoading={loadingSections.leadGen}>
            <SidebarCard onClick={() => setActiveSheet({ type: 'lead-gen' })}>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary">
                  <ContactIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {quiz.leadGen?.enabled ? 'Ativado' : 'Desativado'}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {quiz.leadGen?.enabled
                      ? `${(quiz.leadGen.fields || []).length} campos solicitados`
                      : 'Configure a captura de dados dos participantes'}
                  </p>
                </div>
              </div>
            </SidebarCard>
          </LoadingCard>
        </section>
      </CardContent>
    </Card>
  );
  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    markOnboardingSeen();
  };

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]"
            onClick={handleDismissOnboarding}
          >
            {/* Desktop Message */}
            <div className="hidden md:block absolute right-[42%] top-[15%] max-w-sm text-white p-6 animate-in fade-in slide-in-from-right-10 duration-700">
              <div className="relative">
                {/* Arrow pointing to right */}
                <svg className="absolute -right-24 top-8 w-24 h-24 text-white transform rotate-12" fill="none" stroke="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
                   <path 
                     strokeWidth="2" 
                     strokeLinecap="round" 
                     strokeLinejoin="round" 
                     d="M10,50 Q40,20 90,50 M80,35 L90,50 L75,60"
                     className="animate-pulse"
                   />
                </svg>
                
                <h3 className="text-xl font-bold mb-2">Edite tudo por aqui!</h3>
                <p className="text-gray-200 leading-relaxed">
                  Você pode continuar conversando com a IA ou clicar nos cards ao lado para fazer ajustes manuais finos em textos, imagens e opções.
                </p>
                <Button 
                  className="mt-4 bg-white text-black hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismissOnboarding();
                  }}
                >
                  Entendi
                </Button>
              </div>
            </div>

            {/* Mobile Message */}
            <div className="md:hidden absolute top-[160px] left-1/2 -translate-x-1/2 w-full max-w-xs text-center text-white p-4 animate-in fade-in slide-in-from-top-5 duration-700 z-[70]">
              <div className="flex flex-col items-center">
                <svg className="w-10 h-10 text-white animate-bounce mb-2 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <p className="text-lg font-medium mb-4 text-gray-100">
                  Toque em <span className="font-bold text-white">Editor</span> para ver e ajustar o que a IA criou
                </p>
                <Button 
                  size="sm"
                  className="mt-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismissOnboarding();
                  }}
                >
                  Ok, entendi
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`h-full flex flex-col ${isPreviewOpen ? 'hidden' : ''}`}>
        {/* Fixed Header */}
        <div className="flex-shrink-0">
          <BuilderHeader
            quiz={quiz}
            isPreview={false}
            onBack={handleBack}
            onPublish={handlePublish}
            onPublishUpdate={handlePublishUpdateClick}
            onPublishUpdateAndExit={handlePublishUpdateAndExit}
            onUnpublish={handleUnpublish}
            onDiscardChanges={handleDiscardChanges}
            isPublishing={isPublishing}
            hasUnpublishedChanges={hasUnpublishedChanges}
            publishedVersion={publishedVersion}
          />
        </div>

        {/* Mobile View Toggle - Fixed on mobile */}
        <div className={cn(
          "flex-shrink-0 flex justify-center md:hidden px-4 py-3 bg-background relative transition-all duration-300",
          showOnboarding ? "z-[60]" : "z-[45]"
        )}>
          <div className="inline-flex gap-1 rounded-full border border-border bg-muted p-1 relative">
            {/* Highlight for onboarding on mobile */}
            {showOnboarding && (
              <div className="absolute inset-0 z-50 rounded-full ring-4 ring-white ring-offset-4 ring-offset-black/60 pointer-events-none" />
            )}
            
            {mobileViewOptions.map((option) => {
              const Icon = option.icon;
              const isActive = mobileView === option.id;
              // Highlight specifically the Editor tab trigger when onboarding is active
              const isOnboardingTarget = showOnboarding && option.id === 'editor';
              
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                     setMobileView(option.id);
                     if (showOnboarding && option.id === 'editor') {
                       handleDismissOnboarding();
                     }
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-[var(--cursor-interactive)] relative',
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground',
                    isOnboardingTarget ? 'z-[60] bg-background text-foreground shadow-lg' : ''
                  )}
                  aria-pressed={isActive}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 overflow-hidden min-h-0">
          <div className="h-full max-w-7xl mx-auto">
            {/* Grid Layout - Proper height constraints for scrolling */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0 md:gap-8 h-full md:px-8 md:py-8">
              <div className={cn(
                "h-full min-h-0 md:col-span-3 px-4 py-4 md:px-0 md:py-0",
                mobileView === 'editor' && 'hidden md:block'
              )}>
                <ChatInterface
                  userName={resolvedUserName}
                  onOpenPreview={() => setIsPreviewOpen(true)}
                  onPublish={handlePublish}
                  onPublishUpdate={handlePublishUpdateClick}
                  isPublishing={isPublishing}
                  hasUnpublishedChanges={hasUnpublishedChanges}
                />
              </div>

              <div className={cn(
                "h-full min-h-0 md:col-span-2 px-4 py-4 md:px-0 md:py-0 relative transition-all duration-300",
                mobileView === 'chat' && 'hidden md:block',
                showOnboarding && "md:z-[60] md:ring-4 md:ring-white md:ring-offset-4 md:ring-offset-black/60 md:rounded-xl md:shadow-2xl"
              )}>
                {editorPanel}
              </div>
            </div>
          </div>
        </main>

        <Sheet open={sheetOpen} onOpenChange={(open) => !open && setActiveSheet(null)}>
          <SheetContent
            className="max-w-lg flex flex-col [&>div]:flex [&>div]:flex-col [&>div]:min-h-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {activeSheet?.type === 'introduction' && (
              <>
                <SheetHeader className="flex-shrink-0 pb-6">
                  <SheetTitle className="text-2xl">Introdução</SheetTitle>
                  <SheetDescription>
                    Atualize o título e a descrição para deixar o quiz alinhado com sua proposta.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto relative min-h-0">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Título</p>
                      <Input
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        placeholder="Título do seu quiz"
                        autoFocus={false}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Descrição</p>
                      <Textarea
                        value={draftDescription}
                        onChange={(event) => setDraftDescription(event.target.value)}
                        placeholder="Descreva o que o participante vai viver"
                        rows={4}
                        autoFocus={false}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Imagem principal</p>
                      <Upload
                        file={coverFile}
                        previewUrl={draftCoverImageUrl || undefined}
                        onFileChange={handleCoverImageChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Texto do CTA</p>
                      <Input
                        value={draftCtaText}
                        onChange={(event) => setDraftCtaText(event.target.value)}
                        placeholder="Começar quiz"
                        autoFocus={false}
                      />
                    </div>
                  </div>
                  {/* Gradient overlay for fade effect - sticky to stay at bottom of viewport */}
                  <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                </div>
              </>
            )}

            {activeSheet?.type === 'outcome' && activeOutcome && (
              <>
                <SheetHeader className="flex-shrink-0 pb-6">
                  <SheetTitle className="text-2xl">Resultado</SheetTitle>
                  <SheetDescription>
                    Defina o título e a descrição desse resultado para mostrar o impacto que o participante teve.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto relative min-h-0">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Título</p>
                      <Input
                        value={draftOutcomeTitle}
                        onChange={(event) => setDraftOutcomeTitle(event.target.value)}
                        placeholder="Título do resultado"
                        autoFocus={false}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Descrição</p>
                      <Textarea
                        value={draftOutcomeDescription}
                        onChange={(event) => setDraftOutcomeDescription(event.target.value)}
                        placeholder="Descreva esse resultado"
                        rows={4}
                        autoFocus={false}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Imagem do resultado</p>
                      <Upload
                        file={outcomeFile}
                        previewUrl={draftOutcomeImageUrl || undefined}
                        onFileChange={handleOutcomeImageChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Texto do CTA</p>
                      <Input
                        value={draftOutcomeCtaText}
                        onChange={(event) => setDraftOutcomeCtaText(event.target.value)}
                        placeholder="Quer saber mais?"
                        autoFocus={false}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>URL do CTA</p>
                      <Input
                        type="url"
                        value={draftOutcomeCtaUrl}
                        onChange={(event) => setDraftOutcomeCtaUrl(event.target.value)}
                        placeholder="https://seusite.com/cta"
                        autoFocus={false}
                      />
                    </div>
                  </div>
                  {/* Gradient overlay for fade effect - sticky to stay at bottom of viewport */}
                  <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                </div>
              </>
            )}
            {activeSheet?.type === 'brand-kit' && (
              <>
                <SheetHeader className="flex-shrink-0 pb-6">
                  <SheetTitle className="text-2xl">Kit da Marca</SheetTitle>
                  <SheetDescription>
                    Defina o visual dos seus quizzes com logo e cores personalizadas.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto overflow-x-visible relative min-h-0">
                  <div className="space-y-4 px-1 py-2">
                    <button
                      type="button"
                      onClick={() => applyBrandKitMode('default')}
                      aria-pressed={isDefaultBrandKitSelected}
                      className={cn(
                        "w-full rounded-2xl border-2 p-4 text-left transition-colors",
                        isDefaultBrandKitSelected
                          ? "!border-primary bg-card"
                          : "border-border/60 bg-card hover:!border-primary"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Padrão MultiQuiz
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Logo e paleta padrão do MultiQuiz.
                          </p>
                        </div>
                        {isDefaultBrandKitSelected && (
                          <Badge variant="published">Selecionado</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary" aria-hidden="true" />
                        <span className="h-6 w-6 rounded-full bg-secondary" aria-hidden="true" />
                        <span className="h-6 w-6 rounded-full bg-accent" aria-hidden="true" />
                      </div>
                    </button>

                    {brandKit ? (
                      <div
                        className={cn(
                          "rounded-2xl border-2 p-4 transition-colors",
                          isCustomBrandKitSelected
                            ? "!border-primary bg-card"
                            : "border-border/60 bg-card hover:!border-primary"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => applyBrandKitMode('custom')}
                          aria-pressed={isCustomBrandKitSelected}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {brandKit.name || 'Seu kit da marca'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Salvo para aplicar em todos os quizzes.
                              </p>
                            </div>
                            {isCustomBrandKitSelected && (
                              <Badge variant="published">Selecionado</Badge>
                            )}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            {brandKit.logoUrl ? (
                              <div className="h-12 w-12 overflow-hidden rounded-xl border border-border bg-muted/50">
                                <img
                                  src={brandKit.logoUrl}
                                  alt="Logo do kit da marca"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span
                                className="h-7 w-7 rounded-full border border-border/60"
                                style={{ backgroundColor: brandKit.colors.primary }}
                                aria-label="Cor primária do kit"
                              />
                              <span
                                className="h-7 w-7 rounded-full border border-border/60"
                                style={{ backgroundColor: brandKit.colors.secondary }}
                                aria-label="Cor secundária do kit"
                              />
                              <span
                                className="h-7 w-7 rounded-full border border-border/60"
                                style={{ backgroundColor: brandKit.colors.accent }}
                                aria-label="Cor de fundo do kit"
                              />
                            </div>
                          </div>
                        </button>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleOpenBrandKitDialog}
                            disabled={isBrandKitLoading || isBrandKitSaving || isBrandKitDeleting}
                          >
                            Editar kit da marca
                          </Button>
                          <Button
                            type="button"
                            variant="outline-destructive"
                            className="w-full"
                            onClick={() => {
                              if (isBrandKitLocked) {
                                openUpgradeModal('brand-kit');
                                return;
                              }
                              setBrandKitDeleteDialogOpen(true);
                            }}
                            disabled={isBrandKitLoading || isBrandKitSaving || isBrandKitDeleting}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir kit
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">Criar kit da marca</p>
                          {isBrandKitLocked && (
                            <Badge variant="outline" className="gap-1">
                              <Lock className="h-3.5 w-3.5" />
                              Pro
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Personalize logo e cores para todos os seus quizzes.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={handleOpenBrandKitDialog}
                          disabled={isBrandKitLoading}
                        >
                          {isProUser ? (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Criar kit da marca
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 h-4 w-4" />
                              Criar kit da marca
                            </>
                          )}
                        </Button>
                        {isBrandKitLoading && (
                          <p className="text-xs text-muted-foreground">
                            Carregando kit da marca...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                </div>
              </>
            )}
            {activeSheet?.type === 'lead-gen' && (
              <LeadGenSheet onClose={() => setActiveSheet(null)} onSave={forceSave} />
            )}
            {(activeSheet?.type === 'outcome' || activeSheet?.type === 'introduction') && (
              <div className="flex-shrink-0 border-t bg-background py-8 mt-auto">
                {activeSheet?.type === 'outcome' && (
                  <DrawerFooter
                    onSave={handleSaveOutcome}
                    onCancel={handleCancelOutcome}
                  />
                )}
                {activeSheet?.type === 'introduction' && (
                  <DrawerFooter
                    onSave={handleSaveIntroduction}
                    onCancel={handleCancelIntroduction}
                  />
                )}
              </div>
            )}
            {/* LeadGenSheet has its own footer */}
          </SheetContent>
        </Sheet>

        <EditQuestionModal
          open={editingQuestionId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingQuestionId(null);
            }
          }}
          question={editingQuestion}
          questionIndex={editingQuestionIndex >= 0 ? editingQuestionIndex : null}
          totalQuestions={questions.length}
          outcomes={outcomes}
          onSave={handleQuestionSave}
        />

        <PublishSuccessModal
          open={showPublishModal}
          onOpenChange={setShowPublishModal}
          quizId={quiz.id || ''}
          loading={isPublishing}
        />

        <UpgradeModal
          open={upgradeModalState.open}
          reason={upgradeModalState.reason}
          onOpenChange={(open) => setUpgradeModalState((prev) => ({ ...prev, open }))}
        />

        <Dialog open={brandKitDialogOpen} onOpenChange={setBrandKitDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>{brandKit ? 'Editar kit da marca' : 'Criar kit da marca'}</DialogTitle>
              <DialogDescription>
                Personalize logo e cores do seu kit.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              <div className="space-y-2">
                <p className={fieldLabelClass}>Nome do kit (opcional)</p>
                <Input
                  value={brandKitName}
                  onChange={(event) => setBrandKitName(event.target.value)}
                  placeholder="Ex: Kit Principal"
                  autoFocus={false}
                />
              </div>
              <div className="space-y-2">
                <p className={fieldLabelClass}>Logo da marca</p>
                <Upload
                  file={brandKitLogoFile}
                  previewUrl={brandKitLogoPreview || undefined}
                  onFileChange={handleBrandKitLogoChange}
                  accept="image/*"
                  previewClassName="h-32 sm:h-36"
                  previewImageClassName="object-contain bg-muted/40"
                />
                <p className="text-xs text-muted-foreground">
                  Recomendado: PNG com fundo transparente.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <p className={fieldLabelClass}>Cores do kit</p>
                </div>
                <div className="grid gap-3">
                  {brandKitColorFields.map((field) => {
                    const currentValue = brandKitColors[field.key];
                    const normalizedValue = normalizeHexColor(currentValue);
                    const colorInputValue = isValidHexColor(normalizedValue)
                      ? normalizedValue
                      : themeColorDefaults[field.key];

                    return (
                      <div
                        key={field.key}
                        className="rounded-xl border border-border/60 bg-muted/40 p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <p className="text-sm font-semibold text-foreground sm:min-w-[140px]">
                            {field.label}
                          </p>
                          <Input
                            value={currentValue}
                            onChange={(event) =>
                              setBrandKitColors((prev) => ({
                                ...prev,
                                [field.key]: event.target.value,
                              }))
                            }
                            placeholder="#RRGGBB"
                            autoFocus={false}
                            className="sm:flex-1"
                          />
                          <input
                            type="color"
                            aria-label={`Selecionar ${field.label}`}
                            className="h-10 w-12 rounded-md border border-input bg-muted/40 p-1 cursor-[var(--cursor-interactive)] disabled:cursor-[var(--cursor-not-allowed)]"
                            value={colorInputValue}
                            onChange={(event) =>
                              setBrandKitColors((prev) => ({
                                ...prev,
                                [field.key]: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setBrandKitDialogOpen(false)}
                disabled={isBrandKitSaving}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSaveBrandKit}
                disabled={isBrandKitSaving || isBrandKitDeleting}
              >
                {isBrandKitSaving ? 'Salvando...' : 'Salvar kit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={brandKitDeleteDialogOpen} onOpenChange={setBrandKitDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Excluir kit da marca</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover o kit da marca? Você pode criar outro depois.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setBrandKitDeleteDialogOpen(false)}
                disabled={isBrandKitDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline-destructive"
                onClick={handleDeleteBrandKit}
                disabled={isBrandKitDeleting}
              >
                {isBrandKitDeleting ? 'Excluindo...' : 'Excluir kit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            className="absolute inset-0 z-10 flex"
          >
            <div className="relative flex h-full w-full flex-col bg-background">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsPreviewOpen(false)}
                className="absolute top-4 right-4 sm:right-6 lg:right-8 z-10 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 focus-visible:!ring-2 focus-visible:!ring-primary/30"
                style={previewCloseButtonStyle}
                aria-label="Fechar pré-visualização"
              >
                <X size={20} strokeWidth={2.5} />
              </Button>
              <main className="flex-1 bg-muted/40 overflow-auto">
                <QuizPlayer
                  quiz={quiz}
                  mode="preview"
                  onExit={() => setIsPreviewOpen(false)}
                  brandKitColors={brandKit?.colors}
                  brandKitLogoUrl={brandKit?.logoUrl ?? null}
                />
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA URL warning */}
      <Dialog
        open={ctaWarningOpen}
        onOpenChange={(open) => {
          if (isPublishing) return;
          setCtaWarningOpen(open);
          if (!open) {
            setPendingPublishType(null);
            setCtaWarningOutcomes([]);
            clearPendingPublishPromises(true);
          }
        }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Botão sem URL (link)</span>
            </DialogTitle>
            <DialogDescription>
              Alguns resultados têm texto de botão, mas não têm URL. Sem um link o botão não aparece para quem fizer o quiz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Inclua uma URL ou remova o texto do CTA para os resultados abaixo:
            </p>
            <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
              <ul className="space-y-2">
                {ctaWarningOutcomes.map((outcome) => (
                  <li
                    key={outcome.id || outcome.title || Math.random().toString(36)}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="font-medium truncate">
                      {outcome.title || 'Resultado sem título'}
                    </span>
                    {outcome.ctaText && (
                      <span className="text-xs text-muted-foreground truncate max-w-[55%]">
                        CTA: {outcome.ctaText}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              Se um resultado não tiver texto nem URL, nenhum botão será exibido para o usuário final.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setCtaWarningOpen(false);
                setPendingPublishType(null);
                setCtaWarningOutcomes([]);
                clearPendingPublishPromises(true);
              }}
              disabled={isPublishing}
            >
              Voltar e ajustar
            </Button>
            <Button
              onClick={handleConfirmCtaWarning}
              disabled={isPublishing}
              className="min-w-[160px]"
            >
              {isPublishing
                ? pendingPublishType === 'update'
                  ? 'Atualizando...'
                  : 'Publicando...'
                : pendingPublishType === 'update'
                  ? 'Atualizar mesmo assim'
                  : 'Publicar mesmo assim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Confirmation Modal */}
      <Dialog open={showUpdateConfirmModal} onOpenChange={setShowUpdateConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar quiz publicado?</DialogTitle>
            <DialogDescription>
              As alterações serão refletidas imediatamente no quiz ao vivo. Pessoas que estiverem fazendo o quiz poderão ver as mudanças.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowUpdateConfirmModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePublishUpdateConfirm}
              disabled={isPublishing}
            >
              {isPublishing ? 'Atualizando...' : 'Atualizar Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
