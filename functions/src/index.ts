import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import * as stripeWebhookHandler from './handlers/stripeWebhook';
import * as createCheckoutHandler from './handlers/createCheckout';
import * as getUserKeyHandler from './handlers/getUserKey';

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// Configure middleware
app.use(cors({ origin: true }));

// Define API routes
app.post('/stripeWebhook', 
  express.raw({ type: 'application/json' }), 
  stripeWebhookHandler.handleStripeWebhook
);

app.post('/createCheckoutSession', 
  express.json(), 
  createCheckoutHandler.createCheckoutSession
);

app.get('/getUserKey', 
  express.json(), 
  getUserKeyHandler.getUserKey
);

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);
