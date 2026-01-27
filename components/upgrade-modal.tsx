'use client';

import Link from 'next/link';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/i18n/context';
import { localizePathname } from '@/lib/i18n/paths';

type UpgradeReason = 'draft-limit' | 'publish-limit' | 'brand-kit' | 'pro-feature' | 'external-url' | 'leads-limit' | 'leads-management' | 'crm-integration';

const copy: Record<UpgradeReason, { title: string; description: string }> = {
  'draft-limit': {
    title: 'Limite de rascunhos atingido',
    description: 'No plano Grátis você pode manter rascunhos ilimitados. Verifique seu plano atual.',
  },
  'publish-limit': {
    title: 'Limite de publicação atingido',
    description: 'Você atingiu o limite de quizzes publicados do seu plano. Faça upgrade para publicar mais quizzes.',
  },
  'pro-feature': {
    title: 'Funcionalidade do Plano Pago',
    description: 'Esse recurso é exclusivo dos planos Plus e Pro. Faça upgrade para desbloquear.',
  },
  'brand-kit': {
    title: 'Kit da marca disponível nos planos pagos',
    description: 'Personalize logo e paleta de cores para todos os quizzes com um plano pago.',
  },
  'external-url': {
    title: 'URLs externas disponíveis nos planos pagos',
    description: 'Adicione links externos nos CTAs do seu quiz. Faça upgrade para o plano Plus ou Pro.',
  },
  'leads-limit': {
    title: 'Limite de leads atingido',
    description: 'Você atingiu o limite de leads coletados do seu plano. Faça upgrade para coletar mais leads.',
  },
  'leads-management': {
    title: 'Gestão de leads disponível nos planos pagos',
    description: 'Gerencie e faça download dos seus leads com um plano Plus ou Pro.',
  },
  'crm-integration': {
    title: 'Integração com CRM disponível nos planos pagos',
    description: 'Conecte seu quiz ao seu CRM favorito com um plano Plus ou Pro.',
  },
};

interface UpgradeModalProps {
  open: boolean;
  reason: UpgradeReason;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function UpgradeModal({ open, reason, onOpenChange, className }: UpgradeModalProps) {
  const content = copy[reason];
  const locale = useLocale();
  const pricingHref = localizePathname('/pricing', locale);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-md', className)}>
        <DialogHeader className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            Upgrade necessário
          </div>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Desbloqueie mais quizzes, gestão de leads, integrações e URLs externas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Continuar depois
          </Button>
          <Button asChild>
            <Link href={pricingHref}>
              Fazer upgrade
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
