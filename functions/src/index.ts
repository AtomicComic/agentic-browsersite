import { onRequest } from 'firebase-functions/v2/https';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import cors from 'cors';
import express from 'express';
import * as http from 'http';

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

// Set up a CORS instance for production
const allowedOrigins = [
  'https://agentic-browser.com/',
  'https://www.agentic-browser.com/',
  'https://agenticbrowser-622ab.web.app/',
  'https://agenticbrowser-622ab.firebaseapp.com/'
]; 
const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('Not allowed by CORS'), false);
    }
    return callback(null, true);
  },
});

// --- V2 Callable Functions ---

/** 
 * Callable: createCheckoutSession 
 * Expects { planId, isSubscription, successUrl, cancelUrl } in request.data
 */
export const createCheckoutSession = onCall({
  region: 'us-central1',
  cors: [
    'https://agentic-browser.com/',
    'https://www.agentic-browser.com/',
    'https://agenticbrowser-622ab.web.app/',
    'https://agenticbrowser-622ab.firebaseapp.com/'
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
  } catch (error: any) {
    console.error('Callable createCheckoutSession error:', error);
    throw new HttpsError('internal', error.message || 'Unknown error');
  }
});

/** 
 * Callable: getUserKey 
 * No data needed, only auth. Returns { apiKey } 
 */
export const getUserKey = onCall({
  region: 'us-central1',
  cors: [
    'https://agentic-browser.com/',
    'https://www.agentic-browser.com/',
    'https://agenticbrowser-622ab.web.app/',
    'https://agenticbrowser-622ab.firebaseapp.com/'
  ],
  secrets: [openRouterProvisioningKey],
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }
  try {
    const uid = request.auth.uid;
    return await getUserKeyHandler.getUserKeyCallable(uid);
  } catch (error: any) {
    console.error('Callable getUserKey error:', error);
    if (error.message?.includes('API key not found')) {
      throw new HttpsError('not-found', error.message);
    } else {
      throw new HttpsError('internal', error.message || 'Unknown error');
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
  await stripeWebhookHandler.handleStripeWebhook(req, res);
});

// If you want separate HTTP endpoints (e.g., for debugging), 
// you can define them similarly with onRequest and corsMiddleware. 
// But for production security, limit open endpoints carefully.

// --- Optional: If running in Cloud Run ---
if (process.env.K_SERVICE) {
  const app = express();
  app.use(corsMiddleware);

  // Health check
  app.get('/', (req, res) => {
    res.status(200).send('OK');
  });

  const server = http.createServer(app);
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => {
    console.log(`Cloud Run server listening on port ${PORT}`);
  });

  app.get('/health', (req, res) => {
    res.status(200).send('Healthy');
  });
  

  app.get('/ready', (req, res) => {
    res.status(200).send('Ready');
  });
}

