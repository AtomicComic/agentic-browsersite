import { functions } from './firebase-config';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

// Type definitions for function responses
interface CheckoutSessionResponse {
  url: string;
}

interface UserKeyResponse {
  apiKey: string;
}

/**
 * Creates a Stripe checkout session for purchasing credits or subscriptions
 * 
 * @param planId - The ID of the plan to purchase
 * @param isSubscription - Whether this is a subscription or one-time purchase
 * @param successUrl - URL to redirect to on successful payment
 * @param cancelUrl - URL to redirect to if payment is canceled
 * @returns Promise with checkout session URL
 */
export async function createCheckoutSession(
  planId: string,
  isSubscription: boolean,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    // Create a callable function reference
    const createCheckoutSessionCallable = httpsCallable<
      {
        planId: string;
        isSubscription: boolean;
        successUrl: string;
        cancelUrl: string;
      },
      CheckoutSessionResponse
    >(functions, 'createCheckoutSession');

    // Call the function with required parameters
    const result = await createCheckoutSessionCallable({
      planId,
      isSubscription,
      successUrl,
      cancelUrl,
    });

    // Return the checkout URL
    return result.data.url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Retrieves the user's OpenRouter API key
 * 
 * @returns Promise with the API key
 */
export async function getUserOpenRouterKey(): Promise<string> {
  try {
    // Create a callable function reference
    const getUserKeyCallable = httpsCallable<null, UserKeyResponse>(
      functions,
      'getUserKey'
    );

    // Call the function (no parameters needed)
    const result = await getUserKeyCallable();

    // Return the API key
    return result.data.apiKey;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    throw error;
  }
}
