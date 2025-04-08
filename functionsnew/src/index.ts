/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import { onCall, HttpsError } from "firebase-functions/v2/https"; // Import onCall and HttpsError for v2
import * as logger from "firebase-functions/logger";
import * as admin from 'firebase-admin';
import cors from 'cors'; // Keep using the cors middleware for robust handling

// Assuming these paths are correct for your project structure
import * as createCheckoutHandler from '../../functionsnew/src/handlers/createCheckout';
import * as getUserKeyHandler from '../../functionsnew/src/handlers/getUserKey';
import * as stripeWebhookHandler from '../../functionsnew/src/handlers/stripeWebhook';

// Initialize Firebase Admin SDK (ensure this only runs once)
// Consider using a check like if (admin.apps.length === 0) { admin.initializeApp(); } if needed
admin.initializeApp();

// Initialize CORS middleware
// For production, replace 'true' with your specific frontend origin(s)
// e.g., { origin: 'https://your-frontend-app.com' } or ['https://domain1.com', 'https://domain2.com']
const corsHandler = cors({ origin: true });

// --- V2 HTTP Functions ---

// HTTP function for creating checkout sessions (v2 syntax)
export const createCheckoutSessionHttp = onRequest( { region: "us-central1" /* Optional: Specify region */ }, (request, response) => {
    // Apply CORS middleware
    corsHandler(request, response, async () => {
        logger.info('createCheckoutSessionHttp called', { method: request.method, headers: request.headers });

        if (request.method !== 'POST') {
            logger.warn('Method Not Allowed:', request.method);
            response.status(405).send('Method Not Allowed');
            return;
        }

        try {
            // Parse the request body (already parsed by default in v2 onRequest)
            const requestData = request.body;
            logger.info('Request data:', { body: requestData });

            // Verify Firebase ID token if provided
            let uid: string | undefined;
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const idToken = authHeader.split('Bearer ')[1];
                try {
                    const decodedToken = await admin.auth().verifyIdToken(idToken);
                    uid = decodedToken.uid;
                    logger.info('Token verified successfully', { uid });
                } catch (error) {
                    logger.error('Error verifying ID token:', error);
                    response.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
                    return;
                }
            } else {
                // Fallback for testing (consider removing or securing this in production)
                logger.warn('No authorization token provided, using test fallback.');
                uid = requestData.uid || 'test-user-fallback'; // Ensure uid is always assigned if needed later
            }

            // Ensure uid was determined
            if (!uid) {
                 logger.error('Could not determine UID.');
                 response.status(400).json({ error: 'Bad Request', message: 'Could not determine user ID.' });
                 return;
            }

            const { planId, isSubscription, successUrl, cancelUrl } = requestData;

             // Basic validation (add more as needed)
            if (!planId || typeof isSubscription === 'undefined' || !successUrl || !cancelUrl) {
                logger.error('Missing required parameters in request body');
                response.status(400).json({ error: 'Bad Request', message: 'Missing required parameters.' });
                return;
            }


            // Call the handler function
            const result = await createCheckoutHandler.createCheckoutSessionWithParams({
                uid,
                planId,
                isSubscription,
                successUrl,
                cancelUrl
            });

            response.status(200).json(result);
        } catch (error: any) {
            logger.error('Error in HTTP createCheckoutSession:', error);
            response.status(500).json({
                error: 'Internal Server Error',
                message: error.message || 'An unknown error occurred'
            });
        }
    });
});

// HTTP function for getting user key (v2 syntax)
export const getUserKeyHttp = onRequest({ region: "us-central1" /* Optional: Specify region */ }, (request, response) => {
    // Apply CORS middleware
    corsHandler(request, response, async () => {
        logger.info('getUserKeyHttp called', { method: request.method, headers: request.headers });

        if (request.method !== 'POST') { // Consider if GET is more appropriate for fetching data
             logger.warn('Method Not Allowed:', request.method);
             response.status(405).send('Method Not Allowed');
             return;
        }

        try {
            // Verify Firebase ID token
            let uid: string | undefined;
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const idToken = authHeader.split('Bearer ')[1];
                try {
                    const decodedToken = await admin.auth().verifyIdToken(idToken);
                    uid = decodedToken.uid;
                     logger.info('Token verified successfully', { uid });
                } catch (error) {
                    logger.error('Error verifying ID token:', error);
                    response.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
                    return;
                }
            } else {
                logger.warn('No authorization token provided.');
                response.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
                return;
            }

             // Ensure uid was determined (should always be true if code reaches here)
            if (!uid) {
                 logger.error('Logical error: UID not determined after auth check.');
                 response.status(500).json({ error: 'Internal Server Error', message: 'Could not determine user ID.' });
                 return;
            }


            // Call the handler function
            const result = await getUserKeyHandler.getUserKeyCallable(uid); // Assuming this handler is appropriate

            response.status(200).json(result);
        } catch (error: any) {
            logger.error('Error in HTTP getUserKey:', error);
            // Check if it's a specific error from the handler (e.g., key not found)
             if (error.message?.includes('API key not found')) {
                 response.status(404).json({ error: 'Not Found', message: error.message });
             } else {
                 response.status(500).json({
                     error: 'Internal Server Error',
                     message: error.message || 'An unknown error occurred'
                 });
             }
        }
    });
});

// Stripe webhook handler (v2 syntax) - no CORS needed
export const stripeWebhook = onRequest( { region: "us-central1" /* Optional: Specify region */ }, async (request, response) => {
    logger.info('stripeWebhook called', { method: request.method });

    if (request.method !== 'POST') {
        logger.warn('Method Not Allowed:', request.method);
        response.status(405).send('Method Not Allowed');
        return;
    }

    try {
        // Pass the v2 request/response objects to the handler if it expects them
        // Or adapt the handler if it expects specific framework objects (like Express req/res)
        // Assuming the handler is compatible or adapted:
        await stripeWebhookHandler.handleStripeWebhook(request, response);
        // Note: The handler might send the response itself. If so, remove any response sending here.
        // If the handler *doesn't* send the response, you might need to add:
        // logger.info("Stripe webhook processed successfully.");
        // response.status(200).send('Webhook received');
    } catch (error: any) {
        logger.error('Error in stripeWebhook:', error);
        // Avoid sending detailed errors back to Stripe if possible
        response.status(500).send('Internal Server Error');
    }
});

// --- V2 Callable Functions ---

// Callable function for creating checkout sessions (v2 syntax)
export const createCheckoutSession = onCall({ region: "us-central1" /* Optional: Specify region */ }, async (request) => {
    logger.info('Callable createCheckoutSession called', { auth: request.auth, data: request.data });

    // Ensure user is authenticated (v2 style)
    if (!request.auth) {
        logger.warn('User not authenticated for callable function.');
        throw new HttpsError('unauthenticated', 'User must be authenticated to perform this action.');
    }

    try {
        const uid = request.auth.uid;
        // Validate incoming data structure (add more robust validation if needed)
        const { planId, isSubscription, successUrl, cancelUrl } = request.data as {
            planId: string;
            isSubscription: boolean;
            successUrl: string;
            cancelUrl: string;
        };

        if (!planId || typeof isSubscription === 'undefined' || !successUrl || !cancelUrl) {
             logger.error('Missing required parameters in callable request data');
             throw new HttpsError('invalid-argument', 'Missing required parameters.');
        }


        // Call the handler function
        const result = await createCheckoutHandler.createCheckoutSessionWithParams({
            uid,
            planId,
            isSubscription,
            successUrl,
            cancelUrl
        });

        return result; // Return data directly

    } catch (error: any) {
        logger.error('Error in callable createCheckoutSession:', error);
        // Throwing an HttpsError automatically sets the right status code for the client
        throw new HttpsError('internal', error.message || 'An unknown server error occurred.');
    }
});

// Callable function for getting user key (v2 syntax)
export const getUserKey = onCall({ region: "us-central1" /* Optional: Specify region */ }, async (request) => {
    logger.info('Callable getUserKey called', { auth: request.auth });

    // Ensure user is authenticated (v2 style)
    if (!request.auth) {
         logger.warn('User not authenticated for callable function.');
         throw new HttpsError('unauthenticated', 'User must be authenticated to perform this action.');
    }

    try {
        const uid = request.auth.uid;

        // Call the handler function
        const result = await getUserKeyHandler.getUserKeyCallable(uid);

        return result; // Return data directly

    } catch (error: any) {
        logger.error('Error in callable getUserKey:', error);
         // Check for specific errors to provide better client feedback
         if (error.message?.includes('API key not found')) {
              throw new HttpsError('not-found', error.message);
         } else {
              throw new HttpsError('internal', error.message || 'An unknown server error occurred.');
         }
    }
});