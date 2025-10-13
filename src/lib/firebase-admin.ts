// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import type { Auth } from 'firebase-admin/auth';

let adminAuth: Auth | undefined = undefined;
let adminInitialized = false;

// Variáveis de ambiente para as credenciais do Firebase Admin
const projectId = process.env.PROJECT_ID;
const clientEmail = process.env.CLIENT_EMAIL;
// A chave privada precisa ser formatada corretamente (substituindo '\\n' por '\n')
const privateKey = process.env.PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  console.log('[FirebaseAdmin] Attempting to initialize Firebase Admin SDK...');
  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId: projectId,
      });
      adminAuth = admin.auth();
      adminInitialized = true;
      console.log('[FirebaseAdmin] Firebase Admin SDK initialized SUCCESSFULLY with explicit credentials.');
    } catch (error: any) {
      console.error('[FirebaseAdmin] CRITICAL: Failed to initialize Firebase Admin SDK with explicit credentials:', error.message);
      adminInitialized = false;
    }
  } else {
    console.warn('[FirebaseAdmin] WARNING: Firebase Admin SDK credentials not found in environment variables. Admin-level operations will fail.');
    adminInitialized = false;
  }
} else {
  console.log('[FirebaseAdmin] Firebase Admin SDK already initialized.');
  if (!adminInitialized) { // Ensure auth is set if app was initialized but our flag isn't set
      adminAuth = admin.auth();
      adminInitialized = true;
  }
}

export { adminAuth, adminInitialized };
