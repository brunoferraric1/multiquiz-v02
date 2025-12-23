'use client';

import { useEffect, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { QuizService } from '@/lib/services/quiz-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import type { Quiz, QuizAttempt } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Play, CheckCircle, Mail } from 'lucide-react';
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
    Legend
} from 'recharts';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const getFunnelTooltipLabel = (label: string) => {
    if (label === 'Inícios') return 'início';
    if (label === 'Finais') return 'final';
    if (/^P\d+/i.test(label)) return `pergunta ${label.replace(/\D/g, '')}`;
    return label.toLowerCase();
};

const FunnelTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload?.length) return null;

    const [{ name, value }] = payload;
    const stageLabel = getFunnelTooltipLabel(String(name));

    return (
        <div className="rounded-md bg-card px-3 py-2 shadow-md">
            <p className="text-sm text-card-foreground">
                Pessoas que chegaram a {stageLabel}: {value ?? 0}
            </p>
        </div>
    );
};

export default function QuizReportPage() {
    const params = useParams();
    const quizId = params?.quizId as string;
    const { user } = useAuth();
    const router = useRouter();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user || !quizId) return;

            try {
                const [quizData, allAttempts] = await Promise.all([
                    QuizService.getQuizById(quizId, user.uid),
                    AnalyticsService.getQuizAttempts(quizId)
                ]);

                if (!quizData) {
                    setQuiz(null);
                    setLoading(false);
                    return;
                }

                // Filter out attempts by the owner to avoid skewing metrics
                const validAttempts = allAttempts.filter(attempt =>
                    !attempt.isOwnerAttempt && attempt.userId !== quizData.ownerId
                );

                setQuiz(quizData);
                setAttempts(validAttempts);
            } catch (error) {
                console.error('Failed to fetch report data', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user, quizId]);

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

    const funnelCounts: Record<string, number> = {
        'start': attempts.length,
        'completed': attempts.filter(a => a.status === 'completed').length,
    };

    // Initialize question counts
    questionOrder.forEach(qId => {
        funnelCounts[qId] = 0;
    });

    attempts.forEach(attempt => {
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

    const funnelData = [
        { name: 'Inícios', value: funnelCounts.start, fill: '#8884d8' },
        ...questionOrder.map(qId => ({
            name: questionLabels[qId],
            value: funnelCounts[qId],
            fill: '#82ca9d'
        })),
        { name: 'Finais', value: funnelCounts.completed, fill: '#4ade80' }
    ];

    // 2. Result Distribution
    const resultCounts: Record<string, number> = {};
    attempts.filter(a => a.status === 'completed' && a.resultOutcomeId).forEach(a => {
        const rId = a.resultOutcomeId!;
        resultCounts[rId] = (resultCounts[rId] || 0) + 1;
    });

    const resultData = Object.entries(resultCounts).map(([rId, count]) => {
        const outcome = quiz.outcomes?.find(o => o.id === rId);
        return {
            name: outcome?.title || 'Desconhecido',
            value: count
        };
    });

    // 3. CTA Clicks (If we tracked them... MVP skips this for now or assumes conversion if needed)

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Relatórios
            </Button>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold truncate">{quiz.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        Análise detalhada de performance
                    </p>
                </div>
                <div className="flex gap-4">
                    {/* Placeholder for export if needed specifically for this report */}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
                        <CardTitle className="text-sm font-medium">Inícios Totais</CardTitle>
                        <Play className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{attempts.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
                        <CardTitle className="text-sm font-medium">Conclusões</CardTitle>
                        <CheckCircle className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{funnelCounts.completed}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Taxa: {attempts.length ? Math.round((funnelCounts.completed / attempts.length) * 100) : 0}%
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
                        <CardTitle className="text-sm font-medium">Leads Capturados</CardTitle>
                        <Mail className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {attempts.filter(a => a.lead && (a.lead.email || a.lead.phone)).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Funnel Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Funil de Conversão</CardTitle>
                        <CardDescription>Onde os usuários estão abandonando o quiz</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<FunnelTooltip />} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
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
                    <CardContent className="h-[300px]">
                        {resultData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={resultData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }: { name?: string; percent?: number }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {resultData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" />
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
        </div>
    );
}
