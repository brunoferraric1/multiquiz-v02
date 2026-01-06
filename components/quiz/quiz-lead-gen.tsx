'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface LeadGenConfig {
    enabled: boolean;
    title?: string;
    description?: string;
    fields: ('name' | 'email' | 'phone')[];
    ctaText?: string;
}

interface QuizLeadGenProps {
    config: LeadGenConfig;
    primaryColor?: string;
    onSubmit: (data: Record<string, string>) => void;
}

const fieldLabels: Record<string, string> = {
    name: 'Nome',
    email: 'E-mail',
    phone: 'Celular',
};

const fieldPlaceholders: Record<string, string> = {
    name: 'Seu nome completo',
    email: 'seuemail@exemplo.com',
    phone: '(11) 99999-9999',
};

// Helper for phone masking
const formatPhone = (value: string) => {
    // Remove non-digits
    const numbers = value.replace(/\D/g, '');

    // Apply mask
    let r = numbers;
    if (r.length > 11) r = r.substring(0, 11); // Limit to 11 digits

    if (r.length > 10) {
        // (11) 99999-9999
        r = r.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (r.length > 5) {
        // (11) 9999-9999 (legacy/landline fallback or partial)
        r = r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (r.length > 2) {
        // (11) 99...
        r = r.replace(/^(\d\d)(\d{0,5})/, '($1) $2');
    } else {
        // (1...
        r = r.replace(/^(\d*)/, '($1');
    }
    return r;
};

export function QuizLeadGen({ config, primaryColor, onSubmit }: QuizLeadGenProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        let finalValue = value;
        if (field === 'phone') {
            finalValue = formatPhone(value);
        }
        setFormData((prev) => ({ ...prev, [field]: finalValue }));
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = () => {
        // Validate required fields
        for (const field of config.fields) {
            const value = formData[field]?.trim();
            if (!value) {
                toast.error(`Por favor, preencha o campo ${fieldLabels[field]}`);
                return;
            }
            if (field === 'email' && !validateEmail(value)) {
                toast.error('Por favor, insira um e-mail válido');
                return;
            }
            if (field === 'phone' && value.replace(/\D/g, '').length < 10) {
                toast.error('Por favor, insira um número de celular válido');
                return;
            }
        }

        setIsSubmitting(true);
        // Simulate a brief delay
        setTimeout(() => {
            onSubmit(formData);
        }, 300);
    };

    return (
        <Card className="w-full border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-card-foreground">
                    {config.title || 'Quase lá!'}
                </CardTitle>
                <CardDescription className="text-base text-card-foreground/70">
                    {config.description || 'Preencha seus dados para ver o resultado'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {config.fields.map((field) => (
                    <div key={field} className="space-y-2">
                        <label className="text-sm font-medium text-card-foreground">
                            {fieldLabels[field]}
                        </label>
                        <Input
                            type={field === 'email' ? 'email' : (field === 'phone' ? 'tel' : 'text')}
                            placeholder={fieldPlaceholders[field]}
                            value={formData[field] || ''}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            className="h-12 text-card-foreground placeholder:text-card-foreground/60"
                            maxLength={field === 'phone' ? 15 : undefined}
                        />
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-12 text-base font-semibold"
                    style={primaryColor ? { backgroundColor: primaryColor } : undefined}
                >
                    {isSubmitting ? 'Carregando...' : (config.ctaText || 'Ver Resultado')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </CardFooter>
        </Card>
    );
}
