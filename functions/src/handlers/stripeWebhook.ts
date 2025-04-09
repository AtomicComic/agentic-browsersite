import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe for local dev if using emulator
let stripe: Stripe | null = null;
if (process.env.FUNCTIONS_EMULATOR === 'true' && process.env.STRIPE_SECRET_KEY) {
  console.log('Emulator mode - initializing Stripe for webhook');
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-03-31.basil',
  });
}

// Define plan credit mapping
const PLAN_CREDITS: Record<string, number> = {
  'monthly-basic': 1000,
  'monthly-pro': 2000,
  'monthly-enterprise': 3000,
  'credits-1500': 1500,
  'credits-6000': 6000,
  'credits-15000': 15000,
};

// Subset of credits for OpenRouter usage
const OPENROUTER_CREDITS: Record<string, number> = {
  'monthly-basic': 300,
  'monthly-pro': 600,
  'monthly-enterprise': 900,
  'credits-1500': 450,
  'credits-6000': 1800,
  'credits-15000': 4500,
};

// Provision or update the OpenRouter key
async function provisionOpenRouterKey(uid: string, addCredits: number, isSubscription: boolean) {
  const PROVISIONING_API_KEY = process.env.OPENROUTER_PROVISIONING_KEY;
  if (!PROVISIONING_API_KEY) {
    throw new Error('OpenRouter provisioning key is not configured');
  }

  try {
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};

    // Current usage/limit
    let currentUsage = 0;
    let currentLimit = 0;
    if (userData.openRouterKeyHash) {
      const response = await fetch(`https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PROVISIONING_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch OpenRouter key info: ${response.statusText}`);
      }
      const keyData = await response.json();
      currentUsage = keyData.usage || 0;
      currentLimit = keyData.limit || 0;
    }

    // Determine new limit
    let newLimit: number;
    if (isSubscription) {
      // Set limit to (usage + added credits) to effectively "reset" each cycle
      newLimit = currentUsage + addCredits;
    } else {
      // For one-time, just add to existing limit
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
        body: JSON.stringify({ limit: newLimit }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update OpenRouter key: ${response.statusText}`);
      }

      // Update Firestore
      const updateData = isSubscription
        ? {
            'subscription.openRouterCredits': addCredits,
            'subscription.userCredits': PLAN_CREDITS[userData.subscription?.planId || ''] || addCredits * 3.33,
          }
        : {
            credits: (userData.credits || 0) + addCredits * 3.33,
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
          name: 'Customer Key',
          label: `customer-${uid}`,
          limit: newLimit,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create OpenRouter key: ${response.statusText}`);
      }
      const data = await response.json();

      // Update Firestore
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

// Main webhook handler
export async function handleStripeWebhook(req: any, res: any) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Initialize Stripe if not already
  if (!stripe) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ error: 'Stripe API key not configured' });
    }
    stripe = new Stripe(stripeKey, {
      apiVersion: '2025-03-31.basil',
    });
  }
  if (!webhookSecret) {
    return res.status(500).json({ error: 'Stripe webhook secret not configured' });
  }

  let event: Stripe.Event;
  try {
    // IMPORTANT: Use req.rawBody for Stripe signature verification
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { firebaseUID, planId, isSubscription } = session.metadata || {};
        if (!firebaseUID || !planId) {
          return res.status(400).json({ error: 'Missing required metadata' });
        }
        const userRef = admin.firestore().collection('users').doc(firebaseUID);

        if (isSubscription === 'true') {
          // Subscription flow
          if (!session.subscription) {
            return res.status(400).json({ error: 'Missing subscription ID' });
          }
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const expiresAt = (subscription as any).current_period_end * 1000;
          await userRef.update({
            'subscription.status': 'active',
            'subscription.planId': planId,
            'subscription.plan': planId.startsWith('monthly') ? 'monthly' : 'yearly',
            'subscription.expiresAt': expiresAt,
            'subscription.stripeSubscriptionId': subscriptionId,
          });
          await provisionOpenRouterKey(firebaseUID, OPENROUTER_CREDITS[planId] || 0, true);
        } else {
          // One-time flow
          await provisionOpenRouterKey(firebaseUID, OPENROUTER_CREDITS[planId] || 0, false);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!(invoice as any).subscription) {
          return res.status(400).json({ error: 'No subscription ID' });
        }
        const subscriptionId = (invoice as any).subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = invoice.customer as string;

        // Find user by stripeCustomerId
        const usersSnapshot = await admin
          .firestore()
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();
        if (usersSnapshot.empty) {
          return res.status(404).json({ error: 'User not found' });
        }

        const userDoc = usersSnapshot.docs[0];
        const uid = userDoc.id;
        const userData = userDoc.data();

        const planId = userData.subscription?.planId;
        if (planId && OPENROUTER_CREDITS[planId]) {
          const expiresAt = (subscription as any).current_period_end * 1000;
          await userDoc.ref.update({
            'subscription.status': 'active',
            'subscription.expiresAt': expiresAt,
          });
          // Reset subscription credits
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

        // Find user by stripeCustomerId
        const usersSnapshot = await admin
          .firestore()
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();
        if (usersSnapshot.empty) {
          return res.status(404).json({ error: 'User not found' });
        }
        const userDoc = usersSnapshot.docs[0];
        await userDoc.ref.update({ 'subscription.status': 'inactive' });

        // Optionally reduce or disable OpenRouter key usage
        const userData = userDoc.data();
        if (userData.openRouterKeyHash) {
          const PROVISIONING_API_KEY = process.env.OPENROUTER_PROVISIONING_KEY;
          if (!PROVISIONING_API_KEY) {
            return res.status(500).json({ error: 'No OpenRouter provisioning key' });
          }
          const keyResp = await fetch(
            `https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${PROVISIONING_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (!keyResp.ok) {
            return res.status(500).json({ error: 'Failed to fetch key usage' });
          }
          const keyData = await keyResp.json();
          const currentUsage = keyData.usage || 0;
          const remainingOneTime = userData.openRouterCredits || 0;
          const newLimit = currentUsage + remainingOneTime;

          // Patch the key limit to reflect only one-time credits or just current usage if none
          await fetch(`https://openrouter.ai/api/v1/keys/${userData.openRouterKeyHash}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${PROVISIONING_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ limit: newLimit }),
          });
        }
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handling error:', error);
    return res.status(500).json({ error: `Webhook Error: ${error.message}` });
  }
}
