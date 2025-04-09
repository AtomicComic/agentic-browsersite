import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const getUserData = onRequest(async (req, res) => {
  try {
    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify token and get user
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userData = userDoc.data();

    res.json({
      credits: userData?.credits || 0,
      subscription: userData?.subscription || {
        status: 'inactive',
        plan: null,
        expiresAt: null
      }
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});