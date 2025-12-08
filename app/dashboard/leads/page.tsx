'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { QuizService } from '@/lib/services/quiz-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import type { Quiz, QuizAttempt } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function LeadsPage() {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [leads, setLeads] = useState<QuizAttempt[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedQuizId, setSelectedQuizId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function init() {
            if (!user) return;
            try {
                const quizzesData = await QuizService.getUserQuizzes(user.uid);
                setQuizzes(quizzesData);

                // Fetch leads for all quizzes
                // Optimization: In a real app we might fetch only when selected or paginate
                const allLeadsPromises = quizzesData.map(q => AnalyticsService.getQuizLeads(q.id));
                const allLeadsResults = await Promise.all(allLeadsPromises);
                const flatLeads = allLeadsResults.flat().sort((a, b) => b.startedAt - a.startedAt);

                setLeads(flatLeads);
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

    if (loading) {
        return <div className="p-8">Carregando leads...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Leads</h1>
                    <p className="text-muted-foreground mt-1">
                        Visualize e exporte os contatos capturados pelos seus quizzes.
                    </p>
                </div>
                <Button onClick={handleExportCSV} disabled={filteredLeads.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row gap-4">
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
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Quiz</TableHead>
                                    <TableHead>Resultado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLeads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Nenhum lead encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLeads.map((lead) => {
                                        const quiz = quizzes.find(q => q.id === lead.quizId);
                                        const resultName = quiz?.outcomes?.find(o => o.id === lead.resultOutcomeId)?.title || '-';

                                        return (
                                            <TableRow key={lead.id}>
                                                <TableCell>
                                                    {lead.startedAt ? format(new Date(lead.startedAt), 'dd/MM/yyyy HH:mm') : '-'}
                                                </TableCell>
                                                <TableCell className="font-medium">{lead.lead?.name || '-'}</TableCell>
                                                <TableCell>{lead.lead?.email || '-'}</TableCell>
                                                <TableCell>{lead.lead?.phone || '-'}</TableCell>
                                                <TableCell>{quiz?.title || 'Desconhecido'}</TableCell>
                                                <TableCell>{resultName}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                        Total de {filteredLeads.length} leads encontrados
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
