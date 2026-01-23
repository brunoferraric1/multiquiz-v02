'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSubscription, isPro } from '@/lib/services/subscription-service';
import { QuizService } from '@/lib/services/quiz-service';
import { getBrandKit } from '@/lib/services/brand-kit-service';
import { getQuestionMetadata, getOutcomeMetadata, getFieldMetadata } from '@/lib/utils/visual-builder-helpers';
import { auth } from '@/lib/firebase';
import { useLocale, useMessages } from '@/lib/i18n/context';
import { localizePathname } from '@/lib/i18n/paths';
import type { BrandKitColors, Quiz, QuizAttempt, FieldResponse } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LeadsTable, type DataColumn, type DataRow } from '@/components/dashboard/leads-table';
import { UpgradeModal } from '@/components/upgrade-modal';
import { PreviewOverlay } from '@/components/preview-overlay';
import { ArrowLeft, CheckCircle2, Download, Edit3, Eye, Globe, Lock, Loader2, Mail, Play, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LabelList
} from 'recharts';

// Colors for charts
const FUNNEL_START_COLOR = '#8884d8';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', FUNNEL_START_COLOR, '#82ca9d'];

type CollectedDataPreview = {
    id: string;
    quizId: string;
    startedAt: number;
    fieldResponses?: FieldResponse[];
    lead?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    resultOutcomeId?: string;
};

type CollectedDataResponse = {
    totalCount: number;
    lockedCount: number;
    collectedData: CollectedDataPreview[];
    isPro: boolean;
};

type ReportsResponse = {
    attempts: QuizAttempt[];
    isPro: boolean;
};

type ReportsGateProps = {
    show: boolean;
    onUpgradeClick: () => void;
    children: ReactNode;
};

const ReportsDetailSkeleton = () => {
    const statSkeletons = Array.from({ length: 4 }, (_, index) => index);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12" aria-live="polite" aria-busy="true">
            <span className="sr-only">Carregando relatório...</span>
            <div className="mb-4">
                <Skeleton className="h-8 w-24" />
            </div>
            <div className="mb-3">
                <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-72" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-36" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statSkeletons.map((item) => (
                    <Card key={`stat-${item}`}>
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader className="space-y-3">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <Skeleton className="h-full w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="space-y-3">
                        <Skeleton className="h-5 w-56" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <Skeleton className="h-full w-full" />
                    </CardContent>
                </Card>
            </div>

            <div className="mt-10 space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-44" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row gap-4 md:items-center">
                            <div className="flex-1">
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[320px] w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const ReportsGate = ({ show, onUpgradeClick, children }: ReportsGateProps) => {
    if (!show) return <>{children}</>;

    return (
        <div className="relative">
            <div className="sticky top-[20vh] z-30 flex justify-center pointer-events-none h-0">
                <div className="pointer-events-auto w-full max-w-md px-4 translate-y-12 md:translate-y-16">
                    <Card className="shadow-lg border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                        <CardContent className="flex flex-col items-center text-center p-6 gap-4">
                            <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                <Lock className="h-5 w-5" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="font-semibold text-lg">Desbloqueie todos os dados do relatório</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    No plano Pro você acessa funil, resultados e dados coletados completos deste quiz.
                                </p>
                            </div>
                            <Button onClick={onUpgradeClick} className="w-full sm:w-auto min-w-[200px]">
                                Fazer upgrade
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="relative z-0 opacity-30 pointer-events-none select-none">
                {children}
            </div>
            <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[4px] pointer-events-none" />
        </div>
    );
};

const getFunnelTooltipLabel = (label: string) => {
    if (label === 'Inícios') return 'início';
    if (label === 'Conclusões') return 'conclusão';
    if (/^P\d+/i.test(label)) return `pergunta ${label.replace(/\D/g, '')}`;
    return label.toLowerCase();
};

const MetricLoading = ({ label }: { label: string }) => (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{label}</span>
    </div>
);

const FunnelTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    const value = payload[0].value;
    const stageLabel = getFunnelTooltipLabel(String(data.name));

    return (
        <div className="rounded-md bg-card px-3 py-2 shadow-md border border-border">
            <p className="text-sm font-medium">
                {stageLabel.charAt(0).toUpperCase() + stageLabel.slice(1)}
            </p>
            <p className="text-sm text-muted-foreground">
                {value ?? 0} pessoas
            </p>
        </div>
    );
};

const PieTooltip = ({ active, payload, total }: { active?: boolean; payload?: readonly any[]; total: number }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    const value = data.value;
    const percent = total > 0 ? (value / total) * 100 : 0;
    
    return (
        <div className="rounded-md bg-card px-3 py-2 shadow-md border border-border">
            <p className="text-sm font-medium">
                {data.rawName}
            </p>
            <p className="text-sm text-muted-foreground">
                {value} {value === 1 ? 'pessoa' : 'pessoas'} ({percent.toFixed(0)}%)
            </p>
        </div>
    );
};

const buildMockFunnelData = (questionOrder: string[], questionLabels: Record<string, string>) => {
    const steps = Math.max(1, questionOrder.length);
    const base = Math.max(40, steps * 18);
    const dropRate = 0.08;
    const completionValue = Math.max(6, Math.round(base * 0.55));

    return [
        { name: 'Inícios', value: base, fill: FUNNEL_START_COLOR },
        ...questionOrder.map((qId, index) => ({
            name: questionLabels[qId],
            value: Math.max(8, Math.round(base * (1 - (index + 1) * dropRate))),
            fill: '#82ca9d'
        })),
        { name: 'Conclusões', value: completionValue, fill: '#4ade80' }
    ];
};

const buildMockResultData = (outcomes: Quiz['outcomes'] | undefined) => {
    if (!outcomes?.length) return [];

    const total = Math.max(12, outcomes.length * 4);
    const perOutcome = Math.max(1, Math.floor(total / outcomes.length));
    const remainder = total - perOutcome * outcomes.length;

    return outcomes.map((outcome, index) => {
        const name = outcome.title || `Resultado ${index + 1}`;
        const value = perOutcome + (index < remainder ? 1 : 0);

        return {
            name: `${name} (${value})`,
            value,
            rawName: name
        };
    });
};

// Build mock result data from outcome metadata (visualBuilderData source)
const buildMockResultDataFromMeta = (outcomeMeta: Array<{ id: string; title: string }>) => {
    if (!outcomeMeta?.length) return [];

    const total = Math.max(12, outcomeMeta.length * 4);
    const perOutcome = Math.max(1, Math.floor(total / outcomeMeta.length));
    const remainder = total - perOutcome * outcomeMeta.length;

    return outcomeMeta.map((outcome, index) => {
        const name = outcome.title || `Resultado ${index + 1}`;
        const value = perOutcome + (index < remainder ? 1 : 0);

        return {
            name: `${name} (${value})`,
            value,
            rawName: name
        };
    });
};

export default function QuizReportPage() {
    const params = useParams();
    const quizId = params?.quizId as string;
    const { user } = useAuth();
    const router = useRouter();
    const locale = useLocale();
    const messages = useMessages();
    const { subscription } = useSubscription(user?.uid);
    const isProUser = isPro(subscription);

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [brandKitColors, setBrandKitColors] = useState<BrandKitColors | null>(null);
    const [brandKitLogoUrl, setBrandKitLogoUrl] = useState<string | null>(null);
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [attemptsLoading, setAttemptsLoading] = useState(true);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [collectedData, setCollectedData] = useState<CollectedDataPreview[]>([]);
    const [totalDataCount, setTotalDataCount] = useState(0);
    const [lockedDataCount, setLockedDataCount] = useState(0);
    const [hasProAccess, setHasProAccess] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchData() {
            if (!user || !quizId) return;

            try {
                const quizData = await QuizService.getQuizById(quizId, user.uid);

                if (!quizData) {
                    setQuiz(null);
                    setLoading(false);
                    return;
                }

                setQuiz(quizData);
            } catch (error) {
                console.error('Failed to fetch report data', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user, quizId]);

    useEffect(() => {
        if (!user?.uid || !quiz || quiz.brandKitMode !== 'custom') {
            setBrandKitColors(null);
            setBrandKitLogoUrl(null);
            return;
        }

        let isActive = true;
        getBrandKit(user.uid)
            .then((kit) => {
                if (!isActive) return;
                setBrandKitColors(kit?.colors ?? null);
                setBrandKitLogoUrl(kit?.logoUrl ?? null);
            })
            .catch((error) => {
                if (!isActive) return;
                console.error('Failed to load brand kit for preview', error);
                setBrandKitColors(null);
                setBrandKitLogoUrl(null);
            });

        return () => {
            isActive = false;
        };
    }, [quiz, user?.uid]);

    useEffect(() => {
        async function fetchReports() {
            if (!user || !quizId) return;

            if (!isProUser) {
                setAttempts([]);
                setAttemptsLoading(false);
                return;
            }

            setAttemptsLoading(true);
            try {
                const token = await auth?.currentUser?.getIdToken();
                if (!token) {
                    throw new Error('Missing auth token');
                }

                const response = await fetch(`/api/reports?quizId=${encodeURIComponent(quizId)}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch reports');
                }

                const data = (await response.json()) as ReportsResponse;
                const reportAttempts = data.attempts || [];
                setAttempts(reportAttempts);
            } catch (error) {
                console.error('Failed to fetch report data', error);
            } finally {
                setAttemptsLoading(false);
            }
        }

        fetchReports();
    }, [user, quizId, isProUser]);

    // Sync stats from actual attempts to quiz document (fixes historical data mismatch)
    useEffect(() => {
        if (!quiz || !isProUser || attemptsLoading || attempts.length === 0) return;

        // Calculate valid attempts (excluding owner)
        const validAttempts = attempts.filter(attempt =>
            !attempt.isOwnerAttempt && attempt.userId !== quiz.ownerId
        );

        const starts = validAttempts.length;
        const completions = validAttempts.filter(a => a.status === 'completed').length;

        // Sync to quiz document if different from stored stats
        const currentStarts = quiz.stats?.starts ?? 0;
        const currentCompletions = quiz.stats?.completions ?? 0;

        if (currentStarts !== starts || currentCompletions !== completions) {
            QuizService.syncStats(quizId, { starts, completions });
        }
    }, [quiz, quizId, attempts, attemptsLoading, isProUser]);

    useEffect(() => {
        async function fetchCollectedData() {
            if (!user || !quizId) return;

            if (!isProUser) {
                setCollectedData([]);
                setTotalDataCount(0);
                setLockedDataCount(0);
                setHasProAccess(false);
                setDataLoading(false);
                return;
            }

            setDataLoading(true);
            try {
                const token = await auth?.currentUser?.getIdToken();
                if (!token) {
                    throw new Error('Missing auth token');
                }

                const response = await fetch(`/api/leads?quizId=${encodeURIComponent(quizId)}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch collected data');
                }

                const data = (await response.json()) as CollectedDataResponse;
                setCollectedData(data.collectedData);
                setTotalDataCount(data.totalCount);
                setLockedDataCount(data.lockedCount);
                setHasProAccess(data.isPro);
            } catch (error) {
                console.error('Failed to fetch collected data', error);
            } finally {
                setDataLoading(false);
            }
        }

        fetchCollectedData();
    }, [user, quizId, isProUser]);

    if (loading) {
        return <ReportsDetailSkeleton />;
    }

    if (!quiz) {
        return <div className="p-8">Quiz não encontrado.</div>;
    }

    // --- Data Processing ---

    // 1. Funnel Data (Starts -> Q1 -> Q2 ... -> Completed)
    // Note: Since we track `currentQuestionId`, we can estimate the funnel.
    // Ideally, valid funnel requires tracking *every* step reached.
    // For MVP, if status is completed, they passed all.
    // If started, we look at currentQuestionId.
    // We need to map Question IDs to their order.

    // Extract question and outcome metadata from visualBuilderData (single source of truth)
    const steps = quiz.visualBuilderData?.steps || [];
    const vbOutcomes = quiz.visualBuilderData?.outcomes || [];
    const questionMeta = getQuestionMetadata(steps);
    const outcomeMeta = getOutcomeMetadata(vbOutcomes);

    const questionOrder = questionMeta.map(q => q.id);
    const questionLabels = questionMeta.reduce((acc, q) => {
        acc[q.id] = q.label; // P1, P2...
        return acc;
    }, {} as Record<string, string>);

    const validAttempts = attempts.filter(attempt =>
        !attempt.isOwnerAttempt && attempt.userId !== quiz.ownerId
    );
    const useMockReports = !isProUser;

    const funnelCounts: Record<string, number> = {
        'start': validAttempts.length,
        'completed': validAttempts.filter(a => a.status === 'completed').length,
    };

    // Initialize question counts
    questionOrder.forEach(qId => {
        funnelCounts[qId] = 0;
    });

    validAttempts.forEach(attempt => {
        // If completed, they saw all questions (assuming linear flow)
        if (attempt.status === 'completed') {
            questionOrder.forEach(qId => funnelCounts[qId]++);
        } else if (attempt.currentQuestionId) {
            // If dropped off, they saw all questions UP TO the current one
            const dropIdx = questionOrder.indexOf(attempt.currentQuestionId);
            if (dropIdx !== -1) {
                // They saw 0 to dropIdx
                for (let i = 0; i <= dropIdx; i++) {
                    funnelCounts[questionOrder[i]]++;
                }
            }
        }
    });

    const realFunnelData = [
        { name: 'Inícios', value: funnelCounts.start, fill: FUNNEL_START_COLOR },
        ...questionOrder.map(qId => ({
            name: questionLabels[qId],
            value: funnelCounts[qId],
            fill: '#82ca9d'
        })),
        { name: 'Conclusões', value: funnelCounts.completed, fill: '#4ade80' }
    ];
    const mockFunnelData = buildMockFunnelData(questionOrder, questionLabels);
    const funnelData = useMockReports ? mockFunnelData : realFunnelData;

    // 2. Result Distribution
    const resultCounts: Record<string, number> = {};
    validAttempts.filter(a => a.status === 'completed' && a.resultOutcomeId).forEach(a => {
        const rId = a.resultOutcomeId!;
        resultCounts[rId] = (resultCounts[rId] || 0) + 1;
    });

    const realResultData = Object.entries(resultCounts).map(([rId, count]) => {
        const outcome = outcomeMeta.find(o => o.id === rId);
        const name = outcome?.title || 'Desconhecido';
        return {
            name: `${name} (${count})`, // This is used for the Legend
            value: count,
            rawName: name // Use this for tooltip to avoid duplication
        };
    });

    const mockResultData = buildMockResultDataFromMeta(outcomeMeta);
    const resultData = useMockReports ? mockResultData : realResultData;
    const resultTotal = resultData.reduce((sum, item) => sum + item.value, 0);

    // 3. CTA Clicks (If we tracked them... MVP skips this for now or assumes conversion if needed)
    const totalViews = quiz.stats?.views ?? 0;
    const totalStarts = validAttempts.length;
    const totalCompletions = funnelCounts.completed;
    const totalCollectedData = validAttempts.filter(a =>
        (a.fieldResponses && a.fieldResponses.length > 0) ||
        (a.lead && (a.lead.email || a.lead.phone))
    ).length;
    const startRate = totalViews ? Math.round((totalStarts / totalViews) * 100) : 0;
    const completionRate = totalStarts ? Math.round((totalCompletions / totalStarts) * 100) : 0;

    // Build dynamic columns from field metadata
    const fieldMeta = getFieldMetadata(steps);
    const dynamicColumns: DataColumn[] = [
        { id: 'date', label: 'Data', type: 'date' },
        ...fieldMeta.map(field => ({
            id: field.id,
            label: field.label,
            type: field.type as DataColumn['type'],
        })),
        { id: 'result', label: 'Resultado', type: 'result' as const },
    ];

    // Filter collected data by search term
    const filteredData = collectedData.filter(data => {
        const searchLower = searchTerm.toLowerCase();

        // Search in fieldResponses (new format)
        if (data.fieldResponses) {
            return data.fieldResponses.some(fr =>
                fr.value.toLowerCase().includes(searchLower)
            );
        }

        // Fallback to legacy lead format
        return (
            data.lead?.name?.toLowerCase().includes(searchLower) ||
            data.lead?.email?.toLowerCase().includes(searchLower) ||
            data.lead?.phone?.includes(searchLower)
        );
    });

    const handleExportCSV = () => {
        if (filteredData.length === 0) return;

        const headers = dynamicColumns.map(col => col.label);
        const csvContent = [
            headers.join(','),
            ...filteredData.map(data => {
                return dynamicColumns.map(column => {
                    if (column.id === 'date' && data.startedAt) {
                        return format(new Date(data.startedAt), 'dd/MM/yyyy HH:mm');
                    } else if (column.id === 'result') {
                        const resultName = outcomeMeta.find(o => o.id === data.resultOutcomeId)?.title || 'N/A';
                        return `"${resultName}"`;
                    } else {
                        // Find value in fieldResponses (new format)
                        if (data.fieldResponses) {
                            const response = data.fieldResponses.find(fr => fr.fieldId === column.id);
                            return `"${response?.value || ''}"`;
                        }
                        // Fallback to legacy lead format
                        const legacyValue = data.lead?.[column.id as keyof typeof data.lead];
                        return `"${legacyValue || ''}"`;
                    }
                }).join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `dados_coletados_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportClick = () => {
        if (!hasProAccess) {
            setShowUpgradeModal(true);
            return;
        }
        handleExportCSV();
    };

    const handleUpgradeClick = () => {
        setShowUpgradeModal(true);
    };

    const visibleDataCount = hasProAccess ? filteredData.length : collectedData.length;

    // Transform collected data to table rows with dynamic fields
    const dataRows: DataRow[] = filteredData.map((data) => {
        const fields: Record<string, string> = {};

        // Populate fields from fieldResponses (new format)
        if (data.fieldResponses) {
            data.fieldResponses.forEach(response => {
                fields[response.fieldId] = response.value;
            });
        } else if (data.lead) {
            // Fallback: populate from legacy lead format
            // Match legacy fields to current field metadata by type
            fieldMeta.forEach(field => {
                if (field.type === 'email' && data.lead?.email) {
                    fields[field.id] = data.lead.email;
                } else if (field.type === 'phone' && data.lead?.phone) {
                    fields[field.id] = data.lead.phone;
                } else if (field.type === 'text' && data.lead?.name && !fields[field.id]) {
                    fields[field.id] = data.lead.name;
                }
            });
        }

        return {
            id: data.id,
            startedAt: data.startedAt,
            resultTitle: outcomeMeta.find(o => o.id === data.resultOutcomeId)?.title || '-',
            fields,
        };
    });

    const dataTitle = 'Dados coletados';
    const displayLockedCount = hasProAccess ? lockedDataCount : 10;
    const showChartsLoading = isProUser && attemptsLoading;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">
            <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
            <div className="mb-3">
                {quiz.isPublished ? (
                    <Badge variant="published" className="flex items-center gap-1 rounded shadow-sm border-none w-fit">
                        <Globe size={10} /> Publicado
                    </Badge>
                ) : (
                    <Badge variant="draft" className="flex items-center gap-1 rounded shadow-sm border-none w-fit">
                        <Lock size={10} /> Rascunho
                    </Badge>
                )}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold truncate">{quiz.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        Análise detalhada de performance
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push(localizePathname(`/visual-builder/${quizId}`, locale))}
                    >
                        <Edit3 className="mr-2 h-4 w-4" />
                        {messages.common.buttons.editQuiz}
                    </Button>
                    <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Pré-visualizar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
                        <CardTitle className="text-sm font-medium">Visitas totais</CardTitle>
                        <Eye className="h-4 w-4" style={{ color: FUNNEL_START_COLOR }} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold h-9 flex items-center">{totalViews}</div>
                        <p className="text-xs text-muted-foreground mt-1">Acessaram o link do quiz</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
                        <CardTitle className="text-sm font-medium">Inícios totais</CardTitle>
                        <Play className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold h-9 flex items-center">
                            {!isProUser ? (
                                <span className="inline-flex items-center justify-center">
                                    <Lock className="h-6 w-6 text-muted-foreground" />
                                    <span className="sr-only">Disponível no Pro</span>
                                </span>
                            ) : attemptsLoading ? (
                                <MetricLoading label="Atualizando..." />
                            ) : (
                                totalStarts
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {!isProUser ? '? iniciaram o quiz' : attemptsLoading ? (
                                'Carregando métricas...'
                            ) : (
                                `${startRate}% iniciaram o quiz`
                            )}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
                        <CardTitle className="text-sm font-medium">Conclusões</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold h-9 flex items-center">
                            {!isProUser ? (
                                <span className="inline-flex items-center justify-center">
                                    <Lock className="h-6 w-6 text-muted-foreground" />
                                    <span className="sr-only">Disponível no Pro</span>
                                </span>
                            ) : attemptsLoading ? (
                                <MetricLoading label="Atualizando..." />
                            ) : (
                                totalCompletions
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {!isProUser ? '? concluíram o quiz' : attemptsLoading ? (
                                'Carregando métricas...'
                            ) : (
                                `${completionRate}% concluíram o quiz`
                            )}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
                        <CardTitle className="text-sm font-medium">Dados coletados</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold h-9 flex items-center">
                            {!isProUser ? (
                                <span className="inline-flex items-center justify-center">
                                    <Lock className="h-6 w-6 text-muted-foreground" />
                                    <span className="sr-only">Disponível no Pro</span>
                                </span>
                            ) : attemptsLoading ? (
                                <MetricLoading label="Atualizando..." />
                            ) : (
                                totalCollectedData
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Respostas com dados informados</p>
                    </CardContent>
                </Card>
            </div>

            <ReportsGate show={!isProUser} onUpgradeClick={handleUpgradeClick}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Funnel Chart */}
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Funil de Conversão</CardTitle>
                            <CardDescription>
                                Onde os usuários estão abandonando o quiz
                                <br />
                                <span className="text-xs font-normal opacity-80">
                                    Número de pessoas que chegaram à cada etapa
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {showChartsLoading ? (
                                <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Carregando funil...
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} content={<FunnelTooltip />} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            <LabelList 
                                                dataKey="value" 
                                                position="insideRight" 
                                                fill="#fff" 
                                                fontSize={12} 
                                                fontWeight="bold"
                                                offset={10}
                                            />
                                            {funnelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Results Distribution */}
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Distribuição de Resultados</CardTitle>
                            <CardDescription>Quais resultados os usuários estão obtendo</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            {showChartsLoading ? (
                                <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Carregando resultados...
                                </div>
                            ) : resultData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                                        <Pie
                                            data={resultData}
                                            cx="50%"
                                            cy="45%"
                                            labelLine={true}
                                            outerRadius={90}
                                            fill={FUNNEL_START_COLOR}
                                            dataKey="value"
                                            label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                                        >
                                            {resultData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            content={({ active, payload }) => (
                                                <PieTooltip active={active} payload={payload} total={resultTotal} />
                                            )} 
                                        />
                                        <Legend 
                                            layout="horizontal" 
                                            verticalAlign="bottom" 
                                            align="center"
                                            wrapperStyle={{ paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    Sem dados suficientes
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>

                <div className="mt-10">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold">{dataTitle}</h2>
                        <p className="text-muted-foreground mt-1">
                            Veja os dados coletados nas respostas deste quiz.
                        </p>
                    </div>
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex flex-col md:flex-row gap-4 md:items-center">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar nos dados..."
                                            className="pl-8"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="md:self-start h-10"
                                    onClick={handleExportClick}
                                    disabled={hasProAccess && filteredData.length === 0}
                                >
                                    {hasProAccess ? (
                                        <Download className="mr-2 h-4 w-4" />
                                    ) : (
                                        <Lock className="mr-2 h-4 w-4" />
                                    )}
                                    {hasProAccess ? 'Exportar CSV' : 'Exportar CSV (Pro)'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <LeadsTable
                                columns={dynamicColumns}
                                rows={dataRows}
                                loading={dataLoading}
                                lockedCount={displayLockedCount}
                                visibleCount={visibleDataCount}
                                totalCount={totalDataCount}
                                onUpgradeClick={handleUpgradeClick}
                                showFooter={!dataLoading}
                                showPreviewCounts={false}
                            />
                        </CardContent>
                    </Card>
                </div>
            </ReportsGate>

            <UpgradeModal
                open={showUpgradeModal}
                reason="pro-feature"
                onOpenChange={setShowUpgradeModal}
            />

            <PreviewOverlay
                open={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                quiz={quiz}
                brandKitColors={brandKitColors}
                brandKitLogoUrl={brandKitLogoUrl}
                warningText="Modo Preview — Pré-visualização do quiz"
            />
        </div>
    );
}
