import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions'; // For logger and HttpsError

const logger = functions.logger;

/**
 * Retrieves the user's specific API key (e.g., OpenRouter key hash) from Firestore.
 * Designed to be called internally by a Callable function wrapper.
 * Assumes the key is stored under 'openRouterKeyHash'.
 */
export async function getUserKeyLogic(uid: string): Promise<{ apiKey: string }> {
  logger.info('Attempting to retrieve API key hash for user:', { uid });

  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();

    if (!userDoc.exists) {
      logger.warn('User document not found for API key retrieval.', { uid });
      // Use 'not-found' for clarity, client can handle this appropriately
      throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }

    const userData = userDoc.data();

    // IMPORTANT: We should return the HASH, not the raw key for security.
    // Adjust 'openRouterKeyHash' if your field name is different.
    const apiKeyHash = userData?.openRouterKeyHash;

    if (!apiKeyHash) {
      logger.info('API key hash not found for user in Firestore. User may need to purchase credits.', { uid });
      // Use 'not-found', client can interpret this as "key not available yet"
      throw new functions.https.HttpsError('not-found', 'API key not found. Please complete a purchase to generate your key.');
    }

    logger.info('Successfully retrieved API key hash for user.', { uid });
    // Return the hash, which is safer to expose than the raw key
    return { apiKey: apiKeyHash };

  } catch (error: any) {
    logger.error('Error retrieving API key hash:', {
        uid: uid,
        error: error.message,
        stack: error.stack,
    });

    // Re-throw HttpsErrors or convert others to internal errors
    if (error instanceof functions.https.HttpsError) {
      throw error;
    } else {
      throw new functions.https.HttpsError('internal', 'Failed to retrieve API key. Please try again later.');
    }
  }
}