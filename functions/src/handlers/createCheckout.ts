import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Price IDs from Stripe Dashboard - replace with your actual price IDs
const PRICE_IDS: Record<string, string> = {
  'monthly-basic': 'price_xxxx',     // $8.99 for 1000 credits
  'monthly-pro': 'price_xxxx',       // $14.99 for 2000 credits
  'monthly-enterprise': 'price_xxxx', // $24.99 for 3000 credits
  'credits-1500': 'price_xxxx',      // $14.99 for 1500 one-time credits
  'credits-6000': 'price_xxxx',      // $49.99 for 6000 one-time credits
  'credits-15000': 'price_xxxx',     // $99.99 for 15000 one-time credits
};

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

      // Validate plan ID
      if (!PRICE_IDS[planId]) {
        return res.status(400).json({ error: 'Invalid plan ID' });
      }

      // Get or create Stripe customer
      const userRef = admin.firestore().collection('users').doc(uid);
      const userDoc = await userRef.get();
      let stripeCustomerId = userDoc.data()?.stripeCustomerId;

      if (!stripeCustomerId) {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: decodedToken.email || undefined,
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
            price: PRICE_IDS[planId],
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

      return res.status(200).json({ url: session.url });
    } catch (error: any) {
      console.error('Error verifying ID token:', error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
