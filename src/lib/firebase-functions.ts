import { functions } from './firebase-config';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

// Type definitions for function responses
interface CheckoutSessionResponse {
  url: string;
}

interface UserKeyResponse {
  apiKey: string;
  credits?: OpenRouterCreditInfo;
}

interface ProvisionKeyResponse {
  success: boolean;
}

/**
 * Interface for OpenRouter credit information
 */
export interface OpenRouterCreditInfo {
  credits: {
    used: number;
    limit: number;
    remaining: number | null;
  };
  isFreeTier: boolean;
  rateLimit: number | null;
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
 * Retrieves the user's OpenRouter API key and credit information
 *
 * @returns Promise with the API key and credit information
 */
export async function getUserOpenRouterKey(): Promise<{ apiKey: string; credits?: OpenRouterCreditInfo }> {
  try {
    // Create a callable function reference
    const getUserKeyCallable = httpsCallable<null, UserKeyResponse>(
      functions,
      'getUserKey'
    );

    // Call the function (no parameters needed)
    const result = await getUserKeyCallable();

    // Return the API key and credits
    return {
      apiKey: result.data.apiKey,
      credits: result.data.credits
    };
  } catch (error) {
    console.error('Error retrieving API key and credits:', error);
    throw error;
  }
}

/**
 * Provisions a new OpenRouter API key for the current user with 10 cents of credit
 *
 * @returns Promise with success status
 */
export async function provisionNewUserApiKey(): Promise<boolean> {
  try {
    console.log('Starting API key provisioning process');

    // Create a callable function reference
    const provisionKeyCallable = httpsCallable<null, ProvisionKeyResponse>(
      functions,
      'provisionNewUserKey'
    );

    console.log('Calling provisionNewUserKey function');
    // Call the function (no parameters needed)
    const result = await provisionKeyCallable();

    console.log('API key provisioning result:', result.data);
    // Return success status
    return result.data.success;
  } catch (error) {
    console.error('Error provisioning new API key:', error);
    // Don't throw, just return false to avoid breaking the registration flow
    return false;
  }
}

/**
 * Creates a Stripe customer portal session for managing subscriptions
 *
 * @param returnUrl - URL to redirect to after the customer portal session
 * @returns Promise with the customer portal URL
 */
export async function createCustomerPortalSession(returnUrl: string): Promise<string> {
  try {
    // Create a callable function reference
    const createPortalCallable = httpsCallable<
      { returnUrl: string },
      { url: string }
    >(functions, 'createCustomerPortal');

    // Call the function with the return URL
    const result = await createPortalCallable({ returnUrl });

    // Return the portal URL
    return result.data.url;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
}


