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
    phone: 'WhatsApp',
};

const fieldPlaceholders: Record<string, string> = {
    name: 'Seu nome completo',
    email: 'seuemail@exemplo.com',
    phone: '(11) 99999-9999',
};

export function QuizLeadGen({ config, primaryColor = '#4F46E5', onSubmit }: QuizLeadGenProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
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
                <CardTitle className="text-2xl font-bold">
                    {config.title || 'Quase lá!'}
                </CardTitle>
                <CardDescription className="text-base">
                    {config.description || 'Preencha seus dados para ver o resultado'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {config.fields.map((field) => (
                    <div key={field} className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {fieldLabels[field]}
                        </label>
                        <Input
                            type={field === 'email' ? 'email' : 'text'}
                            placeholder={fieldPlaceholders[field]}
                            value={formData[field] || ''}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            className="h-12"
                        />
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-12 text-base font-semibold"
                    style={{ backgroundColor: primaryColor }}
                >
                    {isSubmitting ? 'Carregando...' : (config.ctaText || 'Ver Resultado')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </CardFooter>
        </Card>
    );
}
