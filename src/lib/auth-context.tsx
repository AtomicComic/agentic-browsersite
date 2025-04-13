import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getUserOpenRouterKey, OpenRouterCreditInfo } from './firebase-functions';

// User type including Stripe customer ID and API key information
interface UserData {
  uid: string;
  email: string | null;
  stripeCustomerId?: string;
  openRouterKeyHash?: string;
  credits?: number;
  subscription?: {
    status: 'active' | 'inactive' | 'canceled' | 'past_due';
    plan: 'monthly' | 'yearly' | null;
    expiresAt: number | null;
  }
}

interface AuthContextProps {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  openRouterCredits: OpenRouterCreditInfo | null;
  getUserOpenRouterApiKey: () => Promise<{ apiKey: string; credits?: OpenRouterCreditInfo } | null>;
  refreshOpenRouterCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openRouterCredits, setOpenRouterCredits] = useState<OpenRouterCreditInfo | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Fetch additional user data from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          } else {
            // Create a new user document if it doesn't exist
            const newUserData: UserData = {
              uid: user.uid,
              email: user.email,
              credits: 0,
              subscription: {
                status: 'inactive',
                plan: null,
                expiresAt: null
              }
            };

            await setDoc(userDocRef, newUserData);
            setUserData(newUserData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Function to get the user's Agentic Browser API key and credits from Firebase Function
  const getUserOpenRouterApiKey = async (): Promise<{ apiKey: string; credits?: OpenRouterCreditInfo } | null> => {
    if (!currentUser) {
      return null;
    }

    try {
      // Use the Firebase callable function
      const result = await getUserOpenRouterKey();
      return result;
    } catch (error) {
      console.error("Error getting OpenRouter API key and credits:", error);
      return null;
    }
  };

  // Function to refresh Agentic Browser credits
  const refreshOpenRouterCredits = async (): Promise<void> => {
    if (!currentUser) return;

    try {
      const result = await getUserOpenRouterApiKey();
      if (result?.credits) {
        setOpenRouterCredits(result.credits);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  // Fetch Agentic Browser credits when user logs in
  useEffect(() => {
    if (currentUser && userData?.openRouterKeyHash && !openRouterCredits) {
      refreshOpenRouterCredits();
    }
  }, [currentUser, userData, openRouterCredits]);

  const value = {
    currentUser,
    userData,
    loading,
    openRouterCredits,
    getUserOpenRouterApiKey,
    refreshOpenRouterCredits,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
