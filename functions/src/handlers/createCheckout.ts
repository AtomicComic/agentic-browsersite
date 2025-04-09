import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { config } from '../config';

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
      apiVersion: '2025-03-31.basil', // Your stated correct version
    });
  }
  return stripe;
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
    const priceId = PRICE_IDS[planId as keyof typeof PRICE_IDS];
    if (!priceId) {
      throw new Error('Invalid plan ID');
    }

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

    // Create checkout session
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

    return { url: session.url || '' };
  } catch (error) {
    console.error('Error in createCheckoutSessionCallable:', error);
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
