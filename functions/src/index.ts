import { onRequest } from 'firebase-functions/v2/https';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

interface ErrorWithMessage {
  message: string;
}

interface CallableError {
  message?: string;
  code?: string;
}

// Import secrets
import { stripeSecretKey, stripeWebhookSecret, openRouterProvisioningKey } from './config';

// Import handlers
import * as createCheckoutHandler from './handlers/createCheckout';
import * as getUserKeyHandler from './handlers/getUserKey';
import * as stripeWebhookHandler from './handlers/stripeWebhook';

// Initialize Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}
// --- V2 Callable Functions ---

/** 
 * Callable: createCheckoutSession 
 * Expects { planId, isSubscription, successUrl, cancelUrl } in request.data
 */
export const createCheckoutSession = onCall({
  region: 'us-central1',
  cors: [
    'https://agentic-browser.com',
    'https://www.agentic-browser.com',
    'https://agenticbrowser-622ab.web.app',
    'https://agenticbrowser-622ab.firebaseapp.com'
  ],
  secrets: [stripeSecretKey],
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }
  try {
    const uid = request.auth.uid;
    const { planId, isSubscription, successUrl, cancelUrl } = request.data as {
      planId: string;
      isSubscription: boolean;
      successUrl: string;
      cancelUrl: string;
    };
    if (!planId || typeof isSubscription === 'undefined' || !successUrl || !cancelUrl) {
      throw new HttpsError('invalid-argument', 'Missing required parameters.');
    }

    return await createCheckoutHandler.createCheckoutSessionWithParams({
      uid,
      planId,
      isSubscription,
      successUrl,
      cancelUrl,
    });
  } catch (error: unknown) {
    const typedError = error as CallableError;
    console.error('Callable error:', typedError);
    throw new HttpsError('internal', typedError.message || 'Unknown error');
  }
});

/** 
 * Callable: getUserKey 
 * No data needed, only auth. Returns { apiKey } 
 */
export const getUserKey = onCall({
  region: 'us-central1',
  cors: [
    'https://agentic-browser.com',
    'https://www.agentic-browser.com',
    'https://agenticbrowser-622ab.web.app',
    'https://agenticbrowser-622ab.firebaseapp.com'
  ],
  secrets: [openRouterProvisioningKey],
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  try {
    const uid = request.auth.uid;
    return await getUserKeyHandler.getUserKeyCallable(uid);
  } catch (error: unknown) {
    const typedError = error as ErrorWithMessage;
    console.error('Callable getUserKey error:', typedError);
    if (typedError.message?.includes('API key not found')) {
      throw new HttpsError('not-found', typedError.message);
    } else {
      throw new HttpsError('internal', typedError.message || 'Unknown error');
    }
  }
});

// --- V2 HTTP Functions ---

/**
 * Stripe webhook handler
 * The raw body will be available because the request is sent directly from Stripe
 */
export const stripeWebhook = onRequest({
  region: 'us-central1',
  secrets: [stripeSecretKey, stripeWebhookSecret],
}, async (req, res) => {
  await stripeWebhookHandler.handleStripeWebhook(req as unknown as Request, res as unknown as Response);
});



