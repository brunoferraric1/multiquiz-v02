'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
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
  isPlus,
  isPaidTier,
  useSubscription,
} from '@/lib/services/subscription-service';
import { TIER_LIMITS, SubscriptionTier } from '@/lib/stripe';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type SelectedTier = 'plus' | 'pro';

type FeatureRow = {
  label: string;
  free: string | boolean;
  plus: string | boolean;
  pro: string | boolean;
};

const FREE_FEATURES = [
  { text: '1 quiz publicado', included: true },
  { text: 'Rascunhos ilimitados', included: true },
  { text: 'Até 10 leads coletados', included: true },
  { text: 'Criação com IA', included: false },
  { text: 'Gestão e download de leads', included: false },
  { text: 'Integração com CRM', included: false },
  { text: 'Links externos nos botões', included: false },
];

const PLUS_FEATURES = [
  { text: 'Até 3 quizzes publicados', included: true },
  { text: 'Rascunhos ilimitados', included: true },
  { text: 'Até 3.000 leads coletados', included: true },
  { text: 'Criação com IA', included: true },
  { text: 'Gestão e download de leads', included: true },
  { text: 'Integração com CRM', included: true },
  { text: 'Links externos nos botões', included: true },
];

const PRO_FEATURES = [
  { text: 'Até 10 quizzes publicados', included: true },
  { text: 'Rascunhos ilimitados', included: true },
  { text: 'Até 10.000 leads coletados', included: true },
  { text: 'Criação com IA', included: true },
  { text: 'Gestão e download de leads', included: true },
  { text: 'Integração com CRM', included: true },
  { text: 'Links externos nos botões', included: true },
];

const formatLimit = (value: number) =>
  value === Infinity ? 'Ilimitado' : value.toLocaleString('pt-BR');

const COMPARISON_ROWS: FeatureRow[] = [
  {
    label: 'Quizzes publicados',
    free: formatLimit(TIER_LIMITS.free.publishedQuizzes),
    plus: formatLimit(TIER_LIMITS.plus.publishedQuizzes),
    pro: formatLimit(TIER_LIMITS.pro.publishedQuizzes),
  },
  {
    label: 'Leads coletados',
    free: formatLimit(TIER_LIMITS.free.leadsLimit),
    plus: formatLimit(TIER_LIMITS.plus.leadsLimit),
    pro: formatLimit(TIER_LIMITS.pro.leadsLimit),
  },
  {
    label: 'Rascunhos',
    free: 'Ilimitado',
    plus: 'Ilimitado',
    pro: 'Ilimitado',
  },
  {
    label: 'Criação com IA',
    free: false,
    plus: true,
    pro: true,
  },
  {
    label: 'Gestão e download de leads',
    free: TIER_LIMITS.free.hasLeadsPage,
    plus: TIER_LIMITS.plus.hasLeadsPage,
    pro: TIER_LIMITS.pro.hasLeadsPage,
  },
  {
    label: 'Integração com CRM',
    free: TIER_LIMITS.free.hasCrmIntegration,
    plus: TIER_LIMITS.plus.hasCrmIntegration,
    pro: TIER_LIMITS.pro.hasCrmIntegration,
  },
  {
    label: 'Links externos nos botões',
    free: TIER_LIMITS.free.hasExternalUrls,
    plus: TIER_LIMITS.plus.hasExternalUrls,
    pro: TIER_LIMITS.pro.hasExternalUrls,
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

function getCurrentTierName(subscription: { tier?: SubscriptionTier } | undefined): string {
  if (!subscription) return 'Grátis';
  switch (subscription.tier) {
    case 'pro':
      return 'Pro';
    case 'plus':
      return 'Plus';
    default:
      return 'Grátis';
  }
}

function PricingContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription(user?.uid);
  const [selectedTier, setSelectedTier] = useState<SelectedTier>('plus');
  const [isProcessing, setIsProcessing] = useState(false);

  const dataLoading = authLoading || subscriptionLoading;
  const isProUser = isPro(subscription);
  const isPlusUser = isPlus(subscription);
  const hasPaidPlan = isPaidTier(subscription);

  useEffect(() => {
    const tier = searchParams.get('tier');
    if (tier === 'plus' || tier === 'pro') {
      setSelectedTier(tier);
    }
  }, [searchParams]);

  const handlePaidAction = async (tier: SelectedTier) => {
    if (!user) return;

    setIsProcessing(true);
    try {
      if (hasPaidPlan) {
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
        'monthly',
        tier
      );

      if (url) {
        // Track checkout initiated event before redirecting
        posthog.capture('checkout_initiated', {
          tier: tier,
          billing_period: 'monthly',
          current_tier: subscription?.tier || 'free',
        });
        window.location.href = url;
      } else {
        toast.error('Erro ao iniciar checkout.');
      }
    } catch (error) {
      console.error('Subscription action error:', error);
      posthog.captureException(error);
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
                    Escolha seu plano
                  </h1>
                  <p className="mt-3 text-muted-foreground">
                    Escale sua captação de leads com quizzes interativos.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {/* Free Tier */}
              <Card className="relative overflow-hidden border-border bg-card/60">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline">Grátis</Badge>
                    {!dataLoading && !hasPaidPlan && (
                      <Badge variant="secondary">Plano atual</Badge>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-3xl">
                      <span className="text-lg font-medium text-muted-foreground mr-1">R$</span>
                      0
                      <span className="ml-2 text-base font-medium text-muted-foreground">
                        /mês
                      </span>
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Perfeito para começar e testar a plataforma.
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
                  ) : !hasPaidPlan ? (
                    <Button
                      asChild
                      variant="secondary"
                      className="w-full cursor-[var(--cursor-interactive)] disabled:cursor-[var(--cursor-not-allowed)]"
                    >
                      <Link href="/dashboard">Continuar no Grátis</Link>
                    </Button>
                  ) : (
                    <div className="h-10" />
                  )}
                </CardFooter>
              </Card>

              {/* Plus Tier */}
              <Card className="relative overflow-hidden border-primary/60 bg-card/70">
                <div className="absolute right-4 top-4">
                  <Badge className="bg-primary text-primary-foreground">Mais popular</Badge>
                </div>
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">Plus</Badge>
                    {!dataLoading && isPlusUser && (
                      <Badge variant="secondary">Plano atual</Badge>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-3xl">
                      <span className="text-lg font-medium text-muted-foreground mr-1">R$</span>
                      89,90
                      <span className="ml-2 text-base font-medium text-muted-foreground">
                        /mês
                      </span>
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Para quem quer escalar sua captação de leads.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {PLUS_FEATURES.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary" aria-hidden="true" />
                        <span className="text-sm text-foreground">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    onClick={() => handlePaidAction('plus')}
                    disabled={dataLoading || isProcessing}
                    className="w-full cursor-[var(--cursor-interactive)] disabled:cursor-[var(--cursor-not-allowed)]"
                    variant={!dataLoading && isPlusUser ? 'outline' : 'default'}
                  >
                    {dataLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Carregando...
                      </>
                    ) : isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Redirecionando...
                      </>
                    ) : isPlusUser ? (
                      'Gerenciar assinatura'
                    ) : hasPaidPlan ? (
                      'Gerenciar assinatura'
                    ) : (
                      'Assinar Plus'
                    )}
                  </Button>
                  {!dataLoading && !hasPaidPlan && (
                    <p className="text-xs text-center text-muted-foreground">
                      Pagamento seguro via Stripe.
                    </p>
                  )}
                </CardFooter>
              </Card>

              {/* Pro Tier */}
              <Card className="relative overflow-hidden border-border bg-card/60">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline">Pro</Badge>
                    {!dataLoading && isProUser && (
                      <Badge variant="secondary">Plano atual</Badge>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-3xl">
                      <span className="text-lg font-medium text-muted-foreground mr-1">R$</span>
                      129,90
                      <span className="ml-2 text-base font-medium text-muted-foreground">
                        /mês
                      </span>
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Para operações maiores com alto volume de leads.
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
                    onClick={() => handlePaidAction('pro')}
                    disabled={dataLoading || isProcessing}
                    className="w-full cursor-[var(--cursor-interactive)] disabled:cursor-[var(--cursor-not-allowed)]"
                    variant={!dataLoading && isProUser ? 'outline' : 'secondary'}
                  >
                    {dataLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Carregando...
                      </>
                    ) : isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Redirecionando...
                      </>
                    ) : isProUser ? (
                      'Gerenciar assinatura'
                    ) : hasPaidPlan ? (
                      'Gerenciar assinatura'
                    ) : (
                      'Assinar Pro'
                    )}
                  </Button>
                  {!dataLoading && !hasPaidPlan && (
                    <p className="text-xs text-center text-muted-foreground">
                      Pagamento seguro via Stripe.
                    </p>
                  )}
                </CardFooter>
              </Card>
            </div>

            <Card className="mt-10 border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle className="text-xl">Comparativo de planos</CardTitle>
                <CardDescription>
                  Veja lado a lado os limites e recursos de cada plano.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recursos</TableHead>
                      <TableHead>Grátis</TableHead>
                      <TableHead>Plus</TableHead>
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
                          <FeatureValue value={row.plus} highlight />
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
