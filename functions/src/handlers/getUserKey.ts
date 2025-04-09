import * as admin from 'firebase-admin';

// Callable function to retrieve a user’s key
export async function getUserKeyCallable(uid: string): Promise<{ apiKey: string }> {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    if (!userData?.openRouterKey) {
      throw new Error('API key not found. Purchase credits to receive your API key.');
    }

    return { apiKey: userData.openRouterKey };
  } catch (error) {
    console.error('Error retrieving API key:', error);
    throw error;
  }
}
