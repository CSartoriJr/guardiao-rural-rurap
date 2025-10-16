// src/lib/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: "agriassist-k8tg6.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Variáveis para as instâncias do Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let firebaseInitializedCorrectly = false;

try {
  // Inicialização segura para evitar reinicialização em HMR
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Habilitar persistência offline apenas no navegador
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('[Firebase] Persistência offline falhou: outra aba já a tem habilitada.');
      } else if (err.code === 'unimplemented') {
        console.warn('[Firebase] Persistência offline não está disponível neste navegador.');
      }
    });
  }

  firebaseInitializedCorrectly = true;
  console.log('[Firebase] Serviços inicializados com sucesso.');

} catch (e: any) {
  console.error('[Firebase Initialization Error] Erro crítico durante a inicialização do Firebase:', e.message);
  firebaseInitializedCorrectly = false;
  // Em caso de falha, as exportações serão indefinidas, o que será tratado pelas verificações nos serviços.
}

export { app, auth, db, storage, firebaseInitializedCorrectly };
