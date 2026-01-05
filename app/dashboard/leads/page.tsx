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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

    const leadLabel = (count: number) => (count === 1 ? '1 lead' : `${count} leads`);
    const visibleLeadCount = hasProAccess ? filteredLeads.length : leads.length;
    const visibleLeadLabel = leadLabel(visibleLeadCount);
    const totalLeadLabel = leadLabel(totalLeadCount);

    // Ensure we render enough height to cover the upgrade card
    // Use a transparent spacer row if actual locked rows aren't tall enough
    const MAX_LOCKED_ROWS_DISPLAY = 20;
    const displayLockedRows = lockedLeadCount > 0 
        ? Math.min(lockedLeadCount, MAX_LOCKED_ROWS_DISPLAY) 
        : 0;
    
    const placeholderRows = Array.from({ length: displayLockedRows });
    const lockedRowPadding = 'py-3';
    const columnWidths = {
        date: 'min-w-[9.5rem] whitespace-nowrap sm:min-w-[auto] sm:whitespace-normal',
        name: 'min-w-[9rem] sm:min-w-[auto]',
        email: 'min-w-[12.5rem] whitespace-nowrap sm:min-w-[auto] sm:whitespace-normal',
        phone: 'min-w-[10rem] whitespace-nowrap sm:min-w-[auto] sm:whitespace-normal',
        quiz: 'min-w-[15rem] sm:min-w-[auto]',
        result: 'min-w-[11rem] sm:min-w-[auto]',
    };
    const renderUpgradeCard = (className: string) => (
        <Card className={`shadow-lg border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 ${className}`}>
            <CardContent className="flex flex-col items-center text-center p-6 gap-4">
                <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                    <h3 className="font-semibold text-lg">Desbloqueie todos os seus leads</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Você está vendo <span className="font-medium text-foreground">{visibleLeadLabel}</span> de <span className="font-medium text-foreground">{totalLeadLabel}</span>.
                        <br />
                        No plano Pro você acessa os dados de todos os leads que responderam o seu quiz.
                    </p>
                </div>
                <Button onClick={handleUpgradeClick} className="w-full sm:w-auto min-w-[200px]">
                    Fazer upgrade
                </Button>
            </CardContent>
        </Card>
    );
    
    // Calculate if we need extra space for the upgrade card (approx 384px height)
    const ESTIMATED_ROW_HEIGHT = 53;
    const MIN_SECTION_HEIGHT = 384;
    const currentSectionHeight = displayLockedRows * ESTIMATED_ROW_HEIGHT;
    const spacerHeight = Math.max(0, MIN_SECTION_HEIGHT - currentSectionHeight);

    if (loading) {
        return <div className="p-8">Carregando leads...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">
                    {totalLeadCount === 1 ? '1 lead capturado' : `${totalLeadCount} leads capturados`}
                </h1>
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
                    <div className="relative rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className={columnWidths.date}>Data</TableHead>
                                    <TableHead className={columnWidths.name}>Nome</TableHead>
                                    <TableHead className={columnWidths.email}>Email</TableHead>
                                    <TableHead className={columnWidths.phone}>Telefone</TableHead>
                                    <TableHead className={columnWidths.quiz}>Quiz</TableHead>
                                    <TableHead className={columnWidths.result}>Resultado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLeads.length === 0 && displayLockedRows === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Nenhum lead encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {filteredLeads.map((lead) => {
                                            const quiz = quizzes.find(q => q.id === lead.quizId);
                                            const resultName = quiz?.outcomes?.find(o => o.id === lead.resultOutcomeId)?.title || '-';

                                            return (
                                                <TableRow key={lead.id}>
                                                    <TableCell className={columnWidths.date}>
                                                        {lead.startedAt ? format(new Date(lead.startedAt), 'dd/MM/yyyy HH:mm') : '-'}
                                                    </TableCell>
                                                    <TableCell className={`${columnWidths.name} font-medium`}>{lead.lead?.name || '-'}</TableCell>
                                                    <TableCell className={columnWidths.email}>{lead.lead?.email || '-'}</TableCell>
                                                    <TableCell className={columnWidths.phone}>{lead.lead?.phone || '-'}</TableCell>
                                                    <TableCell className={columnWidths.quiz}>{quiz?.title || 'Desconhecido'}</TableCell>
                                                    <TableCell className={columnWidths.result}>{resultName}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {displayLockedRows > 0 && (
                                            <>
                                                <TableRow className="hidden sm:table-row hover:bg-transparent border-0 relative h-0">
                                                    <TableCell colSpan={6} className="p-0 border-0 h-0">
                                                        <div className="relative w-full h-0">
                                                            <div className="absolute left-1/2 -translate-x-1/2 top-8 z-10 w-full max-w-md px-4">
                                                                {renderUpgradeCard('w-full')}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {placeholderRows.map((_, index) => (
                                                    <TableRow
                                                        key={`locked-${index}`}
                                                        className="bg-muted/10 text-muted-foreground/65 hover:bg-muted/20 blur-[2px] select-none pointer-events-none"
                                                    >
                                                        <TableCell className={`${lockedRowPadding} ${columnWidths.date}`}>
                                                            <div className="h-3 w-full max-w-[9.5rem] rounded bg-muted/55" />
                                                        </TableCell>
                                                        <TableCell className={`${lockedRowPadding} ${columnWidths.name}`}>
                                                            <div className="h-3 w-full max-w-[8rem] rounded bg-muted/55" />
                                                        </TableCell>
                                                        <TableCell className={`${lockedRowPadding} ${columnWidths.email}`}>
                                                            <div className="h-3 w-full max-w-[13rem] rounded bg-muted/55" />
                                                        </TableCell>
                                                        <TableCell className={`${lockedRowPadding} ${columnWidths.phone}`}>
                                                            <div className="h-3 w-full max-w-[9rem] rounded bg-muted/55" />
                                                        </TableCell>
                                                        <TableCell className={`${lockedRowPadding} ${columnWidths.quiz}`}>
                                                            <div className="h-3 w-full max-w-[16rem] rounded bg-muted/55" />
                                                        </TableCell>
                                                        <TableCell className={`${lockedRowPadding} ${columnWidths.result}`}>
                                                            <div className="h-3 w-full max-w-[9rem] rounded bg-muted/55" />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {spacerHeight > 0 && (
                                                    <TableRow className="hover:bg-transparent border-0" style={{ height: `${spacerHeight}px` }}>
                                                        <TableCell colSpan={6} className="p-0 border-0" />
                                                    </TableRow>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </TableBody>
                        </Table>
                        {displayLockedRows > 0 && (
                            <div className="pointer-events-none absolute inset-x-0 top-44 z-10 flex justify-center px-4 sm:hidden">
                                <div className="pointer-events-auto w-full">
                                    {renderUpgradeCard('w-full')}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                        Exibindo {filteredLeads.length} de {totalLeadCount} leads
                    </div>
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
