import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { logger } from 'firebase-functions';

// With Secret Manager, we'll initialize Stripe inside the function
// rather than at the module level to ensure secrets are available
let stripe: Stripe | null = null;

// Credits associated with each plan (visible to users)
const PLAN_CREDITS: Record<string, number> = {
  'monthly-basic': 1000,
  'monthly-pro': 2000,
  'monthly-enterprise': 3000,
  'credits-1500': 1500,
  'credits-6000': 6000,
  'credits-15000': 15000,
};

// Credits allocated to OpenRouter (actual limit)
const OPENROUTER_CREDITS: Record<string, number> = {
  'monthly-basic': 300,       // 1000 / 3.33
  'monthly-pro': 600,         // 2000 / 3.33
  'monthly-enterprise': 900,  // 3000 / 3.33
  'credits-1500': 450,        // 1500 / 3.33
  'credits-6000': 1800,       // 6000 / 3.33
  'credits-15000': 4500,      // 15000 / 3.33
};

// Type-safe error handling helper
function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// Interface for OpenRouter API responses
interface OpenRouterKeyResponse {
  hash: string;
  key: string;
  usage?: number;
  limit?: number;
}

// Enhanced fetch with timeout
async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeout = 10000
): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Function to provision or update an OpenRouter API key
async function provisionOpenRouterKey(uid: string, addCredits: number, isSubscription: boolean) {
  const PROVISIONING_API_KEY = process.env.OPENROUTER_PROVISIONING_KEY;

  if (!PROVISIONING_API_KEY) {
    throw new Error('OpenRouter provisioning key is not configured');
  }

  try {
    // Get user data to check if they already have a key
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};

    // Check current key usage
    let currentUsage = 0;
    let currentLimit = 0;

    if (userData.openRouterKeyHash) {
      // Get current usage from OpenRouter with timeout
      const response = await fetchWithTimeout(
        `https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${PROVISIONING_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
        10000 // 10s timeout
      );

      if (!response.ok) {
        throw new Error(`Failed to get OpenRouter key info: ${response.statusText}`);
      }

      const keyData = await response.json() as OpenRouterKeyResponse;
      currentUsage = keyData.usage || 0;
      currentLimit = keyData.limit || 0;
    }

    let newLimit: number;

    if (isSubscription) {
      // For subscriptions, we set the limit to usage + addCredits
      newLimit = currentUsage + addCredits;
    } else {
      // For one-time purchases, we add to the limit
      newLimit = currentLimit + addCredits;
    }

    if (userData.openRouterKeyHash) {
      // Update existing key with timeout
      const response = await fetchWithTimeout(
        `https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${PROVISIONING_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            limit: newLimit,
          }),
        },
        10000 // 10s timeout
      );

      if (!response.ok) {
        throw new Error(`Failed to update OpenRouter key: ${response.statusText}`);
      }

      // Update the user's credits in Firestore
      const updateData = isSubscription
        ? {
            'subscription.openRouterCredits': addCredits,
            'subscription.userCredits': PLAN_CREDITS[userData.subscription?.planId || ''] || addCredits * 3.33,
          }
        : {
            credits: (userData.credits || 0) + (addCredits * 3.33),
            openRouterCredits: (userData.openRouterCredits || 0) + addCredits,
          };

      await userRef.update(updateData);

      return userData.openRouterKeyHash;
    } else {
      // Create a new key
      const response = await fetchWithTimeout(
        'https://openrouter.ai/api/v1/keys',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PROVISIONING_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Customer Instance Key',
            label: `customer-${uid}`,
            limit: newLimit,
          }),
        },
        10000 // 10s timeout
      );

      if (!response.ok) {
        throw new Error(`Failed to create OpenRouter key: ${response.statusText}`);
      }

      const data = await response.json() as OpenRouterKeyResponse;

      // Update the user with the new key information
      const updateData: Record<string, unknown> = {
        openRouterKeyHash: data.hash,
        openRouterKey: data.key, // Consider implementing encryption for this value
      };

      if (isSubscription) {
        updateData['subscription.openRouterCredits'] = addCredits;
        updateData['subscription.userCredits'] = addCredits * 3.33;
      } else {
        updateData.credits = addCredits * 3.33;
        updateData.openRouterCredits = addCredits;
      }

      await userRef.update(updateData);

      return data.hash;
    }
  } catch (error: unknown) {
    const errorInfo = isErrorWithMessage(error) 
      ? { message: error.message } 
      : { message: 'Unknown error' };

    logger.error('OpenRouter provisioning failed', {
      uid,
      error: errorInfo,
      addCredits,
      isSubscription
    });
    
    throw error;
  }
}

/**
 * Extract subscription period end date safely from Stripe subscription data
 */
function getSubscriptionEndDate(subscription: Stripe.Subscription): number {
  // Access the raw response data which includes metadata like current_period_end
  const rawData = subscription as unknown as { current_period_end: number };
  
  if (!('current_period_end' in rawData)) {
    throw new Error('Missing current_period_end in subscription data');
  }
  
  // Convert UNIX timestamp (seconds) to JavaScript timestamp (milliseconds)
  return rawData.current_period_end * 1000;
}

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // Initialize Stripe if not already initialized
  if (!stripe) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      logger.error('Stripe API key missing in webhook handler');
      res.status(500).json({ error: 'Stripe API key is not configured.' });
      return;
    }
    stripe = new Stripe(stripeKey, {
      apiVersion: '2025-03-31.basil',
    });
  }

  if (!webhookSecret) {
    logger.error('Stripe webhook secret missing');
    res.status(500).json({ error: 'Stripe webhook secret is not configured' });
    return;
  }

  try {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('Webhook signature verification failed', { error: errorMessage });
      res.status(400).json({ error: `Webhook Error: ${errorMessage}` });
      return;
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { firebaseUID, planId, isSubscription } = session.metadata || {};

        if (!firebaseUID || !planId) {
          logger.error('Missing metadata in checkout session', { metadata: session.metadata });
          res.status(400).json({ error: 'Missing required metadata' });
          return;
        }

        // Get user reference
        const userRef = admin.firestore().collection('users').doc(firebaseUID);

        if (isSubscription === 'true') {
          // Handle subscription purchase
          if (!session.subscription) {
            logger.error('Missing subscription ID in checkout session', { sessionId: session.id });
            res.status(400).json({ error: 'Missing subscription ID' });
            return;
          }

          const subscriptionId = session.subscription as string;
          
          // Retrieve the subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          try {
            // Extract expiration date safely
            const expiresAt = getSubscriptionEndDate(subscription);
            
            // Update user subscription data
            await userRef.update({
              'subscription.status': 'active',
              'subscription.planId': planId,
              'subscription.plan': planId.startsWith('monthly') ? 'monthly' : 'yearly',
              'subscription.expiresAt': expiresAt,
              'subscription.stripeSubscriptionId': subscriptionId,
            });

            // Provision or update OpenRouter key with appropriate credits
            await provisionOpenRouterKey(
              firebaseUID,
              OPENROUTER_CREDITS[planId] || 0,
              true
            );
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error processing subscription data', { 
              error: errorMessage, 
              subscriptionId 
            });
            res.status(500).json({ error: 'Failed to process subscription data' });
            return;
          }
        } else {
          // Handle one-time purchase
          // Provision or update OpenRouter key with new total credits
          await provisionOpenRouterKey(
            firebaseUID,
            OPENROUTER_CREDITS[planId] || 0,
            false
          );
        }

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // In Stripe's API, invoice.subscription might be string ID or undefined
        // Access it through type assertion and runtime check
        const rawInvoice = invoice as unknown as { subscription?: string };
        const subscriptionId = rawInvoice.subscription;
        
        if (!subscriptionId) {
          logger.error('Missing subscription ID in invoice', { invoiceId: invoice.id });
          res.status(400).json({ error: 'Missing subscription ID' });
          return;
        }

        try {
          // Retrieve subscription details safely
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Safely extract expiration date
          const expiresAt = getSubscriptionEndDate(subscription);
          
          const customerId = invoice.customer as string;

          // Find user by Stripe customer ID
          const usersSnapshot = await admin.firestore().collection('users')
            .where('stripeCustomerId', '==', customerId)
            .limit(1)
            .get();

          if (usersSnapshot.empty) {
            logger.error('User not found for customer ID', { customerId });
            res.status(404).json({ error: 'User not found' });
            return;
          }

          const userDoc = usersSnapshot.docs[0];
          const uid = userDoc.id;
          const userData = userDoc.data();

          // Get the plan ID from subscription metadata or items
          const planId = userData.subscription?.planId;

          if (planId && OPENROUTER_CREDITS[planId]) {
            // Update user subscription data
            await admin.firestore().collection('users').doc(uid).update({
              'subscription.status': 'active',
              'subscription.expiresAt': expiresAt,
            });

            // Reset credits to the plan amount for the new billing cycle
            await provisionOpenRouterKey(uid, OPENROUTER_CREDITS[planId], true);
          } else {
            logger.error('Invalid plan ID in subscription', { planId, uid });
            res.status(400).json({ error: 'Invalid plan ID' });
            return;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Error processing invoice data', { 
            error: errorMessage, 
            invoiceId: invoice.id 
          });
          res.status(500).json({ error: 'Failed to process invoice data' });
          return;
        }

        break;
      }

      case 'invoice.payment_failed':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const usersSnapshot = await admin.firestore().collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          logger.error('User not found for customer ID', { customerId, event: event.type });
          res.status(404).json({ error: 'User not found' });
          return;
        }

        const userDoc = usersSnapshot.docs[0];
        const uid = userDoc.id;

        // Update user subscription status
        await admin.firestore().collection('users').doc(uid).update({
          'subscription.status': 'inactive',
        });

        // Handle OpenRouter key adjustment
        const userData = userDoc.data();
        if (userData.openRouterKeyHash) {
          const PROVISIONING_API_KEY = process.env.OPENROUTER_PROVISIONING_KEY;

          if (!PROVISIONING_API_KEY) {
            logger.error('OpenRouter provisioning key missing');
            res.status(500).json({ error: 'OpenRouter provisioning key is not configured' });
            return;
          }

          try {
            // Get current usage from OpenRouter
            const keyResponse = await fetchWithTimeout(
              `https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${PROVISIONING_API_KEY}`,
                  'Content-Type': 'application/json',
                },
              },
              10000
            );

            if (!keyResponse.ok) {
              throw new Error(`Failed to get OpenRouter key info: ${keyResponse.statusText}`);
            }

            const keyData = await keyResponse.json() as OpenRouterKeyResponse;
            const currentUsage = keyData.usage || 0;

            // If one-time credits remain, set limit to usage + remaining one-time credits
            const remainingOneTimeCredits = userData.openRouterCredits || 0;

            if (remainingOneTimeCredits > 0) {
              // Update key with new limit based only on one-time credits
              await fetchWithTimeout(
                `https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`,
                {
                  method: 'PATCH',
                  headers: {
                    Authorization: `Bearer ${PROVISIONING_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    limit: currentUsage + remainingOneTimeCredits,
                  }),
                },
                10000
              );
            } else {
              // If no one-time credits, just set the limit to current usage
              await fetchWithTimeout(
                `https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`,
                {
                  method: 'PATCH',
                  headers: {
                    Authorization: `Bearer ${PROVISIONING_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    limit: currentUsage,
                  }),
                },
                10000
              );
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            logger.error('Error updating OpenRouter key limits', { error: errorMessage, uid });
            // Continue execution - this is a non-critical error
          }
        }

        break;
      }
    }

    res.status(200).json({ received: true });
    return;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error handling webhook', { error: errorMessage });
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}
