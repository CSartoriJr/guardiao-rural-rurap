// src/lib/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;
let storage: FirebaseStorage | undefined = undefined;
let firebaseInitializedCorrectly = false;

const essentialKeys = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket, // Added storage bucket check
];

if (essentialKeys.some(key => !key)) {
  const missingKeys = [];
  if (!firebaseConfig.apiKey) missingKeys.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missingKeys.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missingKeys.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missingKeys.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');

  const errorMessage = `[Firebase Initialization Error] Firebase configuration is MISSING CRUCIAL KEYS: ${missingKeys.join(', ')}. Please set these in your .env file or build environment. Firebase will not be initialized.`;
  console.error(errorMessage);
  // No longer throwing an error here to allow build to pass. Runtime checks will handle this.
  firebaseInitializedCorrectly = false;
} else {
  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
      console.log('[Firebase] Firebase App initialized.');
      firebaseInitializedCorrectly = true;
    } catch (e: any) {
      console.error('[Firebase Initialization Error] Failed to initialize Firebase app:', e.message);
      firebaseInitializedCorrectly = false;
    }
  } else {
    app = getApp();
    console.log('[Firebase] Firebase App already initialized.');
    firebaseInitializedCorrectly = true;
  }

  if (app && firebaseInitializedCorrectly) {
    try {
      auth = getAuth(app);
      console.log('[Firebase] Firebase Auth initialized.');
    } catch (e: any) {
      console.error('[Firebase Initialization Error] Failed to initialize Firebase Auth:', e.message);
      auth = undefined;
      firebaseInitializedCorrectly = false;
    }
    try {
      db = getFirestore(app);
      console.log('[Firebase] Firestore initialized.');
    } catch (e: any) {
      console.error('[Firebase Initialization Error] Failed to initialize Firestore:', e.message);
      db = undefined;
      firebaseInitializedCorrectly = false;
    }
    try {
      storage = getStorage(app);
      console.log('[Firebase] Firebase Storage initialized.');
    } catch (e: any) {
      console.error('[Firebase Initialization Error] Failed to initialize Firebase Storage:', e.message);
      storage = undefined;
      firebaseInitializedCorrectly = false;
    }
  } else if (firebaseInitializedCorrectly) { // if app was initialized but something else failed
      firebaseInitializedCorrectly = false; // ensure it's false if any subsequent init fails
      console.error('[Firebase] App was initialized but a sub-service (Auth, DB, or Storage) failed to initialize.');
  }
}

export { app, auth, db, storage, firebaseInitializedCorrectly };
