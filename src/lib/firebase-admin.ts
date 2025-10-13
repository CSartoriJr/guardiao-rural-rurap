import * as admin from 'firebase-admin';

let adminApp: admin.app.App | undefined;
let adminInitializedCorrectly = false;

if (admin.apps.length === 0) {
  try {
    // Em um ambiente de servidor seguro como o do Studio/Google Cloud,
    // a SDK Admin pode ser inicializada sem argumentos para usar as
    // credenciais padrão do ambiente (Application Default Credentials).
    console.log('[Firebase Admin] Attempting to initialize Admin SDK...');
    adminApp = admin.initializeApp();
    adminInitializedCorrectly = true;
    console.log('[Firebase Admin] SDK initialized successfully.');
  } catch (error: any) {
    console.error('[Firebase Admin] CRITICAL: Failed to initialize Firebase Admin SDK:', error.message);
    adminInitializedCorrectly = false;
  }
} else {
  // Se já houver um app inicializado, reutilize-o.
  adminApp = admin.app();
  adminInitializedCorrectly = true;
  console.log('[Firebase Admin] SDK already initialized.');
}

// Exporte os serviços apenas se a inicialização tiver sido bem-sucedida.
export const adminAuth = adminInitializedCorrectly && adminApp ? admin.auth(adminApp) : undefined;
export const adminDb = adminInitializedCorrectly && adminApp ? admin.firestore(adminApp) : undefined;
export { adminInitializedCorrectly };
