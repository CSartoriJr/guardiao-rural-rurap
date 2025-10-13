import * as admin from 'firebase-admin';

let adminApp: admin.app.App | undefined;
let adminInitializedCorrectly = false;

if (admin.apps.length === 0) {
  try {
    // No ambiente do Google Cloud (como o Studio), a SDK Admin
    // deve ser inicializada sem argumentos para usar as credenciais do ambiente (Application Default Credentials).
    // O erro anterior indicava um problema na cadeia de credenciais do ambiente, não na chamada do código.
    // A estrutura correta é simplesmente chamar initializeApp() e confiar no ambiente.
    adminApp = admin.initializeApp();
    adminInitializedCorrectly = true;
    console.log('[Firebase Admin] SDK initialized successfully.');
  } catch (error: any) {
    console.error('[Firebase Admin] CRITICAL: Failed to initialize Firebase Admin SDK:', error.message);
    // A inicialização falhou, então garantimos que `adminInitializedCorrectly` seja falso.
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
