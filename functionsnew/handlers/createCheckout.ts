import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { config } from '../../config';

// Initialize Stripe with your secret key
const stripe = new Stripe(config.stripe.secretKey || '', {
  apiVersion: '2025-03-31.basil',
});

// Price IDs from Stripe Dashboard
const PRICE_IDS = config.stripe.priceIds;

// Original Express-based handler (kept for backward compatibility)
export async function createCheckoutSession(req: Request, res: Response) {
  try {
    // Verify Firebase ID token
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Get request data
      const { planId, isSubscription, successUrl, cancelUrl } = req.body;

      // Use the callable implementation
      const checkoutData = await createCheckoutSessionCallable(
        uid,
        planId,
        isSubscription,
        successUrl,
        cancelUrl
      );

      return res.status(200).json(checkoutData);
    } catch (error: any) {
      console.error('Error verifying ID token:', error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

// New callable function handler
export async function createCheckoutSessionCallable(
  uid: string,
  planId: string,
  isSubscription: boolean,
  successUrl: string,
  cancelUrl: string
) {
  try {
    // Validate plan ID
    if (!PRICE_IDS[planId as keyof typeof PRICE_IDS]) {
      throw new Error('Invalid plan ID');
    }

    // Get or create Stripe customer
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();
    let stripeCustomerId = userDoc.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      // Get user email from Firebase Auth
      const userRecord = await admin.auth().getUser(uid);

      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: userRecord.email || undefined,
        metadata: {
          firebaseUID: uid,
        },
      });
      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await userRef.update({ stripeCustomerId });
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[planId as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        firebaseUID: uid,
        planId,
        isSubscription: isSubscription.toString(),
      },
    });

    return { url: session.url || '' };
  } catch (error: any) {
    console.error('Error in createCheckoutSessionCallable:', error);
    throw error;
  }
}

// Function with object parameter pattern
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
