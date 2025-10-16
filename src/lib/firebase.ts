// src/lib/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let firebaseInitializedCorrectly = false;

try {
  if (getApps().length) {
    app = getApp();
    console.log('[Firebase] Re-using existing Firebase app instance.');
  } else {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] New Firebase app initialized.');
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('[Firebase] Firestore offline persistence failed: another tab has it enabled.');
      } else if (err.code === 'unimplemented') {
        console.warn('[Firebase] Firestore offline persistence is not available in this browser.');
      }
    });
  }

  firebaseInitializedCorrectly = true;
  console.log('[Firebase] All services initialized successfully.');

} catch (e: any) {
  firebaseInitializedCorrectly = false;
  console.error('[Firebase Initialization Error] A critical error occurred during Firebase setup:', e.message);
  // We don't initialize any of the exports if setup fails.
  // This helps prevent other services from using a partially initialized Firebase.
}

export { app, auth, db, storage, firebaseInitializedCorrectly };
