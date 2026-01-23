import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Lock } from 'lucide-react';
import { format } from 'date-fns';

// Column definition for dynamic table
export type DataColumn = {
    id: string;
    label: string;
    type: 'date' | 'text' | 'email' | 'phone' | 'number' | 'result';
    width?: string;
};

// Row data with dynamic fields
export type DataRow = {
    id: string;
    startedAt?: number | null;
    resultTitle?: string | null;
    fields: Record<string, string>; // fieldId -> value
};

type LeadsTableProps = {
    columns: DataColumn[]; // Dynamic column definitions
    rows: DataRow[];
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

// Get responsive width class for a column type
const getColumnWidth = (type: DataColumn['type']): string => {
    const widthMap: Record<DataColumn['type'], string> = {
        date: 'min-w-[9.5rem] whitespace-nowrap sm:min-w-[auto] sm:whitespace-normal',
        text: 'min-w-[9rem] sm:min-w-[auto]',
        email: 'min-w-[12.5rem] whitespace-nowrap sm:min-w-[auto] sm:whitespace-normal',
        phone: 'min-w-[10rem] whitespace-nowrap sm:min-w-[auto] sm:whitespace-normal',
        number: 'min-w-[8rem] sm:min-w-[auto]',
        result: 'min-w-[11rem] sm:min-w-[auto]',
    };
    return widthMap[type] || 'min-w-[9rem] sm:min-w-[auto]';
};

const dataLabel = (count: number) => (count === 1 ? '1 dado coletado' : `${count} dados coletados`);

export function LeadsTable({
    columns,
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
    const visibleDataLabel = dataLabel(visibleCount);
    const totalDataLabel = dataLabel(totalCount);
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
                                Você está vendo <span className="font-medium text-foreground">{visibleDataLabel}</span> de <span className="font-medium text-foreground">{totalDataLabel}</span>.
                                <br />
                            </>
                        )}
                        No plano Pro você acessa todos os dados coletados nas respostas do seu quiz.
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
            {loading && <span className="sr-only">Carregando dados...</span>}
            <div className="relative rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead key={column.id} className={getColumnWidth(column.type)}>
                                    {column.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={columns.length} className="p-0">
                                    <div
                                        className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                                        style={{ height: `${MIN_SECTION_HEIGHT}px` }}
                                    >
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Carregando dados...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : rows.length === 0 && displayLockedRows === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Nenhum dado encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {columns.map((column) => {
                                            let value = '-';

                                            if (column.type === 'date' && row.startedAt) {
                                                value = format(new Date(row.startedAt), 'dd/MM/yyyy HH:mm');
                                            } else if (column.type === 'result') {
                                                value = row.resultTitle || '-';
                                            } else {
                                                value = row.fields[column.id] || '-';
                                            }

                                            return (
                                                <TableCell key={column.id} className={getColumnWidth(column.type)}>
                                                    {value}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                                {displayLockedRows > 0 && (
                                    <>
                                        {placeholderRows.map((_, index) => (
                                            <TableRow
                                                key={`locked-${index}`}
                                                className="bg-muted/10 text-muted-foreground/65 hover:bg-muted/20 blur-[2px] select-none pointer-events-none"
                                            >
                                                {columns.map((column) => (
                                                    <TableCell key={column.id} className={`py-3 ${getColumnWidth(column.type)}`}>
                                                        <div className="h-3 w-full max-w-[12rem] rounded bg-muted/55" />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                        {spacerHeight > 0 && (
                                            <TableRow className="hover:bg-transparent border-0" style={{ height: `${spacerHeight}px` }}>
                                                <TableCell colSpan={columns.length} className="p-0 border-0" />
                                            </TableRow>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </TableBody>
                </Table>
                {displayLockedRows > 0 && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 animate-in fade-in-0 motion-reduce:animate-none">
                        <div className="pointer-events-auto w-full max-w-md animate-fade-in-up-soft motion-reduce:animate-none">
                            {renderUpgradeCard('w-full')}
                        </div>
                    </div>
                )}
            </div>
            {showFooter && (
                <div className="mt-4 text-sm text-muted-foreground">
                    Exibindo {rows.length} de {totalCount} {totalCount === 1 ? 'dado coletado' : 'dados coletados'}
                </div>
            )}
        </>
    );
}
