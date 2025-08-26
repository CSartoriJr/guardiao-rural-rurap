
'use client';
import type { User as AppUser } from '@/types';
import type { User as FirebaseUserType } from 'firebase/auth';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth as firebaseAuth, firebaseInitializedCorrectly, firebaseConfig } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  getAuth,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getUserDocument } from '@/services/userService';
import { createUserDocumentOnServer } from '@/ai/flows/create-user-document'; // Import the new server flow

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUserType | null;
  loading: boolean;
  initializing: boolean;
  login: (numericCpf: string, password: string) => Promise<AppUser | null>;
  logout: () => void;
  registerFarmer: (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }) => Promise<AppUser | null>;
  createTechnicianWithAuth: (userData: Omit<AppUser, 'id' | 'role' | 'assignedMunicipalities'> & { passwordInput: string }) => Promise<AppUser | null>;
  createAdminWithAuth: (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }) => Promise<AppUser | null>;
  updateCurrentUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    if (!firebaseInitializedCorrectly || !firebaseAuth) {
      console.warn("[AuthContext] Firebase Auth not initialized, AuthProvider will not listen for auth state changes.");
      setInitializing(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setLoading(true);
        const appUserDoc = await getUserDocument(fbUser.uid);
        if (appUserDoc) {
          setUser(appUserDoc);
        } else {
          console.warn(`[AuthContext] User ${fbUser.uid} authenticated with Firebase, but no Firestore document found. Logging out.`);
          await signOut(firebaseAuth);
          setUser(null);
        }
        setLoading(false);
      } else {
        setUser(null);
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (numericCpf: string, password: string): Promise<AppUser | null> => {
    if (!firebaseInitializedCorrectly || !firebaseAuth) throw new Error("Firebase Auth não está inicializado.");
    setLoading(true);
    try {
      const firebaseCompatibleEmail = `${numericCpf}@cacabruxa.app`;
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, firebaseCompatibleEmail, password);
      const fbUser = userCredential.user;
      const appUserDoc = await getUserDocument(fbUser.uid);
      
      if (appUserDoc) {
        setUser(appUserDoc);
        setFirebaseUser(fbUser);
        return appUserDoc;
      } else {
        console.warn(`[AuthContext] User ${fbUser.uid} authenticated but has no Firestore document. Logging out.`);
        await signOut(firebaseAuth);
        return null;
      }
    } catch (error: any) {
      console.error("[AuthContext] Login failed:", error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!firebaseInitializedCorrectly || !firebaseAuth) throw new Error("Firebase Auth não está inicializado.");
    setLoading(true);
    try {
      await signOut(firebaseAuth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error("[AuthContext] Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generic function to create an auth user and then call the server flow to create the Firestore doc.
  const createAuthAndFirestoreUser = async (
    userData: Omit<AppUser, 'id'> & { passwordInput: string; role: AppUser['role'] },
    isTempAuth: boolean = false
  ): Promise<AppUser | null> => {
    if (!firebaseInitializedCorrectly || !firebaseAuth) throw new Error("Firebase Auth não está inicializado.");
    setLoading(true);
    
    let authProvider = firebaseAuth;
    let tempApp: FirebaseApp | undefined = undefined;

    try {
      // For admin/technician creation, we use a temporary auth instance to avoid logging out the current admin.
      if (isTempAuth) {
        tempApp = initializeApp(firebaseConfig, `auth-worker-${userData.role}-${Date.now()}`);
        authProvider = getAuth(tempApp);
      }

      const firebaseCompatibleEmail = `${userData.cpf.replace(/\D/g, '')}@cacabruxa.app`;
      
      const userCredential = await createUserWithEmailAndPassword(authProvider, firebaseCompatibleEmail, userData.passwordInput);
      const fbUser = userCredential.user;

      await updateProfile(fbUser, { displayName: userData.name });
      
      const { passwordInput, ...firestoreData } = userData;

      // Call the secure server flow to create the document in Firestore
      const appUser = await createUserDocumentOnServer({
        userId: fbUser.uid,
        userData: firestoreData,
      });

      return appUser;
    } catch (error: any) {
      console.error(`[AuthContext] ${userData.role} creation failed:`, error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Este CPF já está cadastrado.');
      }
      throw new Error(error.message || `Falha ao cadastrar ${userData.role}.`);
    } finally {
      if (tempApp) {
        await deleteApp(tempApp);
      }
      setLoading(false);
    }
  };


  const registerFarmer = async (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }): Promise<AppUser | null> => {
    return createAuthAndFirestoreUser({ ...userData, role: 'farmer' }, false);
  };
  
  const createTechnicianWithAuth = async (userData: Omit<AppUser, 'id' | 'role' | 'assignedMunicipalities'> & { passwordInput: string }): Promise<AppUser | null> => {
    return createAuthAndFirestoreUser({ ...userData, role: 'technician' }, true);
  };

  const createAdminWithAuth = async (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }): Promise<AppUser | null> => {
    return createAuthAndFirestoreUser({ ...userData, role: 'admin' }, true);
  };
  
  const updateCurrentUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!firebaseAuth || !firebaseAuth.currentUser) {
      throw new Error('Nenhum usuário logado para alterar a senha.');
    }
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser.email) {
        throw new Error('E-mail do usuário não encontrado, não é possível reautenticar.');
    }

    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);

    try {
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      console.log(`[AuthContext] Password updated for user ${currentUser.uid}. Signing out for security.`);
      await logout();
    } catch (error: any) {
      console.error('[AuthContext] Failed to update password:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          throw new Error('A senha atual está incorreta.');
      }
      if (error.code === 'auth/requires-recent-login') {
          throw new Error('Esta é uma operação sensível. Por favor, faça login novamente antes de tentar alterar sua senha.');
      }
      throw new Error(error.message || 'Falha ao alterar a senha.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, initializing, login, logout, registerFarmer, createTechnicianWithAuth, createAdminWithAuth, updateCurrentUserPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
