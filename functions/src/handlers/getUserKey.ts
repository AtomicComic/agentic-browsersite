import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import fetch from 'node-fetch';

// Interface for OpenRouter credit information
interface OpenRouterCreditInfo {
  credits: {
    used: number;
    limit: number;
    remaining: number | null;
  };
  isFreeTier: boolean;
  rateLimit: any;
}

// Callable function to retrieve a user's key and credit information
export async function getUserKeyCallable(uid: string): Promise<{
  apiKey: string;
  credits?: OpenRouterCreditInfo;
}> {
  try {
    if (!uid) {
      throw new Error('User ID is required');
    }

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      logger.warn('User not found when requesting API key', { uid });
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    if (!userData?.openRouterKey) {
      logger.info('API key not found for user', { uid });
      throw new Error('API key not found. Purchase credits to receive your API key.');
    }

    const apiKey = userData.openRouterKey;

    // Check OpenRouter credits
    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        logger.warn('Failed to fetch OpenRouter credits', {
          uid,
          status: response.status,
          statusText: response.statusText
        });
        // Return just the API key if we can't get credits
        return { apiKey };
      }

      const data = await response.json();
      const creditInfo: OpenRouterCreditInfo = {
        credits: {
          used: data.data.usage,
          limit: data.data.limit,
          remaining: data.data.limit !== null ? data.data.limit - data.data.usage : null
        },
        isFreeTier: data.data.is_free_tier,
        rateLimit: data.data.rate_limit
      };

      return { apiKey, credits: creditInfo };
    } catch (creditError) {
      logger.error('Error checking OpenRouter credits', {
        error: creditError instanceof Error ? creditError.message : 'Unknown error',
        uid
      });
      // Return just the API key if we can't get credits
      return { apiKey };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error retrieving API key', { error: errorMessage, uid });
    throw error;
  }
}
