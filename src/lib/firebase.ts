
// src/lib/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined = undefined;
let db: Firestore | undefined = undefined;
let storage: FirebaseStorage | undefined = undefined;
let firebaseInitializedCorrectly = false;

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.storageBucket) {
  const missingKeys = [];
  if (!firebaseConfig.apiKey) missingKeys.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missingKeys.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missingKeys.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missingKeys.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  
  const errorMessage = `[Firebase Initialization Warning] Firebase configuration is MISSING CRUCIAL KEYS: ${missingKeys.join(', ')}. Please set these in your .env file or build environment. Firebase services will NOT be available and attempts to use them will fail at runtime.`;
  console.error(errorMessage);
  // Not throwing an error to allow build to pass, but features will fail at runtime.
} else {
  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized.');
      firebaseInitializedCorrectly = true;
    } catch (e: any) {
      console.error('[Firebase Initialization Error] Failed to initialize Firebase app:', e.message);
      firebaseInitializedCorrectly = false;
    }
  } else {
    app = getApp();
    console.log('Firebase app already initialized.');
    // Assuming if getApp() succeeds, it was initialized correctly before.
    // However, we should still try to get db and storage to confirm.
    firebaseInitializedCorrectly = true; 
  }

  if (app && firebaseInitializedCorrectly) {
    try {
      db = getFirestore(app);
    } catch (e: any) {
      console.error('[Firebase Initialization Error] Failed to initialize Firestore:', e.message);
      db = undefined; // Ensure db is undefined if it fails
      firebaseInitializedCorrectly = false; 
    }
    try {
      storage = getStorage(app);
    } catch (e: any) {
      console.error('[Firebase Initialization Error] Failed to initialize Firebase Storage:', e.message);
      storage = undefined; // Ensure storage is undefined if it fails
      firebaseInitializedCorrectly = false; 
    }
  } else {
    // If app initialization failed or was skipped due to missing initial config
    firebaseInitializedCorrectly = false;
  }
}

export { app, db, storage, firebaseInitializedCorrectly };
