import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { config } from '../config'; // Primarily for Price IDs
import * as functions from 'firebase-functions'; // For logger

const logger = functions.logger;

// Price IDs from config
const PRICE_IDS = config.stripe.priceIds;

// Stripe instance will be initialized lazily within the function execution context
let stripe: Stripe | null = null;

// Helper function to get the Stripe instance, ensuring secrets are loaded
function getStripeInstance(): Stripe {
  if (!stripe) {
    const stripeKey = process.env.STRIPE_SECRET_KEY; // Accessed directly from runtime environment

    if (!stripeKey) {
      // This should theoretically not happen if secrets are configured correctly
      logger.error('CRITICAL ERROR: Stripe secret key is not available in environment variables. Ensure the function is deployed with the stripeSecretKey secret.');
      throw new functions.https.HttpsError('internal', 'Server configuration error [Stripe Key Missing]. Please contact support.');
    }

    // --- CAUTION ---
    // The Stripe API version '2025-03-31.basil' is highly unusual.
    // Standard versions are date-based (e.g., '2024-04-10').
    // VERIFY this version string is correct according to your specific Stripe integration or documentation.
    // Using an invalid version string WILL cause errors in production.
    // --- END CAUTION ---
    stripe = new Stripe(stripeKey, {
      apiVersion: '2025-03-31.basil', // <<< VERIFY THIS VERSION!
      typescript: true, // Enable TypeScript support if not already default
    });
    logger.info('Stripe instance initialized.');
  }
  return stripe;
}

/**
 * Creates a Stripe Checkout session for a given user and plan.
 * Designed to be called internally by HTTP or Callable function wrappers.
 */
export async function createCheckoutSessionLogic(params: {
  uid: string;
  planId: string;
  isSubscription: boolean;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  const { uid, planId, isSubscription, successUrl, cancelUrl } = params;

  logger.info('Initiating checkout session creation for user:', { uid, planId, isSubscription });

  try {
    const stripeInstance = getStripeInstance();

    // Validate plan ID exists in our configuration
    const priceId = PRICE_IDS[planId as keyof typeof PRICE_IDS];
    if (!priceId) {
      logger.warn('Invalid plan ID received:', { uid, planId });
      throw new functions.https.HttpsError('invalid-argument', `Invalid plan ID: ${planId}`);
    }

    // Get user data - specifically checking for an existing Stripe Customer ID
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();
    let stripeCustomerId = userDoc.data()?.stripeCustomerId;

    // If no Stripe Customer ID exists, create one
    if (!stripeCustomerId) {
      logger.info('Stripe customer ID not found for user, creating a new one.', { uid });
      const userRecord = await admin.auth().getUser(uid);
      const customer = await stripeInstance.customers.create({
        email: userRecord.email || undefined, // Use email if available
        metadata: {
          firebaseUID: uid, // Link Stripe customer to Firebase user
        },
      });
      stripeCustomerId = customer.id;
      logger.info('Created Stripe customer.', { uid, stripeCustomerId });

      // Store the new Stripe Customer ID in Firestore
      // Use merge: true to avoid overwriting other user fields
      await userRef.set({ stripeCustomerId }, { merge: true });
      logger.info('Stored Stripe customer ID in Firestore.', { uid });
    } else {
      logger.info('Found existing Stripe customer ID for user.', { uid, stripeCustomerId });
    }

    // Create the Stripe Checkout Session
    logger.info('Creating Stripe checkout session...', { uid, stripeCustomerId, planId, priceId, isSubscription });
    const session = await stripeInstance.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        firebaseUID: uid, // Pass Firebase UID for webhook identification
        planId: planId,
        isSubscription: String(isSubscription), // Store as string for consistency
      },
      // Add subscription metadata if it's a subscription
      ...(isSubscription && {
        subscription_data: {
            metadata: {
                firebaseUID: uid,
                planId: planId,
            }
        }
      })
    });

    logger.info('Stripe checkout session created successfully.', { uid, sessionId: session.id });

    if (!session.url) {
        logger.error('Stripe session created but URL is missing.', { uid, sessionId: session.id });
        throw new functions.https.HttpsError('internal', 'Checkout session created, but URL was not returned.');
    }

    return { url: session.url };

  } catch (error: any) {
    logger.error('Error creating checkout session:', {
        uid: uid,
        planId: planId,
        error: error.message,
        stack: error.stack,
        // Avoid logging potentially sensitive Stripe error details directly
        // stripeErrorCode: error.code, // Uncomment if needed for specific debugging
    });

    // Throw a generic error to the client
    if (error instanceof functions.https.HttpsError) {
        throw error; // Re-throw HttpsErrors directly
    } else {
        // Handle potential Stripe errors specifically if needed, otherwise throw generic internal error
        // Example: if (error.type === 'StripeCardError') { ... }
        throw new functions.https.HttpsError('internal', 'Failed to create checkout session. Please try again later.');
    }
  }
}