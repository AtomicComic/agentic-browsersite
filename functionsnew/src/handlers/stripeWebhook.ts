import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
});

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
      // Get current usage from OpenRouter
      const response = await fetch(`https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PROVISIONING_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get OpenRouter key info: ${response.statusText}`);
      }

      const keyData = await response.json();
      currentUsage = keyData.usage || 0;
      currentLimit = keyData.limit || 0;
    }

    let newLimit: number;

    if (isSubscription) {
      // For subscriptions, we set the limit to usage + addCredits
      newLimit = currentUsage + addCredits;
    } else {
      // For one-time purchases, we add to the limit
      // If there's no existing key, current limit will be 0
      newLimit = currentLimit + addCredits;
    }

    if (userData.openRouterKeyHash) {
      // Update existing key
      const response = await fetch(`https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${PROVISIONING_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: newLimit,
        }),
      });

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
      const response = await fetch('https://openrouter.ai/api/v1/keys', {
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
      });

      if (!response.ok) {
        throw new Error(`Failed to create OpenRouter key: ${response.statusText}`);
      }

      const data = await response.json();

      // Update the user with the new key information
      const updateData: any = {
        openRouterKeyHash: data.hash,
        openRouterKey: data.key, // In production, consider encrypting this
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
  } catch (error) {
    console.error('Error provisioning OpenRouter key:', error);
    throw error;
  }
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'Stripe webhook secret is not configured' });
  }

  try {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { firebaseUID, planId, isSubscription } = session.metadata || {};

        if (!firebaseUID || !planId) {
          return res.status(400).json({ error: 'Missing required metadata' });
        }

        // Get user reference
        const userRef = admin.firestore().collection('users').doc(firebaseUID);

        if (isSubscription === 'true') {
          // Handle subscription purchase
          if (!session.subscription) {
            return res.status(400).json({ error: 'Missing subscription ID' });
          }

          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Calculate expiration date (end of current period)
          const expiresAt = (subscription as any).current_period_end * 1000; // Convert to milliseconds

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

        if (!(invoice as any).subscription) {
          return res.status(400).json({ error: 'Missing subscription ID' });
        }

        const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
        const customerId = invoice.customer as string;

        // Find user by Stripe customer ID
        const usersSnapshot = await admin.firestore().collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          return res.status(404).json({ error: 'User not found' });
        }

        const userDoc = usersSnapshot.docs[0];
        const uid = userDoc.id;
        const userData = userDoc.data();

        // Get the plan ID from subscription metadata or items
        const planId = userData.subscription?.planId;

        if (planId && OPENROUTER_CREDITS[planId]) {
          // Calculate new expiration date
          const expiresAt = (subscription as any).current_period_end * 1000;

          // Update user subscription data
          await admin.firestore().collection('users').doc(uid).update({
            'subscription.status': 'active',
            'subscription.expiresAt': expiresAt,
          });

          // Reset credits to the plan amount for the new billing cycle
          await provisionOpenRouterKey(uid, OPENROUTER_CREDITS[planId], true);
        } else {
          return res.status(400).json({ error: 'Invalid plan ID' });
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
          return res.status(404).json({ error: 'User not found' });
        }

        const userDoc = usersSnapshot.docs[0];
        const uid = userDoc.id;

        // Update user subscription status
        await admin.firestore().collection('users').doc(uid).update({
          'subscription.status': 'inactive',
        });

        // Optionally disable the OpenRouter key or reduce limits
        const userData = userDoc.data();
        if (userData.openRouterKeyHash) {
          const PROVISIONING_API_KEY = process.env.OPENROUTER_PROVISIONING_KEY;

          if (!PROVISIONING_API_KEY) {
            return res.status(500).json({ error: 'OpenRouter provisioning key is not configured' });
          }

          // Get current usage from OpenRouter
          const keyResponse = await fetch(`https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${PROVISIONING_API_KEY}`,
              'Content-Type': 'application/json',
            },
          });

          if (!keyResponse.ok) {
            return res.status(500).json({ error: 'Failed to get OpenRouter key info' });
          }

          const keyData = await keyResponse.json();
          const currentUsage = keyData.usage || 0;

          // If one-time credits remain, set limit to usage + remaining one-time credits
          const remainingOneTimeCredits = userData.openRouterCredits || 0;

          if (remainingOneTimeCredits > 0) {
            // Update key with new limit based only on one-time credits
            await fetch(`https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${PROVISIONING_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                limit: currentUsage + remainingOneTimeCredits,
              }),
            });
          } else {
            // If no one-time credits, just set the limit to current usage
            // This effectively disables further usage without deleting the key
            await fetch(`https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${PROVISIONING_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                limit: currentUsage,
              }),
            });
          }
        }

        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: `Webhook Error: ${error.message}` });
  }
}
