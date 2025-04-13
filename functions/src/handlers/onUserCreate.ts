import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import fetch from 'node-fetch';

// Interface for OpenRouter key response
interface OpenRouterKeyResponse {
  key: string;
  data: {
    hash: string;
    name: string;
    label: string;
    limit: number;
    usage: number;
    created_at: string;
    updated_at: string;
  };
}

// Enhanced fetch with timeout
async function fetchWithTimeout(url: string, options: any, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Function to provision a new OpenRouter API key for a newly created user
 * This gives them 10 cents worth of credits to start with
 */
export async function provisionNewUserApiKey(user: admin.auth.UserRecord): Promise<void> {
  const PROVISIONING_API_KEY = process.env.OPENROUTER_PROVISIONING_KEY;
  const uid = user.uid;

  if (!PROVISIONING_API_KEY) {
    throw new Error('OpenRouter provisioning key is not configured');
  }

  try {
    logger.info('Provisioning new API key for user', { uid });
    
    // Reference to the user document
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    // If user document doesn't exist, create it
    if (!userDoc.exists) {
      await userRef.set({
        uid: uid,
        email: user.email,
        credits: 0,
        subscription: {
          status: 'inactive',
          plan: null,
          expiresAt: null
        }
      });
    }
    
    // Check if user already has an API key
    const userData = userDoc.exists ? userDoc.data() : null;
    if (userData?.openRouterKey) {
      logger.info('User already has an API key, skipping provisioning', { uid });
      return;
    }
    
    // Set the initial credit limit (10 cents = 0.10 USD)
    const initialCreditLimit = 0.10;
    
    // Create a new OpenRouter API key
    const response = await fetchWithTimeout(
      'https://openrouter.ai/api/v1/keys',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PROVISIONING_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New User Key',
          label: `new-user-${uid}`,
          limit: initialCreditLimit,
        }),
      },
      10000
    );

    if (!response.ok) {
      throw new Error(`Failed to create OpenRouter key: ${response.statusText}`);
    }

    const data = await response.json() as OpenRouterKeyResponse;

    logger.info('OpenRouter key created successfully', { 
      uid, 
      keyHash: data.data.hash,
      limit: initialCreditLimit
    });

    if (!data.data.hash || !data.key) {
      throw new Error('Invalid response from OpenRouter API');
    }

    // Update the user document with the new API key
    await userRef.update({
      openRouterKeyHash: data.data.hash,
      openRouterKey: data.key,
      oneTime: {
        openRouterCredits: initialCreditLimit,
        openRouterCreditsRemaining: initialCreditLimit
      }
    });

    logger.info('User document updated with new API key', { uid });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error provisioning API key for new user', { 
      error: errorMessage, 
      uid 
    });
    throw error;
  }
}
