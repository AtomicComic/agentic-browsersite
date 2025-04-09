import { onRequest } from 'firebase-functions/v2/https';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';
import { logger } from 'firebase-functions';

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

// Common CORS configuration to avoid duplication
const corsConfig = [
  'https://agentic-browser.com',
  'https://www.agentic-browser.com',
  'https://agenticbrowser-622ab.web.app',
  'https://agenticbrowser-622ab.firebaseapp.com'
];

// Common configuration for all functions to avoid port conflicts
const commonConfig = {
  region: 'us-central1',
  concurrency: 80,  // Configure appropriate concurrency for better scaling
  minInstances: 0,  // Scale to zero when not in use (cost-effective)
};

/** 
 * Callable: createCheckoutSession 
 * Expects { planId, isSubscription, successUrl, cancelUrl } in request.data
 */
export const createCheckoutSession = onCall({
  ...commonConfig,
  cors: corsConfig,
  secrets: [stripeSecretKey],
  cpu: 1,  // Standard CPU allocation
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
    
    // Improved input validation
    if (!planId || typeof isSubscription !== 'boolean' || !successUrl || !cancelUrl) {
      logger.warn('Invalid parameters in createCheckoutSession', { uid, planId, isSubscription });
      throw new HttpsError('invalid-argument', 'Missing or invalid required parameters.');
    }

    return await createCheckoutHandler.createCheckoutSessionWithParams({
      uid,
      planId,
      isSubscription,
      successUrl,
      cancelUrl,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error in createCheckoutSession', { error: errorMessage, auth: request.auth?.uid });
    throw new HttpsError('internal', errorMessage);
  }
});

/** 
 * Callable: getUserKey 
 * No data needed, only auth. Returns { apiKey } 
 */
export const getUserKey = onCall({
  ...commonConfig,
  cors: corsConfig,
  secrets: [openRouterProvisioningKey],
  cpu: 1,  // Standard CPU allocation
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  try {
    const uid = request.auth.uid;
    return await getUserKeyHandler.getUserKeyCallable(uid);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    logger.error('Error in getUserKey', { error: errorMessage, auth: request.auth?.uid });
    
    if (errorMessage.includes('API key not found')) {
      throw new HttpsError('not-found', errorMessage);
    } else {
      throw new HttpsError('internal', errorMessage);
    }
  }
});

/**
 * Stripe webhook handler
 * The raw body will be available because the request is sent directly from Stripe
 */
export const stripeWebhook = onRequest({
  ...commonConfig,
  secrets: [stripeSecretKey, stripeWebhookSecret],
  timeoutSeconds: 60,  // Extend timeout for webhook processing
}, async (req, res) => {
  try {
    await stripeWebhookHandler.handleStripeWebhook(req as unknown as Request, res as unknown as Response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error in stripeWebhook', { 
      error: errorMessage, 
      headers: req.headers
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});
