import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock } from 'lucide-react';
import { format } from 'date-fns';

type LeadRow = {
    id: string;
    startedAt?: number | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    quizTitle?: string | null;
    resultTitle?: string | null;
};

type LeadsTableProps = {
    rows: LeadRow[];
    loading?: boolean;
    lockedCount?: number;
    visibleCount: number;
    totalCount: number;
    onUpgradeClick: () => void;
    showFooter?: boolean;
    showPreviewCounts?: boolean;
};

const MAX_LOCKED_ROWS_DISPLAY = 20;
const ESTIMATED_ROW_HEIGHT = 53;
const MIN_SECTION_HEIGHT = 384;

const columnWidths = {
    date: 'min-w-[9.5rem] whitespace-nowrap sm:min-w-[auto] sm:whitespace-normal',
    name: 'min-w-[9rem] sm:min-w-[auto]',
    email: 'min-w-[12.5rem] whitespace-nowrap sm:min-w-[auto] sm:whitespace-normal',
    phone: 'min-w-[10rem] whitespace-nowrap sm:min-w-[auto] sm:whitespace-normal',
    quiz: 'min-w-[15rem] sm:min-w-[auto]',
    result: 'min-w-[11rem] sm:min-w-[auto]',
};

const leadLabel = (count: number) => (count === 1 ? '1 lead' : `${count} leads`);

export function LeadsTable({
    rows,
    loading = false,
    lockedCount = 0,
    visibleCount,
    totalCount,
    onUpgradeClick,
    showFooter = true,
    showPreviewCounts = true,
}: LeadsTableProps) {
    const displayLockedRows = !loading && lockedCount > 0
        ? Math.min(lockedCount, MAX_LOCKED_ROWS_DISPLAY)
        : 0;
    const placeholderRows = Array.from({ length: displayLockedRows });
    const spacerHeight = Math.max(0, MIN_SECTION_HEIGHT - displayLockedRows * ESTIMATED_ROW_HEIGHT);
    const visibleLeadLabel = leadLabel(visibleCount);
    const totalLeadLabel = leadLabel(totalCount);
    const showCounts = showPreviewCounts && totalCount > 0;

    const renderUpgradeCard = (className: string) => (
        <Card className={`shadow-lg border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 ${className}`}>
            <CardContent className="flex flex-col items-center text-center p-6 gap-4">
                <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                    <h3 className="font-semibold text-lg">Desbloqueie todos os seus leads</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {showCounts && (
                            <>
                                Você está vendo <span className="font-medium text-foreground">{visibleLeadLabel}</span> de <span className="font-medium text-foreground">{totalLeadLabel}</span>.
                                <br />
                            </>
                        )}
                        No plano Pro você acessa os dados de todos os leads que responderam o seu quiz.
                    </p>
                </div>
                <Button onClick={onUpgradeClick} className="w-full sm:w-auto min-w-[200px]">
                    Fazer upgrade
                </Button>
            </CardContent>
        </Card>
    );

    return (
        <>
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
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Carregando leads...
                                </TableCell>
                            </TableRow>
                        ) : rows.length === 0 && displayLockedRows === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Nenhum lead encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {rows.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell className={columnWidths.date}>
                                            {lead.startedAt ? format(new Date(lead.startedAt), 'dd/MM/yyyy HH:mm') : '-'}
                                        </TableCell>
                                        <TableCell className={`${columnWidths.name} font-medium`}>{lead.name || '-'}</TableCell>
                                        <TableCell className={columnWidths.email}>{lead.email || '-'}</TableCell>
                                        <TableCell className={columnWidths.phone}>{lead.phone || '-'}</TableCell>
                                        <TableCell className={columnWidths.quiz}>{lead.quizTitle || 'Desconhecido'}</TableCell>
                                        <TableCell className={columnWidths.result}>{lead.resultTitle || '-'}</TableCell>
                                    </TableRow>
                                ))}
                                {displayLockedRows > 0 && (
                                    <>
                                        {placeholderRows.map((_, index) => (
                                            <TableRow
                                                key={`locked-${index}`}
                                                className="bg-muted/10 text-muted-foreground/65 hover:bg-muted/20 blur-[2px] select-none pointer-events-none"
                                            >
                                                <TableCell className={`py-3 ${columnWidths.date}`}>
                                                    <div className="h-3 w-full max-w-[9.5rem] rounded bg-muted/55" />
                                                </TableCell>
                                                <TableCell className={`py-3 ${columnWidths.name}`}>
                                                    <div className="h-3 w-full max-w-[8rem] rounded bg-muted/55" />
                                                </TableCell>
                                                <TableCell className={`py-3 ${columnWidths.email}`}>
                                                    <div className="h-3 w-full max-w-[13rem] rounded bg-muted/55" />
                                                </TableCell>
                                                <TableCell className={`py-3 ${columnWidths.phone}`}>
                                                    <div className="h-3 w-full max-w-[9rem] rounded bg-muted/55" />
                                                </TableCell>
                                                <TableCell className={`py-3 ${columnWidths.quiz}`}>
                                                    <div className="h-3 w-full max-w-[16rem] rounded bg-muted/55" />
                                                </TableCell>
                                                <TableCell className={`py-3 ${columnWidths.result}`}>
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
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
                        <div className="pointer-events-auto w-full max-w-md">
                            {renderUpgradeCard('w-full')}
                        </div>
                    </div>
                )}
            </div>
            {showFooter && (
                <div className="mt-4 text-sm text-muted-foreground">
                    Exibindo {rows.length} de {totalCount} leads
                </div>
            )}
        </>
    );
}
