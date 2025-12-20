'use client';

import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DrawerFooter } from '@/components/builder/drawer-footer';
import { toast } from 'sonner';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { Mail, Phone, User } from 'lucide-react';

interface LeadGenSheetProps {
    onClose: () => void;
    onSave?: () => Promise<void>;
}

const FIELD_OPTIONS = [
    { id: 'name' as const, label: 'Nome', icon: User },
    { id: 'email' as const, label: 'E-mail', icon: Mail },
    { id: 'phone' as const, label: 'WhatsApp', icon: Phone },
];

const fieldLabelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground';

export function LeadGenSheet({ onClose, onSave }: LeadGenSheetProps) {
    const { quiz, setQuiz } = useQuizBuilderStore();
    const leadGen = quiz.leadGen || { enabled: false, fields: [] };

    const updateLeadGen = (updates: Partial<typeof leadGen>) => {
        setQuiz({
            ...quiz,
            leadGen: { ...leadGen, ...updates },
        });
    };

    const toggleField = (field: 'name' | 'email' | 'phone') => {
        const currentFields = leadGen.fields || [];
        const newFields = currentFields.includes(field)
            ? currentFields.filter((f) => f !== field)
            : [...currentFields, field];
        updateLeadGen({ fields: newFields });
    };

    const handleSave = async () => {
        if (leadGen.enabled && (!leadGen.fields || leadGen.fields.length === 0)) {
            toast.error('Selecione pelo menos um campo para capturar');
            return;
        }
        console.log('[LeadGenSheet] handleSave called, leadGen:', JSON.stringify(quiz.leadGen));
        if (onSave) {
            console.log('[LeadGenSheet] Calling onSave (forceSave)...');
            await onSave();
            console.log('[LeadGenSheet] onSave completed');
        } else {
            console.log('[LeadGenSheet] No onSave prop provided!');
        }
        toast.success('Configurações salvas!');
        onClose();
    };

    return (
        <>
            <SheetHeader className="flex-shrink-0 pb-6">
                <SheetTitle className="text-2xl">Captura de Leads</SheetTitle>
                <SheetDescription>
                    Colete dados dos participantes antes do resultado
                </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto relative min-h-0">
                <div className="space-y-4">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
                        <div>
                            <p className="font-medium text-sm">Ativar captura de leads</p>
                            <p className="text-xs text-muted-foreground">
                                Exibir formulário antes do resultado
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={leadGen.enabled}
                            onClick={() => updateLeadGen({ enabled: !leadGen.enabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${leadGen.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${leadGen.enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {leadGen.enabled && (
                        <>
                            {/* Title */}
                            <div className="space-y-1">
                                <p className={fieldLabelClass}>Título</p>
                                <Input
                                    placeholder="Quase lá!"
                                    value={leadGen.title || ''}
                                    onChange={(e) => updateLeadGen({ title: e.target.value })}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <p className={fieldLabelClass}>Descrição</p>
                                <Textarea
                                    placeholder="Preencha seus dados para ver o resultado"
                                    value={leadGen.description || ''}
                                    onChange={(e) => updateLeadGen({ description: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            {/* Fields Selection */}
                            <div className="space-y-1">
                                <p className={fieldLabelClass}>Campos a coletar</p>
                                <div className="space-y-2 pt-1">
                                    {FIELD_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        const isSelected = leadGen.fields?.includes(option.id);
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => toggleField(option.id)}
                                                className={`flex w-full items-center gap-3 rounded-xl border p-3 transition-colors ${isSelected
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-border bg-muted/40 text-foreground hover:border-primary/50'
                                                    }`}
                                            >
                                                <div
                                                    className={`flex h-5 w-5 items-center justify-center rounded border ${isSelected
                                                        ? 'border-primary bg-primary text-white'
                                                        : 'border-muted-foreground/50'
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                                                            <path d="M10.28 2.28L4 8.56 1.72 6.28a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l7-7a.75.75 0 00-1.06-1.06z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <Icon className="h-4 w-4" />
                                                <span className="text-sm font-medium">{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CTA Text */}
                            <div className="space-y-1">
                                <p className={fieldLabelClass}>Texto do botão</p>
                                <Input
                                    placeholder="Ver Resultado"
                                    value={leadGen.ctaText || ''}
                                    onChange={(e) => updateLeadGen({ ctaText: e.target.value })}
                                />
                            </div>
                        </>
                    )}
                </div>
                {/* Gradient overlay for fade effect */}
                <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
            </div>

            <div className="flex-shrink-0 border-t bg-background py-8 mt-auto">
                <DrawerFooter onSave={handleSave} onCancel={onClose} />
            </div>
        </>
    );
}

