'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSubscription, isPro } from '@/lib/services/subscription-service';
import { QuizService } from '@/lib/services/quiz-service';
import type { Quiz } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Eye, Play, CheckCircle2, Globe, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { subscription } = useSubscription(user?.uid);
    const isProUser = isPro(subscription);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return <div className="p-8">Carregando relatórios...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold">Relatórios de Performance</h1>
                <p className="text-muted-foreground">
                    Acompanhe o desempenho de seus quizzes e otimize suas conversões.
                </p>
            </div>

            {quizzes.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Você ainda não tem quizzes criados.</p>
                        <Button onClick={() => router.push('/builder')}>Criar meu primeiro Quiz</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                        <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex flex-col gap-2">
                                    {quiz.isPublished ? (
                                        <Badge
                                            variant="published"
                                            className="flex items-center gap-1 rounded shadow-sm border-none shrink-0 self-start"
                                        >
                                            <Globe size={10} /> Publicado
                                        </Badge>
                                    ) : (
                                        <Badge variant="draft" className="flex items-center gap-1 rounded shadow-sm border-none shrink-0 self-start">
                                            <Lock size={10} /> Rascunho
                                        </Badge>
                                    )}
                                    <CardTitle className="truncate text-lg min-w-0">{quiz.title}</CardTitle>
                                </div>
                                <CardDescription className="line-clamp-1">{quiz.description || 'Sem descrição'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="flex flex-col items-center text-center p-2 bg-muted/50 rounded-lg">
                                        <Eye className="h-4 w-4 mb-1 text-muted-foreground" />
                                        <div className="text-lg font-bold h-7 flex items-center justify-center">
                                            {quiz.stats?.views || 0}
                                        </div>
                                        <span className="text-xs text-muted-foreground">Visitas totais</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center p-2 bg-muted/50 rounded-lg">
                                        <Play className="h-4 w-4 mb-1 text-blue-500" />
                                        <div className="text-lg font-bold h-7 flex items-center justify-center">
                                            {isProUser ? (
                                                quiz.stats?.starts || 0
                                            ) : (
                                                <>
                                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="sr-only">Disponível no Pro</span>
                                                </>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">Inícios totais</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center p-2 bg-muted/50 rounded-lg">
                                        <CheckCircle2 className="h-4 w-4 mb-1 text-green-500" />
                                        <div className="text-lg font-bold h-7 flex items-center justify-center">
                                            {isProUser ? (
                                                quiz.stats?.completions || 0
                                            ) : (
                                                <>
                                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="sr-only">Disponível no Pro</span>
                                                </>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">Conclusões</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline" onClick={() => router.push(`/dashboard/reports/${quiz.id}`)}>
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Ver Detalhes
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
