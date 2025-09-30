// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getAuth, Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './firebase';

let adminApp: admin.app.App | undefined = undefined;
let adminAuth: Auth | undefined = undefined;
let adminInitializedCorrectly = false;

// Check if the app is already initialized to avoid re-initialization errors
if (admin.apps.length === 0) {
  try {
    console.log('[FirebaseAdmin] Initializing Firebase Admin SDK...');
    // The SDK will automatically use the GOOGLE_APPLICATION_CREDENTIALS environment variable
    // if it's set. Otherwise, it will try to find credentials in other default ways.
    adminApp = admin.initializeApp({
        // projectId is used to find the project, but credential is key
        projectId: firebaseConfig.projectId,
    });
    adminAuth = getAuth(adminApp);
    adminInitializedCorrectly = true;
    console.log('[FirebaseAdmin] Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('[FirebaseAdmin] Error initializing Firebase Admin SDK:', error.message);
    adminInitializedCorrectly = false;
  }
} else {
  adminApp = admin.apps[0]!; // Use the already initialized app
  adminAuth = getAuth(adminApp);
  adminInitializedCorrectly = true;
  console.log('[FirebaseAdmin] Using existing Firebase Admin SDK instance.');
}

export { adminApp, adminAuth, adminInitializedCorrectly };
