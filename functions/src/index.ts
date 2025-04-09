import { onRequest } from 'firebase-functions/v2/https';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import express from 'express';
import { json } from 'express';
import { WebhookResponse } from './types';

const app = express();

// Configure express to use raw body parser for Stripe webhooks
app.use('/stripe-webhook', express.raw({ type: 'application/json' }));
// Use regular JSON parser for all other routes
app.use(json());

// Import secrets
import { stripeSecretKey, stripeWebhookSecret, openRouterProvisioningKey } from './config';

// Import handlers
import * as createCheckoutHandler from './handlers/createCheckout';
import * as getUserKeyHandler from './handlers/getUserKey';
import { handleStripeWebhook } from './handlers/stripeWebhook';

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
// Updated stripeWebhook function in index.js
export const stripeWebhook = onRequest({
  ...commonConfig,
  secrets: [stripeSecretKey, stripeWebhookSecret, openRouterProvisioningKey],
  timeoutSeconds: 60,
  // Critical: This defines how to handle the raw body
  invoker: 'http',
}, async (req, res) => {
  try {
    // Log incoming request details for debugging
    logger.info('⭐ Webhook received:', {
      headers: req.headers,
      path: req.path,
      method: req.method
    });

    await handleStripeWebhook(req, res as unknown as WebhookResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error in stripeWebhook', {
      error: errorMessage,
      hasSignature: !!req.headers['stripe-signature']
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});








