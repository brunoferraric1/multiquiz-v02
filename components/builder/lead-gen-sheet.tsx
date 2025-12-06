'use client';

import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DrawerFooter } from '@/components/builder/drawer-footer';
import { toast } from 'sonner';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { ContactIcon, Mail, Phone, User } from 'lucide-react';

interface LeadGenSheetProps {
    onClose: () => void;
}

const FIELD_OPTIONS = [
    { id: 'name' as const, label: 'Nome', icon: User },
    { id: 'email' as const, label: 'E-mail', icon: Mail },
    { id: 'phone' as const, label: 'WhatsApp', icon: Phone },
];

export function LeadGenSheet({ onClose }: LeadGenSheetProps) {
    const { quiz, setQuiz } = useQuizBuilderStore();
    const leadGen = quiz.leadGen || { enabled: false, fields: [] };

    const updateLeadGen = (updates: Partial<typeof leadGen>) => {
        setQuiz({
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

    const handleSave = () => {
        if (leadGen.enabled && (!leadGen.fields || leadGen.fields.length === 0)) {
            toast.error('Selecione pelo menos um campo para capturar');
            return;
        }
        toast.success('Configurações salvas!');
        onClose();
    };

    return (
        <>
            <SheetHeader className="px-6 pt-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ContactIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <SheetTitle>Captura de Leads</SheetTitle>
                        <SheetDescription>
                            Colete dados dos participantes antes do resultado
                        </SheetDescription>
                    </div>
                </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Título</label>
                            <Input
                                placeholder="Quase lá!"
                                value={leadGen.title || ''}
                                onChange={(e) => updateLeadGen({ title: e.target.value })}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Descrição</label>
                            <Textarea
                                placeholder="Preencha seus dados para ver o resultado"
                                value={leadGen.description || ''}
                                onChange={(e) => updateLeadGen({ description: e.target.value })}
                                rows={2}
                            />
                        </div>

                        {/* Fields Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Campos a coletar</label>
                            <div className="space-y-2">
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Texto do botão</label>
                            <Input
                                placeholder="Ver Resultado"
                                value={leadGen.ctaText || ''}
                                onChange={(e) => updateLeadGen({ ctaText: e.target.value })}
                            />
                        </div>
                    </>
                )}
            </div>

            <DrawerFooter onSave={handleSave} onCancel={onClose} />
        </>
    );
}
