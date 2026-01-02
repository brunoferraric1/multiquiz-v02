'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, User, CreditCard, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSubscription, isPro, createCheckoutSession, createPortalSession } from '@/lib/services/subscription-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function AccountPage() {
    const { user, updateUserProfile } = useAuth();
    const { subscription, isLoading: isLoadingSubscription, hasCached: subscriptionCached } = useSubscription(user?.uid);
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        if (user?.displayName) {
            setName(user.displayName);
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        try {
            setIsUpdatingProfile(true);
            await updateUserProfile({ displayName: name });
            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao atualizar perfil.');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleManageSubscription = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            if (isPro(subscription)) {
                // Manage existing subscription (Portal)
                const url = await createPortalSession(user.uid);
                if (url) {
                    window.location.href = url;
                } else {
                    toast.error('Erro ao abrir portal de assinatura.');
                }
            } else {
                // Upgrade to Pro (Checkout)
                // Default to monthly for account page upgrade
                const url = await createCheckoutSession(user.uid, user.email || '', 'monthly');
                if (url && url !== 'redirecting') {
                    // For client-side checkout it handles redirect internally, 
                    // but if it returned a URL (server-side fallback), we use it.
                    // If it returns 'redirecting', we do nothing.
                    window.location.href = url;
                } else if (!url) {
                    toast.error('Erro ao iniciar checkout.');
                }
            }
        } catch (error) {
            console.error('Subscription action error:', error);
            toast.error('Ocorreu um erro. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const isSubscriptionReady = !isLoadingSubscription || subscriptionCached;
    const isProUser = isPro(subscription);

    return (
        <div className="container max-w-4xl py-8 space-y-8 px-4 sm:px-6 lg:px-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Minha Conta</h1>
                <p className="text-muted-foreground mt-2">
                    Gerencie suas informações pessoais e assinatura.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Profile Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Perfil
                        </CardTitle>
                        <CardDescription>
                            Suas informações básicas de identificação.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={user?.photoURL || undefined} />
                                    <AvatarFallback className="text-xl">
                                        {user?.email?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1 text-center sm:text-left">
                                    <p className="font-medium text-sm text-muted-foreground">Foto de perfil</p>
                                    <p className="text-xs text-muted-foreground max-w-[200px]">
                                        A foto é gerenciada através da sua conta Google.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    O email não pode ser alterado pois está vinculado ao login social.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nome de Exibição</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isUpdatingProfile || name === user?.displayName}
                            >
                                {isUpdatingProfile ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    'Salvar Alterações'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Subscription Section */}
                <Card className={isProUser ? "border-primary/50 bg-primary/5" : ""}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Assinatura e Plano
                        </CardTitle>
                        <CardDescription>
                            Detalhes do seu plano atual e cobrança.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                <div>
                                    <p className="font-medium">Plano Atual</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-lg font-bold ${isProUser ? 'text-primary' : ''}`}>
                                            {isSubscriptionReady ? (isProUser ? 'MultiQuiz Pro' : 'Gratuito') : 'Carregando...'}
                                        </span>
                                        {isSubscriptionReady && isProUser && (
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                Ativo
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isProUser ? (
                                    <Sparkles className="h-8 w-8 text-primary opacity-50" />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-muted" />
                                )}
                            </div>

                            {isSubscriptionReady && !isProUser && (
                                <div className="rounded-lg bg-muted p-4 space-y-3">
                                    <p className="text-sm font-medium">Faça upgrade para o Pro:</p>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Quizzes ilimitados</li>
                                        <li>• Geração com IA ilimitada</li>
                                        <li>• Relatórios avançados</li>
                                        <li>• Exportação de Leads (CSV)</li>
                                        <li>• Remoção da marca d'água</li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        <Button
                            className="w-full"
                            variant={isProUser ? "outline" : "default"}
                            onClick={handleManageSubscription}
                            disabled={isLoading || !isSubscriptionReady}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processando...
                                </>
                            ) : !isSubscriptionReady ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Carregando plano...
                                </>
                            ) : isProUser ? (
                                'Gerenciar Assinatura'
                            ) : (
                                'Fazer Upgrade para Pro'
                            )}
                        </Button>

                        {isProUser && (
                            <p className="text-xs text-center text-muted-foreground">
                                Gerencie formas de pagamento e faturas através do portal seguro da Stripe.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
