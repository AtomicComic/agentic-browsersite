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
import { provisionNewUserApiKey as createUserApiKey } from './handlers/onUserCreate';
import { createCustomerPortalSession } from './handlers/createCustomerPortal';
import { subscribeToNewsletterHandler } from './handlers/subscribeNewsletter';

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
  // Temporarily disable App Check until frontend is properly configured
  // enforceAppCheck: true, // Enforce App Check for security
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
  // Temporarily disable App Check until frontend is properly configured
  // enforceAppCheck: true, // Enforce App Check for security
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

/**
 * Callable: provisionNewUserKey
 * No data needed, only auth. Creates a new OpenRouter API key with 10 cents of credit
 */
export const provisionNewUserKey = onCall({
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

    // Get the user record
    const userRecord = await admin.auth().getUser(uid);

    // Provision a new API key for the user
    logger.info('Calling createUserApiKey function', { uid });
    await createUserApiKey(userRecord);
    logger.info('Successfully provisioned API key for user', { uid });
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error in provisionNewUserKey', { error: errorMessage, auth: request.auth?.uid });
    throw new HttpsError('internal', errorMessage);
  }
});

/**
 * Callable: createCustomerPortal
 * Expects { returnUrl } in request.data
 * Creates a Stripe customer portal session for managing subscriptions
 */
export const createCustomerPortal = onCall({
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
    const { returnUrl } = request.data as { returnUrl: string };

    // Validate input
    if (!returnUrl) {
      logger.warn('Invalid parameters in createCustomerPortal', { uid });
      throw new HttpsError('invalid-argument', 'Missing required parameter: returnUrl');
    }

    // Create customer portal session
    const result = await createCustomerPortalSession(uid, returnUrl);
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error in createCustomerPortal', { error: errorMessage, auth: request.auth?.uid });
    throw new HttpsError('internal', errorMessage);
  }
});

/**
 * Callable: subscribeToNewsletter
 * Expects { email } in request.data
 * Subscribes a user to the newsletter and sends them an email with installation instructions
 */
export const subscribeToNewsletter = onCall({
  ...commonConfig,
  cors: corsConfig,
  cpu: 1,  // Standard CPU allocation
}, async (request) => {
  try {
    const { email } = request.data as { email: string };

    // Validate input
    if (!email) {
      logger.warn('Invalid parameters in subscribeToNewsletter');
      throw new HttpsError('invalid-argument', 'Missing required parameter: email');
    }

    // Subscribe to newsletter and send email
    const result = await subscribeToNewsletterHandler(email);
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error in subscribeToNewsletter', { error: errorMessage });
    throw new HttpsError('internal', errorMessage);
  }
});

