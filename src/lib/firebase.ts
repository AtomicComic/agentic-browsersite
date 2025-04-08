// Import the Firebase SDK
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth, db, googleProvider } from './firebase-config';

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const loginWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email and password:", error);
    throw error;
  }
};

export const registerWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error registering with email and password:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Email link authentication functions
export const sendSignInLinkToUserEmail = async (email: string) => {
  try {
    // Configure action code settings
    const actionCodeSettings = {
      // URL you want to redirect back to. The domain (www.example.com) for this
      // URL must be in the authorized domains list in the Firebase Console.
      url: window.location.origin + '/email-signin',
      // This must be true for email link sign-in
      handleCodeInApp: true,
    };

    console.log("Sending sign-in link to email:", email);
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    // Save the email locally so you don't need to ask the user for it again
    // if they open the link on the same device.
    window.localStorage.setItem('emailForSignIn', email);

    console.log("Sign-in link sent successfully");
    return true;
  } catch (error: any) {
    console.error("Error sending sign-in link to email:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
};

export const completeSignInWithEmailLink = async (email: string, link: string) => {
  try {
    console.log("Completing sign-in with email link");

    if (!isSignInWithEmailLink(auth, link)) {
      console.error("Invalid sign-in link");
      throw new Error("Invalid sign-in link");
    }

    const result = await signInWithEmailLink(auth, email, link);

    // Clear email from storage
    window.localStorage.removeItem('emailForSignIn');

    console.log("Email link sign-in successful", result.user);
    return result.user;
  } catch (error: any) {
    console.error("Error completing sign-in with email link:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
};

// Link email link credential to existing user
export const linkWithEmailLink = async (email: string, link: string) => {
  try {
    if (!auth.currentUser) {
      throw new Error("No user is currently signed in");
    }

    // Create the email link credential
    const credential = EmailAuthProvider.credentialWithLink(email, link);

    // Link the credential to the current user
    const result = await linkWithCredential(auth.currentUser, credential);
    return result.user;
  } catch (error: any) {
    console.error("Error linking email link to user:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
};

// Re-authenticate with email link
export const reauthenticateWithEmailLink = async (email: string, link: string) => {
  try {
    if (!auth.currentUser) {
      throw new Error("No user is currently signed in");
    }

    // Create the email link credential
    const credential = EmailAuthProvider.credentialWithLink(email, link);

    // Re-authenticate the user with this credential
    const result = await reauthenticateWithCredential(auth.currentUser, credential);
    return result.user;
  } catch (error: any) {
    console.error("Error re-authenticating with email link:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
};

export { auth, db };
