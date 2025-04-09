// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions"; // Import Functions type

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app); // Default codebase instance (keep for potential use or remove if unused)
const googleProvider = new GoogleAuthProvider();

// Get a specific instance for the 'functions' codebase
const functionsNew: Functions = getFunctions(app, 'functions'); // Specify codebase only

// Connect to emulators in development
if (window.location.hostname === 'localhost') {
  console.log('Running in development mode - connecting to Firebase emulators');
  // Connect to Firestore emulator
  import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
    connectFirestoreEmulator(db, 'localhost', 8091);
    console.log('Connected to Firestore emulator');
  });

  // Connect to Functions emulator
  import('firebase/functions').then(({ connectFunctionsEmulator }) => {
    // Connect the specific 'functions' instance to the emulator
    connectFunctionsEmulator(functionsNew, 'localhost', 5003);
    console.log('Connected to Functions emulator (functions) at localhost:5003');
  });

  // Connect to Auth emulator
  import('firebase/auth').then(({ connectAuthEmulator }) => {
    connectAuthEmulator(auth, 'http://localhost:9098', { disableWarnings: true });
    console.log('Connected to Auth emulator');
  });
}
// Add scopes for Google provider
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Export the Firebase services
export { app, analytics, auth, db, functions, functionsNew, googleProvider }; // Export the new instance
