import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';

// Callable function to retrieve a user's key
export async function getUserKeyCallable(uid: string): Promise<{ apiKey: string }> {
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

    return { apiKey: userData.openRouterKey };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error retrieving API key', { error: errorMessage, uid });
    throw error;
  }
}
