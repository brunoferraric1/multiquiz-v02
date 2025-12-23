import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getTierFromPriceId } from '@/lib/stripe';
import {
    updateUserSubscription,
    findUserByStripeCustomerId,
    UserSubscription
} from '@/lib/firebase-admin';
import Stripe from 'stripe';

// Disable body parsing, we need raw body for webhook signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        const stripeClient = getStripe();
        event = stripeClient.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    console.log(`Processing webhook event: ${event.type}`);
    // Debug: log key identifiers to trace user mapping
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Webhook][checkout.session.completed]', {
            customer: session.customer,
            subscription: session.subscription,
            firebaseUserId: session.metadata?.firebaseUserId,
            priceFromSession: session?.amount_total,
        });
    }
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
        const invoice = event.data.object as Stripe.Invoice;
        // Invoice line items may not type `price`, so cast defensively for logging
        const firstLine = invoice.lines?.data?.[0] as (Stripe.InvoiceLineItem & { price?: Stripe.Price }) | undefined;
        console.log(`[Webhook][${event.type}]`, {
            customer: invoice.customer,
            subscription: (invoice as any).subscription,
            priceId: firstLine?.price?.id,
        });
    }
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook][${event.type}]`, {
            customer: subscription.customer,
            priceId: subscription.items?.data?.[0]?.price?.id,
            status: subscription.status,
        });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaid(invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentFailed(invoice);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error(`Error processing webhook ${event.type}:`, error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    console.log('[handleCheckoutCompleted] received', {
        customerId,
        subscriptionId,
        metadataUser: session.metadata?.firebaseUserId,
    });

    // Get user ID from metadata or find by customer ID
    let userId = session.metadata?.firebaseUserId;

    if (!userId) {
        userId = await findUserByStripeCustomerId(customerId) || undefined;
    }

    if (!userId) {
        console.error('Could not find user for checkout session:', session.id);
        return;
    }

    // Retrieve subscription details
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;

    // Access period end from the subscription object
    const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;

    const subscriptionData: Partial<UserSubscription> = {
        tier: getTierFromPriceId(priceId),
        status: 'active',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        currentPeriodEnd: periodEnd * 1000, // Convert to ms
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };

    await updateUserSubscription(userId, subscriptionData);
    console.log(`Subscription activated for user ${userId}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    // Get subscription ID from invoice - access via casting since Stripe types may not include it
    const invoiceData = invoice as unknown as { subscription?: string | { id: string } | null };
    const subscriptionId = typeof invoiceData.subscription === 'string'
        ? invoiceData.subscription
        : invoiceData.subscription?.id;

    if (!subscriptionId) return; // Not a subscription invoice

    const userId = await findUserByStripeCustomerId(customerId);
    if (!userId) {
        console.error('Could not find user for invoice:', invoice.id);
        return;
    }

    // Retrieve subscription to get updated period
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;
    const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;

    await updateUserSubscription(userId, {
        tier: getTierFromPriceId(priceId),
        status: 'active',
        currentPeriodEnd: periodEnd * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    console.log(`Subscription renewed for user ${userId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const userId = await findUserByStripeCustomerId(customerId);
    if (!userId) {
        console.error('Could not find user for failed payment:', invoice.id);
        return;
    }

    await updateUserSubscription(userId, {
        status: 'past_due',
    });

    console.log(`Payment failed for user ${userId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const userId = await findUserByStripeCustomerId(customerId);
    if (!userId) {
        console.error('Could not find user for subscription update:', subscription.id);
        return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    const status = subscription.status === 'active' ? 'active' :
        subscription.status === 'canceled' ? 'canceled' :
            subscription.status === 'past_due' ? 'past_due' :
                subscription.status === 'trialing' ? 'trialing' : 'active';

    const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;

    await updateUserSubscription(userId, {
        tier: getTierFromPriceId(priceId),
        status,
        stripePriceId: priceId,
        currentPeriodEnd: periodEnd * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    console.log(`Subscription updated for user ${userId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const userId = await findUserByStripeCustomerId(customerId);
    if (!userId) {
        console.error('Could not find user for subscription deletion:', subscription.id);
        return;
    }

    // Revert to free tier
    await updateUserSubscription(userId, {
        tier: 'free',
        status: 'canceled',
        stripeSubscriptionId: undefined,
        stripePriceId: undefined,
        currentPeriodEnd: undefined,
        cancelAtPeriodEnd: undefined,
    });

    console.log(`Subscription canceled for user ${userId}, reverted to free tier`);
}
