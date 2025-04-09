import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { config } from '../config';
import { logger } from 'firebase-functions';

// Price IDs from config
const PRICE_IDS = config.stripe.priceIds;

// We'll initialize Stripe inside each function handler, so it picks up secrets properly
let stripe: Stripe | null = null;

// Helper to get or init the Stripe instance
function getStripeInstance(): Stripe {
  if (!stripe) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('Stripe API key is not available. Make sure secrets are configured.');
    }
    stripe = new Stripe(stripeKey, {
      apiVersion: '2025-03-31.basil',
    });
  }
  return stripe;
}

// Validate plan ID
function isValidPlanId(planId: string): boolean {
  return Object.keys(PRICE_IDS).includes(planId);
}

// Callable function core logic
export async function createCheckoutSessionCallable(
  uid: string,
  planId: string,
  isSubscription: boolean,
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string }> {
  try {
    const stripeInstance = getStripeInstance();

    // Validate plan ID
    if (!isValidPlanId(planId)) {
      logger.warn('Invalid plan ID provided', { uid, planId });
      throw new Error('Invalid plan ID');
    }

    const priceId = PRICE_IDS[planId as keyof typeof PRICE_IDS];

    // Get or create Stripe customer
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();
    let stripeCustomerId = userDoc.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      // Pull user email from Firebase Auth
      const userRecord = await admin.auth().getUser(uid);
      const customer = await stripeInstance.customers.create({
        email: userRecord.email || undefined,
        metadata: { firebaseUID: uid },
      });
      stripeCustomerId = customer.id;
      await userRef.update({ stripeCustomerId });
    }

    // Create checkout session with proper metadata for webhook validation
    const session = await stripeInstance.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        firebaseUID: uid,
        planId,
        isSubscription: String(isSubscription),
      },
    });

    if (!session.url) {
      throw new Error('Stripe did not return a session URL');
    }

    return { url: session.url };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error in createCheckoutSessionCallable', { 
      error: errorMessage, 
      uid,
      planId
    });
    throw error;
  }
}

// Wrap callable logic in a simpler signature (optional convenience function)
export async function createCheckoutSessionWithParams(params: {
  uid: string;
  planId: string;
  isSubscription: boolean;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  const { uid, planId, isSubscription, successUrl, cancelUrl } = params;
  return createCheckoutSessionCallable(uid, planId, isSubscription, successUrl, cancelUrl);
}
