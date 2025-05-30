import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { logger } from 'firebase-functions';
import { Request, WebhookRequest, WebhookResponse } from '../types';

// With Secret Manager, we'll initialize Stripe inside the function
let stripe: Stripe | null = null;

// Raw body middleware for Stripe webhooks
export const rawBodyMiddleware = (req: Request, res: WebhookResponse, next: () => void) => {
  const chunks: Buffer[] = [];

  req.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    (req as any).rawBody = Buffer.concat(chunks).toString('utf8');
    next();
  });
};

// Credits allocated to OpenRouter (actual limit)
const OPENROUTER_CREDITS: Record<string, number> = {
  // Subscription plans
  'monthly-basic': 1.0,        // 1000 credits = $1.00
  'monthly-pro': 2.0,          // 2000 credits = $2.00
  'monthly-enterprise': 3.0,   // 3000 credits = $3.00
  // One-time credit purchases
  'credits-1500': 1.5,         // 1500 credits = $1.50
  'credits-6000': 6.0,         // 6000 credits = $6.00
  'credits-15000': 15.0,       // 15000 credits = $15.00
};

// Type-safe error handling helper
function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// Interface for OpenRouter API responses
interface OpenRouterKeyResponse {
  data: {
    hash: string;
    name: string;
    label: string;
    disabled: boolean;
    limit: number;
    usage: number;
    created_at: string;
    updated_at: string | null;
  };
  key: string;
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
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data() || {};

    // Get purchased credits from Firestore
    const oneTimePurchasedCredits = userData.oneTime?.openRouterCredits || 0;
    const subscriptionCredits = userData.subscription?.openRouterCredits || 0;

    let currentUsage = 0;
    let currentLimit = 0;
    let remainingOneTimeCredits = 0;

    // If user has an existing key, get current usage and limit from OpenRouter
    if (userData.openRouterKeyHash) {
      try {
        const response = await fetchWithTimeout(
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

        if (response.ok) {
          const keyData = await response.json() as OpenRouterKeyResponse;
          currentUsage = keyData.data.usage || 0;
          currentLimit = keyData.data.limit || 0;

          // Calculate remaining one-time credits
          // If current limit > current usage, the difference is the remaining credits
          // We need to account for subscription credits in this calculation
          const totalRemainingCredits = Math.max(0, currentLimit - currentUsage);

          // If user has an active subscription, some of those remaining credits might be subscription credits
          if (userData.subscription?.status === 'active' && subscriptionCredits > 0) {
            // Remaining one-time credits = total remaining - subscription credits (but not less than 0)
            remainingOneTimeCredits = Math.max(0, totalRemainingCredits - subscriptionCredits);
          } else {
            // If no active subscription, all remaining credits are one-time credits
            remainingOneTimeCredits = totalRemainingCredits;
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch existing key info, proceeding with creation', { error });
      }
    } else {
      // For new users with no key yet, remaining credits = purchased credits
      remainingOneTimeCredits = oneTimePurchasedCredits;
    }

    // Calculate new limit based on the type of credits being added
    // For subscriptions: reset subscription credits to the new amount
    // For one-time: add to existing one-time credits
    // Total limit = usage + remaining one-time credits + subscription credits
    const newLimit = isSubscription
      ? currentUsage + remainingOneTimeCredits + addCredits // Reset subscription credits
      : currentUsage + remainingOneTimeCredits + addCredits; // Add to one-time credits

    // Prepare update data for Firestore
    const updateData: Record<string, any> = {};

    if (userData.openRouterKeyHash) {
      // Update existing key
      const response = await fetchWithTimeout(
        `https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${PROVISIONING_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ limit: newLimit }),
        },
        10000
      );

      if (!response.ok) {
        throw new Error(`Failed to update OpenRouter key: ${response.statusText}`);
      }

      // Update credits in Firestore based on type
      if (isSubscription) {
        // For subscription: update subscription credits
        updateData['subscription.openRouterCredits'] = addCredits;
        updateData['subscription.userCredits'] = Math.floor(addCredits * 1000);
      } else {
        // For one-time: update one-time credits
        if (userData.oneTime?.openRouterCredits !== undefined) {
          // User already has credits in new format
          updateData['oneTime.openRouterCredits'] = oneTimePurchasedCredits + addCredits;
          updateData['oneTime.userCredits'] = Math.floor((oneTimePurchasedCredits + addCredits) * 1000);
        } else {
          // First time purchase
          updateData['oneTime.openRouterCredits'] = addCredits;
          updateData['oneTime.userCredits'] = Math.floor(addCredits * 1000);
        }
      }

      await userRef.update(updateData);
      return userData.openRouterKeyHash;
    } else {
      // Create new key
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
        10000
      );

      if (!response.ok) {
        throw new Error(`Failed to create OpenRouter key: ${response.statusText}`);
      }

      const data = await response.json() as OpenRouterKeyResponse;

      console.log('OpenRouter key data:', data);

      if (!data.data.hash || !data.key) {
        throw new Error('Invalid response from OpenRouter API');
      }

      // Create new key update object
      const keyUpdateData: Record<string, any> = {
        openRouterKeyHash: data.data.hash,
        openRouterKey: data.key,
      };

      // Update credits based on type
      if (isSubscription) {
        keyUpdateData.subscription = {
          ...userData.subscription,
          openRouterCredits: addCredits,
          userCredits: Math.floor(addCredits * 1000),
        };
      } else {
        // Update one-time credits
        if (userData.oneTime?.openRouterCredits !== undefined) {
          // User already has credits
          keyUpdateData.oneTime = {
            openRouterCredits: oneTimePurchasedCredits + addCredits,
            userCredits: Math.floor((oneTimePurchasedCredits + addCredits) * 1000),
          };
        } else {
          // First time purchase
          keyUpdateData.oneTime = {
            openRouterCredits: addCredits,
            userCredits: Math.floor(addCredits * 1000),
          };
        }
      }

      await userRef.update(keyUpdateData);
      return data.data.hash;
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
 * Extract subscription period end date from Stripe subscription data
 */
function getSubscriptionEndDate(subscription: Stripe.Subscription): number {
  // For subscription objects, the current_period_end is in the items data
  if (subscription.items &&
      subscription.items.data &&
      subscription.items.data.length > 0) {

    // Access the first subscription item
    const item = subscription.items.data[0] as any;

    // Check if current_period_end exists in the item
    if (item.current_period_end) {
      // Convert UNIX timestamp (seconds) to JavaScript timestamp (milliseconds)
      return item.current_period_end * 1000;
    }
  }

  // If we can't find it in the expected location, log a warning and use a fallback
  logger.warn('Could not find current_period_end in subscription items, using fallback', {
    subscriptionId: subscription.id
  });

  // Fallback: Use created date + 30 days (for monthly subscriptions)
  return (subscription.created * 1000) + (30 * 24 * 60 * 60 * 1000);
}

// Modified handleStripeWebhook function in stripeWebhook.js
export async function handleStripeWebhook(req: WebhookRequest, res: WebhookResponse) {
  // Get the signature from headers
  const signature = req.headers['stripe-signature'];

  // Get the webhook secret
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // For raw body access in Firebase Functions v2, use the raw request
  // The body as a string (or as a Buffer if available)
  let rawBody;

  // First try to access req.rawBody (Firebase Functions v2 with express-like interface)
  if (req.rawBody) {
    rawBody = req.rawBody;
  }
  // If not available, try req.body (might be already parsed)
  else if (req.body) {
    // Check if it's a Buffer
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
    }
    // If it's a string, use it directly
    else if (typeof req.body === 'string') {
      rawBody = req.body;
    }
    // If it's been parsed as JSON, stringify it back
    else if (typeof req.body === 'object') {
      // Last resort - re-serialize to JSON, might not match original formatting
      rawBody = JSON.stringify(req.body);
    }
  }

  // Add detailed debug logging
  logger.info('📝 Webhook parameters:', {
    hasSignature: !!signature,
    hasWebhookSecret: !!webhookSecret,
    hasBody: !!rawBody,
    bodyLength: rawBody ? (typeof rawBody === 'string' ? rawBody.length : rawBody.byteLength) : 0,
    bodyPreview: rawBody ? (typeof rawBody === 'string' ?
      rawBody.substring(0, 100) :
      rawBody.toString('utf8').substring(0, 100)) : 'N/A'
  });

  // Detailed logging for debugging
  if (signature) {
    console.log('Signature:', signature);
  }

  if (webhookSecret) {
    console.log('Webhook Secret prefix:', webhookSecret.substring(0, 4));
  }

  if (rawBody) {
    console.log('Body length:', typeof rawBody === 'string' ?
      rawBody.length : rawBody.byteLength);
  }

  // Validate required parameters
  if (!signature || !webhookSecret || !rawBody) {
    logger.error('Missing required webhook parameters', {
      hasSignature: !!signature,
      hasSecret: !!webhookSecret,
      hasRawBody: !!rawBody
    });
    res.status(400).json({ error: 'Missing required webhook parameters' });
    return;
  }

  // Initialize Stripe if not already initialized
  if (!stripe) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      logger.error('Stripe API key missing in webhook handler');
      res.status(500).json({ error: 'Stripe API key is not configured.' });
      return;
    }

    logger.info('🔑 Initializing Stripe:', {
      hasStripeKey: !!stripeKey,
      keyPrefix: stripeKey.substring(0, 4)
    });

    stripe = new Stripe(stripeKey, {
      apiVersion: '2025-03-31.basil',
    });

    console.log('✅ Stripe initialized successfully');
  }

  try {
    console.log('🔍 Constructing Stripe event...');

    // Use the raw body with Stripe's webhook verification
    const event = stripe.webhooks.constructEvent(
      // Ensure rawBody is passed as either a string or Buffer
      typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'),
      signature,      // signature from Stripe-Signature header
      webhookSecret   // webhook secret starting with whsec_
    );

    // Log successful verification
    logger.info('✅ Webhook signature verified successfully:', {
      eventType: event.type,
      eventId: event.id,
      eventCreated: new Date(event.created * 1000).toISOString()
    });

    try {
      // Handle the verified event
      switch (event.type) {
        case 'checkout.session.completed': {
          console.log('💳 Processing checkout.session.completed');
          const session = event.data.object as Stripe.Checkout.Session;
          const { firebaseUID, planId, isSubscription } = session.metadata || {};

          console.log('📦 Session metadata:', {
            firebaseUID,
            planId,
            isSubscription,
            sessionId: session.id
          });

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

        case 'customer.subscription.updated': {
          console.log('⚠️ Processing subscription update event:', event.type);
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          // Access raw subscription data to get properties not in the TypeScript type
          const rawSubscription = subscription as unknown as {
            id: string;
            customer: string;
            status: string;
            cancel_at_period_end: boolean;
            current_period_end: number;
          };

          console.log('📄 Subscription update details:', {
            subscriptionId: rawSubscription.id,
            customerId: rawSubscription.customer,
            status: rawSubscription.status,
            cancelAtPeriodEnd: rawSubscription.cancel_at_period_end,
            currentPeriodEnd: rawSubscription.current_period_end
          });

          // If the subscription is marked to cancel at period end, update the status
          if (rawSubscription.cancel_at_period_end) {
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

            // Update user subscription status to 'canceled' but keep credits until period end
            await admin.firestore().collection('users').doc(uid).update({
              'subscription.status': 'canceled', // New status to indicate canceled but not expired
              'subscription.expiresAt': rawSubscription.current_period_end * 1000, // Store the exact expiration time
            });

            logger.info('Subscription marked as canceled but credits retained until period end', {
              uid,
              expiresAt: new Date(rawSubscription.current_period_end * 1000).toISOString()
            });
          }

          break;
        }

        case 'invoice.paid': {
          console.log('💰 Processing invoice.paid');
          const invoice = event.data.object as Stripe.Invoice;
          console.log('🧾 Invoice details:', {
            invoiceId: invoice.id,
            customerId: invoice.customer,
            subscriptionId: (invoice as unknown as { subscription?: string }).subscription
          });

          // Extract subscription ID from the invoice
          // Based on the payload, we know exactly where to find it
          let subscriptionId: string | undefined;

          // Check in parent.subscription_details
          const invoiceWithParent = invoice as any;
          if (invoiceWithParent.parent &&
              typeof invoiceWithParent.parent === 'object' &&
              invoiceWithParent.parent.type === 'subscription_details' &&
              invoiceWithParent.parent.subscription_details?.subscription) {
            subscriptionId = invoiceWithParent.parent.subscription_details.subscription as string;
            logger.info('Found subscription ID in parent.subscription_details', { subscriptionId });
          }

          // If not found, check in lines.data[0].parent.subscription_item_details
          if (!subscriptionId &&
              invoice.lines &&
              invoice.lines.data &&
              invoice.lines.data.length > 0) {
            const line = invoice.lines.data[0] as any;
            if (line.parent &&
                typeof line.parent === 'object' &&
                line.parent.type === 'subscription_item_details' &&
                line.parent.subscription_item_details?.subscription) {
              subscriptionId = line.parent.subscription_item_details.subscription as string;
              logger.info('Found subscription ID in lines.data[0].parent.subscription_item_details', { subscriptionId });
            }
          }

          // If there's no subscription ID, we'll just acknowledge the webhook
          if (!subscriptionId) {
            logger.warn('Could not find subscription ID in invoice', { invoiceId: invoice.id });

            // Instead of failing, we'll just acknowledge the webhook
            // This prevents Stripe from retrying the webhook and filling up our logs
            res.status(200).json({ received: true, warning: 'No subscription ID found' });
            return;
          }

          try {
            // Retrieve subscription details safely
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            // Log the subscription details to help with debugging
            // Use type assertion to access properties that might not be in the TypeScript type
            const rawSubscription = subscription as unknown as {
              id: string;
              status: string;
              current_period_end?: number;
            };

            logger.info('Retrieved subscription details', {
              subscriptionId,
              status: rawSubscription.status,
              currentPeriodEnd: rawSubscription.current_period_end
            });

            // Safely extract expiration date with better error handling
            let expiresAt: number;
            try {
              expiresAt = getSubscriptionEndDate(subscription);
            } catch (error) {
              // If we can't get the expiration date from the helper function,
              // try to get it directly from the subscription object
              // Use the rawSubscription object we created above
              if (rawSubscription.current_period_end) {
                expiresAt = rawSubscription.current_period_end * 1000; // Convert to milliseconds
                logger.info('Using current_period_end directly', { expiresAt });
              } else {
                // If we still can't get it, use a default value (30 days from now)
                expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
                logger.warn('Using default expiration date (30 days from now)', { expiresAt });
              }
            }

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
          console.log('⚠️ Processing subscription deletion event:', event.type);
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          console.log('📄 Subscription deletion details:', {
            subscriptionId: subscription.id,
            customerId: subscription.customer,
            status: subscription.status
          });

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
          const userData = userDoc.data();

          // Subscription period has ended, so mark as inactive and remove credits
          console.log('Subscription period ended, removing credits');

          // Update user subscription status and reset subscription credits
          await admin.firestore().collection('users').doc(uid).update({
            'subscription.status': 'inactive',
            'subscription.openRouterCredits': 0, // Expire subscription credits
            'subscription.userCredits': 0,
          });

          // Handle OpenRouter key adjustment
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
              const currentUsage = keyData.data.usage || 0;
              const currentLimit = keyData.data.limit || 0;

              // Calculate remaining one-time credits
              // If current limit > current usage, the difference is the remaining credits
              // Since subscription is now inactive, we need to remove subscription credits from the calculation
              const totalRemainingCredits = Math.max(0, currentLimit - currentUsage);

              // The subscription credits that were previously active are now expired
              const previousSubscriptionCredits = userData.subscription?.openRouterCredits || 0;

              // Calculate remaining one-time credits by subtracting expired subscription credits
              // but not less than 0 (in case user used more than their subscription credits)
              const remainingOneTimeCredits = Math.max(0, totalRemainingCredits - previousSubscriptionCredits);

              // Set limit to usage + remaining one-time credits only (subscription credits expired)
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
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              logger.error('Error updating OpenRouter key limits', { error: errorMessage, uid });
              // Continue execution - this is a non-critical error
            }
          }

          break;
        }
      }

      console.log('✨ Webhook processed successfully');
      res.status(200).json({ received: true });
      return;
    } catch (innerError) {
      console.error('❌ Error processing webhook event:', {
        error: innerError instanceof Error ? innerError.message : 'Unknown error',
        stack: innerError instanceof Error ? innerError.stack : undefined
      });
      res.status(400).json({ error: 'Error processing webhook event' });
      return;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Webhook error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
    logger.error('Error handling webhook', { error: errorMessage });
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}










