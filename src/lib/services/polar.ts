// Polar.sh Payment Integration Service
// Plans are hosted on Polar.sh (org: pt-yerdna) and provisioned via New API webhook bridge.
// Artflowly links directly to Polar checkout — no Polar SDK needed for checkout flow.

import crypto from 'crypto';
import { Polar } from '@polar-sh/sdk';
import { prisma } from '@/lib/db/prisma';
import { addCredits } from './credits';

// Initialize Polar client (only needed for customer portal, optional)
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
});

// Polar Product IDs → mapped to New API plans via webhook bridge
const POLAR_PRODUCTS = {
  starter:    'b5785e27-04a2-421a-b86c-f2b7d81eccfe',
  basic:      '00a7bc95-2cd1-436c-acba-191626cbeece',
  standard:   '25ab9887-8e2b-4be9-99c3-95b35bce77b3',
  pro:        '1a442a34-fe83-42ef-b20d-095839946bfb',
  business:   'ce6852a5-a941-4ce9-a42c-c6c2354008cb',
  enterprise: '922814b0-ec42-43bd-b412-67f8e4eb21ff',
} as const;

// Subscription plan configuration — matches New API plans on Polar.sh
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    credits: 0, // Dynamically set from AppConfig.startingCredits in /api/polar
    quota: '$0',
    description: 'Try out the app',
    hidden: true,
    features: ['Credits on signup', 'Basic features', 'Community support'],
  },
  starter: {
    name: 'Starter',
    price: 1,
    credits: 0,
    quota: '$2',
    description: 'Try AI generation',
    hidden: true,
    productId: POLAR_PRODUCTS.starter,
    features: ['$2 API quota/month', 'All AI models', '300% markup', 'Community support'],
  },
  basic: {
    name: 'Basic',
    price: 9,
    credits: 0,
    quota: 'Up to 1 short film',
    description: 'For hobbyists',
    productId: POLAR_PRODUCTS.basic,
    features: ['Up to 1 short film', 'All AI models', 'Image, video, voice & music', 'Email support', '!Personal use only'],
  },
  standard: {
    name: 'Standard',
    price: 19,
    credits: 0,
    quota: 'Up to 1 film',
    description: 'Best value',
    productId: POLAR_PRODUCTS.standard,
    features: ['Up to 1 film', 'All AI models', 'Image, video, voice & music', 'Priority support', '!Personal use only'],
  },
  pro: {
    name: 'Pro',
    price: 39,
    credits: 0,
    quota: 'Up to 2 films',
    description: 'For power users',
    productId: POLAR_PRODUCTS.pro,
    features: ['Up to 2 films', 'All AI models', 'Image, video, voice & music', 'Priority support', '!Personal use only'],
  },
  business: {
    name: 'Business',
    price: 79,
    credits: 0,
    quota: 'Up to 5 films',
    description: 'For teams',
    productId: POLAR_PRODUCTS.business,
    features: ['Up to 5 films', 'All AI models', 'Image, video, voice & music', 'Dedicated support', '!Personal use only'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    credits: 0,
    quota: 'Up to 10 films',
    description: 'Maximum value',
    productId: POLAR_PRODUCTS.enterprise,
    features: ['Up to 10 films', 'All AI models', 'Image, video, voice & music', 'Dedicated support', 'Lowest cost per generation'],
  },
} as const;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;

/**
 * Create a checkout URL for a subscription plan.
 * Uses direct Polar.sh checkout link — no Polar SDK needed.
 * The New API webhook bridge handles provisioning automatically.
 */
export async function createCheckout(
  userId: string,
  userEmail: string,
  plan: PlanType
): Promise<{ url: string } | { error: string }> {
  try {
    if (plan === 'free') {
      return { error: 'Cannot checkout for free plan' };
    }

    const planConfig = SUBSCRIPTION_PLANS[plan];
    if (!('productId' in planConfig) || !planConfig.productId) {
      return { error: `Product ID not configured for ${plan} plan` };
    }

    // Get or create subscription record in Artflowly DB
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          status: 'free',
          plan: 'free',
        },
      });
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://artflowly.com'}/billing?success=true`;

    // Create checkout session via Polar API
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!accessToken) {
      return { error: 'POLAR_ACCESS_TOKEN not configured' };
    }

    const response = await fetch('https://api.polar.sh/v1/checkouts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        products: [planConfig.productId],
        success_url: successUrl,
        ...(userEmail ? { customer_email: userEmail } : {}),
        metadata: {
          userId: userId,
          plan: plan,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Polar checkout API error:', response.status, errorData);

      // If customer_email validation failed, retry without it
      if (response.status === 422 && userEmail) {
        console.log('Retrying Polar checkout without customer_email...');
        const retryResponse = await fetch('https://api.polar.sh/v1/checkouts/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            products: [planConfig.productId],
            success_url: successUrl,
            metadata: {
              userId: userId,
              plan: plan,
            },
          }),
        });

        if (retryResponse.ok) {
          const retryCheckout = await retryResponse.json();
          return { url: retryCheckout.url };
        }

        const retryError = await retryResponse.json().catch(() => ({}));
        console.error('Polar checkout retry also failed:', retryResponse.status, retryError);
      }

      return { error: `Polar API error: ${response.status}` };
    }

    const checkout = await response.json();
    return { url: checkout.url };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; body?: { detail?: string }; message?: string };
    console.error('Error creating checkout:', err?.statusCode, err?.body || err?.message || error);
    const message = err?.body?.detail || err?.message || 'Failed to create checkout';
    return { error: typeof message === 'string' ? message : JSON.stringify(message) };
  }
}

/**
 * Get customer portal URL for managing subscription
 */
export async function getCustomerPortal(
  userId: string
): Promise<{ url: string } | { error: string }> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.polarCustomerId) {
      return { error: 'No subscription found' };
    }

    const session = await polar.customerSessions.create({
      customerId: subscription.polarCustomerId,
    });

    return { url: session.customerPortalUrl };
  } catch (error) {
    console.error('Error getting customer portal:', error);
    return { error: error instanceof Error ? error.message : 'Failed to get portal URL' };
  }
}

/**
 * Get user's current subscription
 */
export async function getSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return {
      status: 'free',
      plan: 'free' as PlanType,
      planDetails: SUBSCRIPTION_PLANS.free,
    };
  }

  return {
    status: subscription.status,
    plan: subscription.plan as PlanType,
    planDetails: SUBSCRIPTION_PLANS[subscription.plan as PlanType] || SUBSCRIPTION_PLANS.free,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}

/**
 * Handle subscription activation (called from webhook)
 */
export async function activateSubscription(
  userId: string,
  polarCustomerId: string,
  polarSubscriptionId: string,
  plan: PlanType,
  currentPeriodEnd: Date
): Promise<void> {
  // Update subscription record
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      status: 'active',
      plan,
      polarCustomerId,
      polarSubscriptionId,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
    },
    create: {
      userId,
      status: 'active',
      plan,
      polarCustomerId,
      polarSubscriptionId,
      currentPeriodEnd,
    },
  });

  // Add credits for the plan
  const planConfig = SUBSCRIPTION_PLANS[plan];
  if (planConfig && planConfig.credits > 0) {
    await addCredits(
      userId,
      planConfig.credits,
      'subscription',
      `${planConfig.name} plan activation`
    );
  }
}

/**
 * Handle subscription renewal (called from webhook)
 * Credits are reset to 0 and new monthly credits are added (no rollover)
 */
export async function renewSubscription(
  userId: string,
  currentPeriodEnd: Date
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) return;

  // Update period end
  await prisma.subscription.update({
    where: { userId },
    data: { currentPeriodEnd },
  });

  // Reset credits to 0 and add new monthly credits (no rollover)
  const planConfig = SUBSCRIPTION_PLANS[subscription.plan as PlanType];
  if (planConfig && planConfig.credits > 0) {
    // Reset balance to 0 first
    await prisma.credits.updateMany({
      where: { userId },
      data: {
        balance: 0,
        lastUpdated: new Date(),
      },
    });

    // Add fresh monthly credits
    await addCredits(
      userId,
      planConfig.credits,
      'subscription_renewal',
      `${planConfig.name} plan renewal (monthly reset)`
    );
  }
}

/**
 * Handle subscription cancellation (called from webhook)
 */
export async function cancelSubscription(
  userId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: cancelAtPeriodEnd ? 'active' : 'canceled',
      cancelAtPeriodEnd,
    },
  });
}

/**
 * Handle subscription ended (period expired after cancellation)
 */
export async function endSubscription(userId: string): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'free',
      plan: 'free',
      polarSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  });
}

/**
 * Verify Polar webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.POLAR_WEBHOOK_SECRET;

  if (!secret) {
    console.error('POLAR_WEBHOOK_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}
