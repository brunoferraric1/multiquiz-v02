'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { QuizService } from '@/lib/services/quiz-service';
import { auth } from '@/lib/firebase';
import type { Quiz } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadsTable } from '@/components/dashboard/leads-table';
import { UpgradeModal } from '@/components/upgrade-modal';
import { Download, Lock, Search } from 'lucide-react';
import { format } from 'date-fns';

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

export default function LeadsPage() {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [leads, setLeads] = useState<LeadPreview[]>([]);
    const [totalLeadCount, setTotalLeadCount] = useState(0);
    const [lockedLeadCount, setLockedLeadCount] = useState(0);
    const [hasProAccess, setHasProAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const [selectedQuizId, setSelectedQuizId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function init() {
            if (!user) return;
            try {
                const quizzesData = await QuizService.getUserQuizzes(user.uid);
                setQuizzes(quizzesData);

                const token = await auth?.currentUser?.getIdToken();
                if (!token) {
                    throw new Error('Missing auth token');
                }

                const response = await fetch('/api/leads', {
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
                setLoading(false);
            }
        }
        init();
    }, [user]);

    const filteredLeads = leads.filter(lead => {
        const matchesQuiz = selectedQuizId === 'all' || lead.quizId === selectedQuizId;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            lead.lead?.name?.toLowerCase().includes(searchLower) ||
            lead.lead?.email?.toLowerCase().includes(searchLower) ||
            lead.lead?.phone?.includes(searchLower);

        return matchesQuiz && matchesSearch;
    });

    const handleExportCSV = () => {
        if (filteredLeads.length === 0) return;

        const headers = ['Data', 'Nome', 'Email', 'Telefone', 'Quiz', 'Resultado'];
        const csvContent = [
            headers.join(','),
            ...filteredLeads.map(lead => {
                const quizName = quizzes.find(q => q.id === lead.quizId)?.title || 'Quiz Desconhecido';
                const quiz = quizzes.find(q => q.id === lead.quizId);
                const resultName = quiz?.outcomes?.find(o => o.id === lead.resultOutcomeId)?.title || 'N/A';

                return [
                    format(new Date(lead.startedAt), 'dd/MM/yyyy HH:mm'),
                    `"${lead.lead?.name || ''}"`,
                    `"${lead.lead?.email || ''}"`,
                    `"${lead.lead?.phone || ''}"`,
                    `"${quizName}"`,
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

    const leadRows = filteredLeads.map((lead) => {
        const quiz = quizzes.find(q => q.id === lead.quizId);
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
    const displayLockedCount = hasProAccess ? lockedLeadCount : 10;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Leads capturados</h1>
                <p className="text-muted-foreground mt-1">
                    Visualize e exporte os contatos capturados pelos seus quizzes.
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
                        <div className="w-full md:w-[250px]">
                            <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filtrar por Quiz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Quizzes</SelectItem>
                                    {quizzes.map(q => (
                                        <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="outline"
                            className="md:self-start h-10"
                            onClick={handleExportClick}
                            disabled={loading || (hasProAccess && filteredLeads.length === 0)}
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
                        lockedCount={displayLockedCount}
                        totalCount={totalLeadCount}
                        onUpgradeClick={handleUpgradeClick}
                        loading={loading}
                        showFooter={!loading}
                        showPreviewCounts={false}
                        visibleCount={filteredLeads.length}
                    />
                </CardContent>
            </Card>

            <UpgradeModal
                open={showUpgradeModal}
                reason="pro-feature"
                onOpenChange={setShowUpgradeModal}
            />
        </div>
    );
}
