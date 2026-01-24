'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSubscription, isPro } from '@/lib/services/subscription-service';
import { QuizService } from '@/lib/services/quiz-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import type { Quiz } from '@/types';
import { useMessages, useLocale } from '@/lib/i18n/context';
import { localizePathname } from '@/lib/i18n/paths';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { BarChart3, Eye, Play, CheckCircle2, Globe, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

type QuizStats = {
    starts: number;
    completions: number;
};

export default function ReportsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const locale = useLocale();
    const messages = useMessages();
    const dashboard = messages.dashboard;
    const reportsCopy = dashboard.reportsList;
    const { subscription } = useSubscription(user?.uid);
    const isProUser = isPro(subscription);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [accurateStats, setAccurateStats] = useState<Record<string, QuizStats>>({});
    const [showDraftsWithData, setShowDraftsWithData] = useState(false);

    useEffect(() => {
        async function fetchQuizzes() {
            if (!user) return;
            try {
                const data = await QuizService.getUserQuizzes(user.uid);
                setQuizzes(data);
            } catch (error) {
                console.error('Failed to fetch quizzes', error);
            } finally {
                setLoading(false);
            }
        }

        fetchQuizzes();
    }, [user]);

    // Fetch accurate stats from attempts for Pro users
    useEffect(() => {
        async function fetchAccurateStats() {
            if (!user || !isProUser || quizzes.length === 0) {
                setStatsLoading(false);
                return;
            }

            setStatsLoading(true);
            try {
                const statsMap: Record<string, QuizStats> = {};

                // Fetch stats for all quizzes in parallel
                await Promise.all(
                    quizzes.map(async (quiz) => {
                        const stats = await AnalyticsService.calculateQuizStats(quiz.id, quiz.ownerId);
                        statsMap[quiz.id] = stats;

                        // Sync stats to quiz document if they differ
                        const currentStarts = quiz.stats?.starts ?? 0;
                        const currentCompletions = quiz.stats?.completions ?? 0;
                        if (currentStarts !== stats.starts || currentCompletions !== stats.completions) {
                            QuizService.syncStats(quiz.id, stats);
                        }
                    })
                );

                setAccurateStats(statsMap);
            } catch (error) {
                console.error('Failed to fetch accurate stats', error);
            } finally {
                setStatsLoading(false);
            }
        }

        fetchAccurateStats();
    }, [user, isProUser, quizzes]);

    // Helper to get stats for a quiz - uses accurate stats if available, falls back to stored stats
    const getStarts = (quiz: Quiz): number => {
        if (isProUser && accurateStats[quiz.id]) {
            return accurateStats[quiz.id].starts;
        }
        return quiz.stats?.starts || 0;
    };

    const getCompletions = (quiz: Quiz): number => {
        if (isProUser && accurateStats[quiz.id]) {
            return accurateStats[quiz.id].completions;
        }
        return quiz.stats?.completions || 0;
    };

    if (loading) {
        return <div className="p-8">{reportsCopy.loading}</div>;
    }

    const visibleQuizzes = quizzes.filter((quiz) => {
        if (quiz.isPublished) return true;
        if (!showDraftsWithData) return false;
        if (quiz.publishedAt != null) return true;
        const stats = quiz.stats;
        return Boolean(stats?.views || stats?.starts || stats?.completions);
    });

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">{reportsCopy.title}</h1>
                    <p className="text-muted-foreground">
                        {reportsCopy.subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-3 md:justify-end">
                    <label
                        htmlFor="reports-show-drafts"
                        className="text-sm font-medium text-muted-foreground cursor-[var(--cursor-interactive)]"
                    >
                        {reportsCopy.toggleLabel}
                    </label>
                    <Switch
                        id="reports-show-drafts"
                        checked={showDraftsWithData}
                        onCheckedChange={setShowDraftsWithData}
                        className="cursor-[var(--cursor-interactive)]"
                    />
                </div>
            </div>

            {visibleQuizzes.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <p className="text-lg font-medium mb-2">
                            {reportsCopy.emptyTitle}
                        </p>
                        <p className="text-muted-foreground mb-4">
                            {reportsCopy.emptyDescription}
                        </p>
                        <Button onClick={() => router.push(localizePathname('/dashboard', locale))}>
                            {reportsCopy.goToQuizzes}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleQuizzes.map((quiz) => (
                        <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex flex-col gap-2">
                                    {quiz.isPublished ? (
                                        <Badge
                                            variant="published"
                                            className="flex items-center gap-1 rounded shadow-sm border-none shrink-0 self-start"
                                        >
                                            <Globe size={10} /> {dashboard.quizCard.published}
                                        </Badge>
                                    ) : (
                                        <Badge variant="draft" className="flex items-center gap-1 rounded shadow-sm border-none shrink-0 self-start">
                                            <Lock size={10} /> {dashboard.quizCard.draft}
                                        </Badge>
                                    )}
                                    <CardTitle className="truncate text-lg min-w-0">{quiz.title}</CardTitle>
                                </div>
                                <CardDescription className="line-clamp-1">
                                    {quiz.description || dashboard.quizCard.noDescription}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="flex flex-col items-center text-center p-2 bg-muted/50 rounded-lg">
                                        <Eye className="h-4 w-4 mb-1 text-muted-foreground" />
                                        <div className="text-lg font-bold h-7 flex items-center justify-center">
                                            {quiz.stats?.views || 0}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{reportsCopy.stats.views}</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center p-2 bg-muted/50 rounded-lg">
                                        <Play className="h-4 w-4 mb-1 text-blue-500" />
                                        <div className="text-lg font-bold h-7 flex items-center justify-center">
                                            {!isProUser ? (
                                                <>
                                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="sr-only">{reportsCopy.proOnly}</span>
                                                </>
                                            ) : statsLoading ? (
                                                <Skeleton className="h-5 w-6" />
                                            ) : (
                                                getStarts(quiz)
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{reportsCopy.stats.starts}</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center p-2 bg-muted/50 rounded-lg">
                                        <CheckCircle2 className="h-4 w-4 mb-1 text-green-500" />
                                        <div className="text-lg font-bold h-7 flex items-center justify-center">
                                            {!isProUser ? (
                                                <>
                                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="sr-only">{reportsCopy.proOnly}</span>
                                                </>
                                            ) : statsLoading ? (
                                                <Skeleton className="h-5 w-6" />
                                            ) : (
                                                getCompletions(quiz)
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{reportsCopy.stats.completions}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline" onClick={() => router.push(`/dashboard/reports/${quiz.id}`)}>
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    {reportsCopy.viewDetails}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
