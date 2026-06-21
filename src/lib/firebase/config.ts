import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Keep villagers signed in for the long term so they verify by OTP only once.
// indexedDB persistence survives browser restarts; the refresh token stays
// valid until the account is deactivated, and ID tokens auto-refresh silently.
if (typeof window !== "undefined") {
  setPersistence(auth, indexedDBLocalPersistence).catch((e) =>
    console.error("Failed to set auth persistence:", e)
  );
}

export const db = getFirestore(app);
export const storage = getStorage(app);
