
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

if (!admin.apps.length) {
  try {
    // Initialize with Application Default Credentials
    adminApp = admin.initializeApp(); 
    console.log('[Firebase Admin] SDK initialized successfully.');
  } catch (error: any) {
    console.error('[Firebase Admin] Error initializing SDK:', error.message);
    // Avoid crashing the entire app, but log the critical failure.
    // Flows using the admin SDK will fail gracefully.
  }
} else {
  adminApp = admin.app();
  console.log('[Firebase Admin] SDK already initialized.');
}

// Export auth and firestore services from the initialized app if it exists
export const adminAuth = adminApp ? admin.auth(adminApp) : undefined;
export const adminDb = adminApp ? admin.firestore(adminApp) : undefined;
export const adminInitializedCorrectly = !!adminApp;
