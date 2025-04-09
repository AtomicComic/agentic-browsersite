import * as functions from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from 'firebase-admin';
import cors from 'cors'; // Using cors middleware remains a good choice

// Import Secret Manager configuration and specific secrets
import { stripeSecretKey, stripeWebhookSecret, openRouterProvisioningKey } from './config';

// Import refactored handler logic functions
import { createCheckoutSessionLogic } from './handlers/createCheckout';
import { getUserKeyLogic } from './handlers/getUserKey';
import { handleStripeWebhook } from './handlers/stripeWebhook';

// Initialize Firebase Admin SDK safely
if (admin.apps.length === 0) {
    admin.initializeApp();
    logger.info('Firebase Admin SDK initialized.');
}

// --- CORS Configuration ---
// Define allowed origins - BE STRICT IN PRODUCTION
const allowedOrigins = [
    'http://localhost:8080', // Allow local dev frontend
    'http://localhost:8081', // Allow local dev frontend (alternative port)
    'https://agenticbrowser.web.app', // Your production frontend domain
    'https://agenticbrowser.firebaseapp.com' // Your production frontend domain (alternative)
    // Add any other specific origins needed, like custom domains
];

const corsHandler = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) - BE CAREFUL with this in production if not needed
    // if (!origin) return callback(null, true);

    // Allow specific origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS rejection for origin:', { origin });
      callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'], // Specify allowed methods
});

// --- V2 HTTP Functions ---

// HTTP function for creating checkout sessions (secured, uses refactored logic)
export const createCheckoutSessionHttp = onRequest( {
  region: "us-central1",
  secrets: [stripeSecretKey], // Declare needed secret
  cors: false, // Use the cors middleware manually for more control
}, (request, response) => {
    // Apply CORS manually FIRST
    corsHandler(request, response, async () => {
        // Proceed only if CORS is successful
        if (request.method !== 'POST') {
            logger.warn('Method Not Allowed for createCheckoutSessionHttp:', { method: request.method });
            response.status(405).send('Method Not Allowed');
            return;
        }
         logger.info('createCheckoutSessionHttp called', { headers: request.headers });

        let uid: string;
        try {
            // --- Authentication ---
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                logger.warn('Unauthorized: No or invalid Authorization header.');
                response.status(401).json({ error: 'Unauthorized', message: 'Authorization token required.' });
                return;
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            uid = decodedToken.uid;
             logger.info('Token verified successfully for HTTP request.', { uid });
            // --- End Authentication ---

            // --- Input Validation ---
            const { planId, isSubscription, successUrl, cancelUrl } = request.body;
            if (!planId || typeof isSubscription !== 'boolean' || !successUrl || !cancelUrl) {
                logger.warn('Bad Request: Missing required parameters.', { body: request.body });
                response.status(400).json({ error: 'Bad Request', message: 'Missing required parameters: planId, isSubscription (boolean), successUrl, cancelUrl.' });
                return;
            }
            // Add more specific validation if needed (e.g., URL format)
            // --- End Input Validation ---

            // Call the core logic function
            const result = await createCheckoutSessionLogic({
                uid,
                planId,
                isSubscription,
                successUrl,
                cancelUrl
            });

            response.status(200).json(result);

        } catch (error: any) {
             logger.error('Error in createCheckoutSessionHttp handler:', { error: error.message, stack: error.stack, uid: uid ?? 'unknown' });
             if (error instanceof HttpsError) { // Handle HttpsErrors from logic function
                 response.status(mapHttpsErrorToStatus(error.code)).json({ error: error.code, message: error.message });
             } else if (error.message?.includes('verifyIdToken')) { // Specific handling for token verification errors
                 response.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token.' });
             } else {
                 response.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred.' }); // Generic error
             }
        }
    });
});

// HTTP function for getting user API key hash (secured, uses refactored logic)
export const getUserKeyHttp = onRequest({
    region: "us-central1",
    secrets: [], // No secrets needed directly by this endpoint wrapper
    cors: false, // Use the cors middleware manually
}, (request, response) => {
     // Apply CORS manually FIRST
    corsHandler(request, response, async () => {
        // Allow only GET requests (more appropriate for retrieving data)
        if (request.method !== 'GET') {
             logger.warn('Method Not Allowed for getUserKeyHttp:', { method: request.method });
             response.status(405).send('Method Not Allowed');
             return;
        }
         logger.info('getUserKeyHttp called', { headers: request.headers });

        let uid: string;
        try {
            // --- Authentication ---
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                 logger.warn('Unauthorized: No or invalid Authorization header.');
                 response.status(401).json({ error: 'Unauthorized', message: 'Authorization token required.' });
                 return;
            }
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            uid = decodedToken.uid;
             logger.info('Token verified successfully for HTTP request.', { uid });
            // --- End Authentication ---

            // Call the core logic function
            const result = await getUserKeyLogic(uid);

            response.status(200).json(result); // result is { apiKey: 'hash...' }

        } catch (error: any) {
             logger.error('Error in getUserKeyHttp handler:', { error: error.message, stack: error.stack, uid: uid ?? 'unknown' });
             if (error instanceof HttpsError) {
                 response.status(mapHttpsErrorToStatus(error.code)).json({ error: error.code, message: error.message });
             } else if (error.message?.includes('verifyIdToken')) {
                 response.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token.' });
             } else {
                 response.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred.' });
             }
        }
    });
});

// Stripe webhook handler (V2 native, calls refactored handler)
export const stripeWebhook = onRequest( {
  region: "us-central1",
  secrets: [stripeSecretKey, stripeWebhookSecret, openRouterProvisioningKey], // Needs all secrets used by the handler
  // No CORS needed for webhooks typically
}, async (request, response) => {
     logger.info('stripeWebhook called', { method: request.method });

    // Stripe sends POST requests
    if (request.method !== 'POST') {
         logger.warn('Method Not Allowed received on webhook endpoint:', { method: request.method });
         response.setHeader('Allow', 'POST'); // Inform client
         response.status(405).send('Method Not Allowed');
         return;
    }

    // Delegate directly to the refactored handler
    // The handler now directly uses V2 request/response types
    await handleStripeWebhook(request, response);
});


// --- V2 Callable Functions ---

// Callable function for creating checkout sessions
export const createCheckoutSession = onCall({
  region: "us-central1",
  secrets: [stripeSecretKey], // Declare needed secret
  // Use built-in CORS handling for Callable Functions
  cors: allowedOrigins,
}, async (request) => {
     logger.info('Callable createCheckoutSession called', { auth: request.auth ? { uid: request.auth.uid } : null, data: request.data });

    // --- Authentication (Built-in for Callable) ---
    if (!request.auth) {
         logger.warn('Unauthenticated call to createCheckoutSession.');
         throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const uid = request.auth.uid;
    // --- End Authentication ---

    try {
        // --- Input Validation ---
        const { planId, isSubscription, successUrl, cancelUrl } = request.data as {
            planId?: string; // Mark as potentially undefined for robust checking
            isSubscription?: boolean;
            successUrl?: string;
            cancelUrl?: string;
        };

        if (!planId || typeof isSubscription !== 'boolean' || !successUrl || !cancelUrl) {
             logger.warn('Invalid Argument: Missing required parameters in callable request.', { uid, data: request.data });
             throw new HttpsError('invalid-argument', 'Missing required parameters: planId, isSubscription (boolean), successUrl, cancelUrl.');
        }
        // --- End Input Validation ---

        // Call the core logic function
        const result = await createCheckoutSessionLogic({
            uid,
            planId,
            isSubscription,
            successUrl,
            cancelUrl
        });

        return result; // Return data directly

    } catch (error: any) {
         logger.error('Error in callable createCheckoutSession:', { uid, error: error.message, stack: error.stack });
         if (error instanceof HttpsError) {
             throw error; // Re-throw known HttpsErrors
         } else {
             throw new HttpsError('internal', 'An unexpected server error occurred.'); // Throw generic internal error
         }
    }
});

// Callable function for getting user API key hash
export const getUserKey = onCall({
  region: "us-central1",
  secrets: [], // No secrets needed directly by this wrapper
  cors: allowedOrigins, // Use built-in CORS
}, async (request) => {
     logger.info('Callable getUserKey called', { auth: request.auth ? { uid: request.auth.uid } : null });

    // --- Authentication ---
    if (!request.auth) {
         logger.warn('Unauthenticated call to getUserKey.');
         throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const uid = request.auth.uid;
    // --- End Authentication ---

    try {
        // Call the core logic function
        const result = await getUserKeyLogic(uid);
        return result; // Return { apiKey: 'hash...' }

    } catch (error: any) {
         logger.error('Error in callable getUserKey:', { uid, error: error.message, stack: error.stack });
         if (error instanceof HttpsError) {
             throw error; // Re-throw known HttpsErrors (like 'not-found')
         } else {
              throw new HttpsError('internal', 'An unexpected server error occurred.');
         }
    }
});

// Helper to map HttpsError codes to HTTP status codes
function mapHttpsErrorToStatus(code: functions.https.FunctionsErrorCode): number {
    switch (code) {
        case 'ok': return 200;
        case 'cancelled': return 499;
        case 'unknown': return 500;
        case 'invalid-argument': return 400;
        case 'deadline-exceeded': return 504;
        case 'not-found': return 404;
        case 'already-exists': return 409;
        case 'permission-denied': return 403;
        case 'resource-exhausted': return 429;
        case 'failed-precondition': return 400;
        case 'aborted': return 409;
        case 'out-of-range': return 400;
        case 'unimplemented': return 501;
        case 'internal': return 500;
        case 'unavailable': return 503;
        case 'data-loss': return 500;
        case 'unauthenticated': return 401;
        default: return 500;
    }
}

// Note: The Cloud Run specific server code block (if (process.env.K_SERVICE)) is removed
// as it's generally not needed or recommended within a standard Firebase Functions deployment.
// If you *are* deploying this same codebase to Cloud Run, that block would be necessary there.