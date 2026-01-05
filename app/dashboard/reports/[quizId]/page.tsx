'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSubscription, isPro } from '@/lib/services/subscription-service';
import { QuizService } from '@/lib/services/quiz-service';
import { auth } from '@/lib/firebase';
import type { Quiz, QuizAttempt } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LeadsTable } from '@/components/dashboard/leads-table';
import { UpgradeModal } from '@/components/upgrade-modal';
import { QuizPlayer } from '@/components/quiz/quiz-player';
import { ArrowLeft, CheckCircle2, Download, Eye, Globe, Lock, Mail, Play, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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

type LeadPreview = {
    id: string;
    quizId: string;
    startedAt: number;
    lead?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    resultOutcomeId?: string;
};

type LeadsResponse = {
    totalCount: number;
    lockedCount: number;
    leads: LeadPreview[];
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
                                    No plano Pro você acessa funil, resultados e leads completos deste quiz.
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

export default function QuizReportPage() {
    const params = useParams();
    const quizId = params?.quizId as string;
    const { user } = useAuth();
    const router = useRouter();
    const { subscription } = useSubscription(user?.uid);
    const isProUser = isPro(subscription);

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [leads, setLeads] = useState<LeadPreview[]>([]);
    const [totalLeadCount, setTotalLeadCount] = useState(0);
    const [lockedLeadCount, setLockedLeadCount] = useState(0);
    const [hasProAccess, setHasProAccess] = useState(false);
    const [leadsLoading, setLeadsLoading] = useState(true);
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
        async function fetchReports() {
            if (!user || !quizId) return;

            if (!isProUser) {
                setAttempts([]);
                return;
            }

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
            }
        }

        fetchReports();
    }, [user, quizId, isProUser]);

    useEffect(() => {
        async function fetchLeads() {
            if (!user || !quizId) return;

            if (!isProUser) {
                setLeads([]);
                setTotalLeadCount(0);
                setLockedLeadCount(0);
                setHasProAccess(false);
                setLeadsLoading(false);
                return;
            }

            setLeadsLoading(true);
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
                    throw new Error('Failed to fetch leads');
                }

                const data = (await response.json()) as LeadsResponse;
                setLeads(data.leads);
                setTotalLeadCount(data.totalCount);
                setLockedLeadCount(data.lockedCount);
                setHasProAccess(data.isPro);
            } catch (error) {
                console.error('Failed to fetch leads data', error);
            } finally {
                setLeadsLoading(false);
            }
        }

        fetchLeads();
    }, [user, quizId, isProUser]);

    if (loading) {
        return <div className="p-8">Carregando dados...</div>;
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

    const questionOrder = (quiz.questions || []).map(q => q.id);
    const questionLabels = (quiz.questions || []).reduce((acc, q, idx) => {
        acc[q.id] = `P${idx + 1}`; // Pergunta 1, 2...
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
        const outcome = quiz.outcomes?.find(o => o.id === rId);
        const name = outcome?.title || 'Desconhecido';
        return {
            name: `${name} (${count})`, // This is used for the Legend
            value: count,
            rawName: name // Use this for tooltip to avoid duplication
        };
    });

    const mockResultData = buildMockResultData(quiz.outcomes);
    const resultData = useMockReports ? mockResultData : realResultData;
    const resultTotal = resultData.reduce((sum, item) => sum + item.value, 0);

    // 3. CTA Clicks (If we tracked them... MVP skips this for now or assumes conversion if needed)
    const totalViews = quiz.stats?.views ?? 0;
    const totalStarts = validAttempts.length;
    const totalCompletions = funnelCounts.completed;
    const totalLeads = validAttempts.filter(a => a.lead && (a.lead.email || a.lead.phone)).length;
    const startRate = totalViews ? Math.round((totalStarts / totalViews) * 100) : 0;
    const completionRate = totalStarts ? Math.round((totalCompletions / totalStarts) * 100) : 0;

    const filteredLeads = leads.filter(lead => {
        const searchLower = searchTerm.toLowerCase();
        return (
            lead.lead?.name?.toLowerCase().includes(searchLower) ||
            lead.lead?.email?.toLowerCase().includes(searchLower) ||
            lead.lead?.phone?.includes(searchLower)
        );
    });

    const handleExportCSV = () => {
        if (filteredLeads.length === 0) return;

        const headers = ['Data', 'Nome', 'Email', 'Telefone', 'Quiz', 'Resultado'];
        const csvContent = [
            headers.join(','),
            ...filteredLeads.map(lead => {
                const quizTitle = quiz?.title || 'Quiz Desconhecido';
                const resultName = quiz?.outcomes?.find(o => o.id === lead.resultOutcomeId)?.title || 'N/A';

                return [
                    format(new Date(lead.startedAt), 'dd/MM/yyyy HH:mm'),
                    `"${lead.lead?.name || ''}"`,
                    `"${lead.lead?.email || ''}"`,
                    `"${lead.lead?.phone || ''}"`,
                    `"${quizTitle}"`,
                    `"${resultName}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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

    const visibleLeadCount = hasProAccess ? filteredLeads.length : leads.length;
    const leadRows = filteredLeads.map((lead) => {
        const resultName = quiz?.outcomes?.find(o => o.id === lead.resultOutcomeId)?.title || '-';

        return {
            id: lead.id,
            startedAt: lead.startedAt,
            name: lead.lead?.name,
            email: lead.lead?.email,
            phone: lead.lead?.phone,
            quizTitle: quiz?.title || 'Desconhecido',
            resultTitle: resultName,
        };
    });
    const leadsTitle = leadsLoading || !isProUser
        ? 'Leads capturados'
        : totalLeadCount === 1
            ? '1 lead capturado'
            : `${totalLeadCount} leads capturados`;

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
                <div className="flex gap-4">
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
                        <div className="text-3xl font-bold">{totalViews}</div>
                        <p className="text-xs text-muted-foreground mt-1">Acessaram o link do quiz</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
                        <CardTitle className="text-sm font-medium">Inícios totais</CardTitle>
                        <Play className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {isProUser ? (
                                totalStarts
                            ) : (
                                <span className="inline-flex items-center">
                                    <Lock className="h-7 w-7 text-muted-foreground" />
                                    <span className="sr-only">Disponível no Pro</span>
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isProUser ? `${startRate}% iniciaram o quiz` : '? iniciaram o quiz'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
                        <CardTitle className="text-sm font-medium">Conclusões</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {isProUser ? (
                                totalCompletions
                            ) : (
                                <span className="inline-flex items-center">
                                    <Lock className="h-7 w-7 text-muted-foreground" />
                                    <span className="sr-only">Disponível no Pro</span>
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isProUser ? `${completionRate}% concluíram o quiz` : '? concluíram o quiz'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
                        <CardTitle className="text-sm font-medium">Leads capturados</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {isProUser ? (
                                totalLeads
                            ) : (
                                <span className="inline-flex items-center">
                                    <Lock className="h-7 w-7 text-muted-foreground" />
                                    <span className="sr-only">Disponível no Pro</span>
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Leads com contato informado</p>
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
                        </CardContent>
                    </Card>

                    {/* Results Distribution */}
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Distribuição de Resultados</CardTitle>
                            <CardDescription>Quais resultados os usuários estão obtendo</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            {resultData.length > 0 ? (
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
                        <h2 className="text-2xl font-semibold">{leadsTitle}</h2>
                        <p className="text-muted-foreground mt-1">
                            Veja os contatos gerados por este quiz.
                        </p>
                    </div>
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex flex-col md:flex-row gap-4 md:items-center">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por nome, email..."
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
                                    disabled={hasProAccess && filteredLeads.length === 0}
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
                                rows={leadRows}
                                loading={leadsLoading}
                                lockedCount={lockedLeadCount}
                                visibleCount={visibleLeadCount}
                                totalCount={totalLeadCount}
                                onUpgradeClick={handleUpgradeClick}
                                showFooter={!leadsLoading}
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
                        className="fixed inset-0 z-50 flex bg-background/95 backdrop-blur-sm"
                    >
                        <div className="relative flex h-full w-full flex-col bg-background">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsPreviewOpen(false)}
                                className="absolute top-4 right-4 z-10 rounded-full bg-background/60 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background/80 hover:text-foreground"
                                aria-label="Fechar pré-visualização"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <main className="flex-1 overflow-auto bg-muted/40">
                                <QuizPlayer quiz={quiz} mode="preview" onExit={() => setIsPreviewOpen(false)} />
                            </main>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
