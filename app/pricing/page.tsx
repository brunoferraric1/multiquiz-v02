'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  Loader2,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingPage } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  createCheckoutSession,
  createPortalSession,
  isPro,
  useSubscription,
} from '@/lib/services/subscription-service';
import { TIER_LIMITS } from '@/lib/stripe';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type BillingPeriod = 'monthly' | 'yearly';

type FeatureRow = {
  label: string;
  free: string | boolean;
  pro: string | boolean;
};

const FREE_FEATURES = [
  { text: '1 quiz publicado', included: true },
  { text: 'Até 3 rascunhos ativos', included: true },
  { text: '20 mensagens IA por mês', included: true },
  { text: 'Captura de leads', included: true },
  { text: 'Relatórios de análise completos', included: false },
  { text: 'Relatório de Leads + download', included: false },
  { text: 'Personalização de logo e cores', included: false },
];

const PRO_FEATURES = [
  { text: 'Quizzes ilimitados', included: true },
  { text: 'Rascunhos ilimitados', included: true },
  { text: 'Assistente IA ilimitado', included: true },
  { text: 'Captura de leads', included: true },
  { text: 'Relatórios de análise completos', included: true },
  { text: 'Relatório de Leads + download', included: true },
  { text: 'Personalização de logo e cores', included: true },
];

const formatLimit = (value: number) =>
  value === Infinity ? 'Ilimitado' : `${value}`;

const COMPARISON_ROWS: FeatureRow[] = [
  {
    label: 'Quizzes publicados',
    free: formatLimit(TIER_LIMITS.free.publishedQuizzes),
    pro: formatLimit(TIER_LIMITS.pro.publishedQuizzes),
  },
  {
    label: 'Rascunhos ativos',
    free: formatLimit(TIER_LIMITS.free.draftLimit),
    pro: formatLimit(TIER_LIMITS.pro.draftLimit),
  },
  {
    label: 'Mensagens IA / mês',
    free: `${TIER_LIMITS.free.aiMessagesPerMonth} mensagens`,
    pro: 'Ilimitado',
  },
  {
    label: 'Captura de leads',
    free: true,
    pro: true,
  },
  {
    label: 'Relatórios de análise completos',
    free: TIER_LIMITS.free.hasReports,
    pro: TIER_LIMITS.pro.hasReports,
  },
  {
    label: 'Relatório de Leads + download',
    free: TIER_LIMITS.free.hasLeadsPage,
    pro: TIER_LIMITS.pro.hasLeadsPage,
  },
  {
    label: 'Personalização de logo e cores',
    free: !TIER_LIMITS.free.hasBranding,
    pro: !TIER_LIMITS.pro.hasBranding,
  },
];

function FeatureValue({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <span className="inline-flex items-center gap-2 text-primary">
        <Check className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Incluído</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <X className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Não incluído</span>
      </span>
    );
  }

  return (
    <span
      className={cn('text-sm text-foreground', highlight && 'font-semibold text-primary')}
    >
      {value}
    </span>
  );
}

function PricingContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription(user?.uid);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Consider loading until BOTH auth and subscription are ready
  const dataLoading = authLoading || subscriptionLoading;
  const isProUser = isPro(subscription);

  useEffect(() => {
    const period = searchParams.get('period');
    if (period === 'monthly' || period === 'yearly') {
      setBillingPeriod(period);
    }
  }, [searchParams]);

  const proPrice = billingPeriod === 'yearly' ? 'R$39' : 'R$49';
  const proFrequency = billingPeriod === 'yearly' ? '/mês (cobrado anualmente)' : '/mês';
  const yearlyTotal = billingPeriod === 'yearly' ? 'R$468/ano' : null;

  const handleProAction = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      if (isProUser) {
        const url = await createPortalSession(user.uid);
        if (url) {
          window.location.href = url;
        } else {
          toast.error('Erro ao abrir portal da assinatura.');
        }
        return;
      }

      const url = await createCheckoutSession(
        user.uid,
        user.email || '',
        billingPeriod
      );

      if (url) {
        window.location.href = url;
      } else {
        toast.error('Erro ao iniciar checkout.');
      }
    } catch (error) {
      console.error('Subscription action error:', error);
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-30" aria-hidden="true" />
          <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Compare o gratuito com o Pro
                  </h1>
                  <p className="mt-3 text-muted-foreground">
                    Tudo o que você precisa para criar quizzes com IA, capturar leads
                    e escalar com relatórios completos.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <Card className="relative overflow-hidden border-border bg-card/60">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline">Grátis</Badge>
                    {!dataLoading && !isProUser && (
                      <Badge variant="secondary">Plano atual</Badge>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-3xl">
                      R$0
                      <span className="ml-2 text-base font-medium text-muted-foreground">
                        /mês
                      </span>
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ideal para começar e publicar o primeiro quiz.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {FREE_FEATURES.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-primary" aria-hidden="true" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/60" aria-hidden="true" />
                        )}
                        <span
                          className={cn(
                            'text-sm',
                            feature.included ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {dataLoading ? (
                    <div className="h-10 w-full bg-muted/50 rounded animate-pulse" />
                  ) : !isProUser ? (
                    <Button
                      asChild
                      variant="secondary"
                      className="w-full cursor-[var(--cursor-interactive)] disabled:cursor-[var(--cursor-not-allowed)]"
                    >
                      <Link href="/dashboard">Continuar no plano gratuito</Link>
                    </Button>
                  ) : (
                    <div className="h-10" />
                  )}
                </CardFooter>
              </Card>

              <Card className="relative overflow-hidden border-primary/60 bg-card/70">
                {!dataLoading && !isProUser && (
                  <div className="absolute right-6 top-6">
                    <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-muted/40 p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setBillingPeriod('monthly')}
                        className={cn(
                          'rounded-full px-3 py-1 font-medium transition-colors cursor-[var(--cursor-interactive)] disabled:cursor-[var(--cursor-not-allowed)]',
                          billingPeriod === 'monthly'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        Mensal
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingPeriod('yearly')}
                        className={cn(
                          'rounded-full px-3 py-1 font-medium transition-colors cursor-[var(--cursor-interactive)] disabled:cursor-[var(--cursor-not-allowed)]',
                          billingPeriod === 'yearly'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        Anual (-20%)
                      </button>
                    </div>
                  </div>
                )}
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">Pro</Badge>
                    {!dataLoading && isProUser && (
                      <Badge variant="secondary">Plano atual</Badge>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-3xl">
                      {proPrice}
                      <span className="ml-2 text-base font-medium text-muted-foreground">
                        {proFrequency}
                      </span>
                    </CardTitle>
                    {yearlyTotal && (
                      <CardDescription className="mt-1">{yearlyTotal}</CardDescription>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Para quem quer escalar, vender e acompanhar resultados em detalhes.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {PRO_FEATURES.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary" aria-hidden="true" />
                        <span className="text-sm text-foreground">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    onClick={handleProAction}
                    disabled={dataLoading || isProcessing}
                    className="w-full cursor-[var(--cursor-interactive)] disabled:cursor-[var(--cursor-not-allowed)]"
                    variant={!dataLoading && isProUser ? 'outline' : 'default'}
                  >
                    {dataLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Carregando plano...
                      </>
                    ) : isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Redirecionando...
                      </>
                    ) : isProUser ? (
                      'Gerenciar assinatura'
                    ) : (
                      'Fazer upgrade para Pro'
                    )}
                  </Button>
                  {dataLoading ? (
                    <div className="h-4 w-48 mx-auto bg-muted/50 rounded animate-pulse" />
                  ) : !isProUser ? (
                    <p className="text-xs text-center text-muted-foreground">
                      Pagamento seguro via Stripe. Cancele quando quiser.
                    </p>
                  ) : (
                    <p className="text-xs text-center text-primary/80 font-medium">
                      Sua assinatura está ativa e segura.
                    </p>
                  )}
                </CardFooter>
              </Card>
            </div>

            <Card className="mt-10 border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle className="text-xl">Comparativo rápido</CardTitle>
                <CardDescription>
                  Veja lado a lado os limites e recursos principais de cada plano.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recursos</TableHead>
                      <TableHead>Gratuito</TableHead>
                      <TableHead>Pro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {COMPARISON_ROWS.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium text-foreground">
                          {row.label}
                        </TableCell>
                        <TableCell>
                          <FeatureValue value={row.free} />
                        </TableCell>
                        <TableCell>
                          <FeatureValue value={row.pro} highlight />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-card/50 p-4">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Checkout seguro</p>
                  <p className="text-xs text-muted-foreground">
                    Pagamentos processados com segurança pela Stripe.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-card/50 p-4">
                <Check className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Sem compromisso</p>
                  <p className="text-xs text-muted-foreground">
                    Cancele, altere ou retome quando quiser no portal.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-card/50 p-4">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Upgrade imediato</p>
                  <p className="text-xs text-muted-foreground">
                    Recursos liberados assim que o pagamento confirma.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <PricingContent />
    </Suspense>
  );
}
