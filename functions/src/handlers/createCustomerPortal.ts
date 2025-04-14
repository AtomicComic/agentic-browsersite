import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Get Stripe instance
let stripe: Stripe | null = null;

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

// Create a customer portal session
export async function createCustomerPortalSession(
  uid: string,
  returnUrl: string
): Promise<{ url: string }> {
  try {
    const stripeInstance = getStripeInstance();

    // Get the user's Stripe customer ID from Firestore
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      logger.error('User document not found', { uid });
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      logger.error('User does not have a Stripe customer ID', { uid });
      throw new Error('No Stripe customer ID found for this user');
    }

    // Create a billing portal session
    const session = await stripeInstance.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a portal URL');
    }

    return { url: session.url };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error in createCustomerPortalSession', { 
      error: errorMessage, 
      uid
    });
    throw error;
  }
}
