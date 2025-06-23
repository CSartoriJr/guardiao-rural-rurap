
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
} from 'firebase/auth';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { createUserDocument, getUserDocument } from '@/services/userService';

interface AuthContextType {
  user: AppUser | null; 
  firebaseUser: FirebaseUserType | null; 
  loading: boolean;
  initializing: boolean;
  login: (numericCpf: string, password: string) => Promise<AppUser | null>; // Changed parameter name
  logout: () => void;
  registerFarmer: (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }) => Promise<AppUser | null>;
  createTechnicianWithAuth: (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }) => Promise<AppUser | null>;
  createAdminWithAuth: (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }) => Promise<AppUser | null>;
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
      // numericCpf is expected to be only digits here
      const firebaseCompatibleEmail = `${numericCpf}@cacabruxa.app`;
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, firebaseCompatibleEmail, password);
      const fbUser = userCredential.user;
      const appUserDoc = await getUserDocument(fbUser.uid);
      if (appUserDoc) {
        setUser(appUserDoc);
        setFirebaseUser(fbUser);
        return appUserDoc;
      }
      throw new Error("Documento de usuário não encontrado no Firestore após login.");
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

  const registerFarmer = async (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }): Promise<AppUser | null> => {
    if (!firebaseInitializedCorrectly || !firebaseAuth) throw new Error("Firebase Auth não está inicializado.");
    setLoading(true);
    try {
      const firebaseCompatibleEmail = `${userData.cpf.replace(/\D/g, '')}@cacabruxa.app`;
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, firebaseCompatibleEmail, userData.passwordInput);
      const fbUser = userCredential.user;

      await updateProfile(fbUser, { displayName: userData.name });

      const appUser = await createUserDocument(fbUser, {
        ...userData,
        role: 'farmer',
        email: firebaseCompatibleEmail, 
      });
      return appUser;
    } catch (error: any) {
      console.error("[AuthContext] Farmer registration failed:", error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Este CPF (e-mail) já está cadastrado.');
      }
      throw new Error(error.message || 'Falha no cadastro.');
    } finally {
      setLoading(false);
    }
  };
  
  const createTechnicianWithAuth = async (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }): Promise<AppUser | null> => {
    if (!firebaseInitializedCorrectly || !firebaseAuth) throw new Error("Firebase Auth não está inicializado.");
    setLoading(true);
    let tempApp: FirebaseApp | undefined = undefined;
    try {
      // Create a temporary, secondary Firebase app for this operation so it doesn't use the admin's auth state
      tempApp = initializeApp(firebaseConfig, `auth-worker-technician-${Date.now()}`);
      const tempAuth = getAuth(tempApp);

      const firebaseCompatibleEmail = `${userData.cpf.replace(/\D/g, '')}@cacabruxa.app`;
      
      const userCredential = await createUserWithEmailAndPassword(tempAuth, firebaseCompatibleEmail, userData.passwordInput);
      const fbUser = userCredential.user;

      await updateProfile(fbUser, { displayName: userData.name });

      const appUser = await createUserDocument(fbUser, {
        ...userData,
        role: 'technician',
        email: firebaseCompatibleEmail,
      });

      return appUser;
    } catch (error: any) {
      console.error("[AuthContext] Technician creation with auth failed:", error.code, error.message);
       if (error.code === 'auth/email-already-in-use') {
        throw new Error('Este CPF (e-mail) já está cadastrado para outro técnico.');
      }
      throw new Error(error.message || 'Falha ao criar técnico.');
    } finally {
      if (tempApp) {
        await deleteApp(tempApp); // Clean up the temporary app
      }
      setLoading(false);
    }
  };

  const createAdminWithAuth = async (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }): Promise<AppUser | null> => {
    if (!firebaseInitializedCorrectly || !firebaseAuth) throw new Error("Firebase Auth não está inicializado.");
    setLoading(true);
    let tempApp: FirebaseApp | undefined = undefined;
    try {
      // Create a temporary, secondary Firebase app for this operation so it doesn't use the admin's auth state
      tempApp = initializeApp(firebaseConfig, `auth-worker-admin-${Date.now()}`);
      const tempAuth = getAuth(tempApp);

      const firebaseCompatibleEmail = `${userData.cpf.replace(/\D/g, '')}@cacabruxa.app`;
      
      const userCredential = await createUserWithEmailAndPassword(tempAuth, firebaseCompatibleEmail, userData.passwordInput);
      const fbUser = userCredential.user;

      await updateProfile(fbUser, { displayName: userData.name });

      const appUser = await createUserDocument(fbUser, {
        ...userData,
        role: 'admin',
        email: firebaseCompatibleEmail,
      });
      return appUser;
    } catch (error: any) {
      console.error("[AuthContext] Admin creation with auth failed:", error.code, error.message);
       if (error.code === 'auth/email-already-in-use') {
        throw new Error('Este CPF (e-mail) já está cadastrado para outro usuário.');
      }
      throw new Error(error.message || 'Falha ao criar administrador.');
    } finally {
      if (tempApp) {
        await deleteApp(tempApp); // Clean up the temporary app
      }
      setLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, initializing, login, logout, registerFarmer, createTechnicianWithAuth, createAdminWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
