import { Request, Response } from 'express';
import * as admin from 'firebase-admin';

// Express-based handler (for REST API)
export async function getUserKey(req: Request, res: Response) {
  try {
    // Verify Firebase ID token
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Get user data from Firestore
      const userDoc = await admin.firestore().collection('users').doc(uid).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();

      if (!userData?.openRouterKey) {
        return res.status(404).json({ error: 'API key not found. Purchase credits to receive your API key.' });
      }

      // Return the API key
      return res.status(200).json({ apiKey: userData.openRouterKey });
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return res.status(500).json({ error: 'Failed to retrieve API key' });
  }
}

// Callable function handler (for Firebase callable functions)
export async function getUserKeyCallable(uid: string): Promise<{ apiKey: string }> {
  try {
    // Get user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    if (!userData?.openRouterKey) {
      throw new Error('API key not found. Purchase credits to receive your API key.');
    }

    // Return the API key
    return { apiKey: userData.openRouterKey };
  } catch (error) {
    console.error('Error retrieving API key:', error);
    throw error;
  }
}