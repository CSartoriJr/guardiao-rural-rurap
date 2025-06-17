
'use client';
import type { User as AppUser } from '@/types';
import type { User as FirebaseUserType } from 'firebase/auth';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth as firebaseAuth, firebaseInitializedCorrectly } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { createUserDocument, getUserDocument } from '@/services/userService'; // Assuming userService.ts

interface AuthContextType {
  user: AppUser | null; // Application user type
  firebaseUser: FirebaseUserType | null; // Firebase Auth user type
  loading: boolean;
  initializing: boolean;
  login: (cpfAsEmail: string, password: string) => Promise<AppUser | null>;
  logout: () => void;
  registerFarmer: (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }) => Promise<AppUser | null>;
  createTechnicianWithAuth: (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }) => Promise<AppUser | null>;
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
          // This case might happen if Firestore doc creation failed or user was deleted from Firestore but not Auth
          console.warn(`[AuthContext] User ${fbUser.uid} authenticated with Firebase, but no Firestore document found. Logging out.`);
          await signOut(firebaseAuth); // Log out to prevent inconsistent state
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

  const login = async (cpfAsEmail: string, password: string): Promise<AppUser | null> => {
    if (!firebaseInitializedCorrectly || !firebaseAuth) throw new Error("Firebase Auth não está inicializado.");
    setLoading(true);
    try {
      // Firebase Auth expects an email format. We'll use CPF + a dummy domain.
      const firebaseCompatibleEmail = `${cpfAsEmail.replace(/\D/g, '')}@cacabruxa.app`;
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, firebaseCompatibleEmail, password);
      const fbUser = userCredential.user;
      const appUserDoc = await getUserDocument(fbUser.uid);
      if (appUserDoc) {
        setUser(appUserDoc);
        setFirebaseUser(fbUser);
        return appUserDoc;
      }
      // Should not happen if user exists in Auth and registration flow ensures Firestore doc
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

      // Update Firebase Auth profile display name immediately
      await updateProfile(fbUser, { displayName: userData.name });

      const appUser = await createUserDocument(fbUser, {
        ...userData,
        role: 'farmer',
        email: firebaseCompatibleEmail, // Store the "email" used for auth
      });
      // No need to call setUser/setFirebaseUser here, onAuthStateChanged will handle it.
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
    try {
      const firebaseCompatibleEmail = `${userData.cpf.replace(/\D/g, '')}@cacabruxa.app`;
      
      // Note: Creating users directly like this client-side has security implications.
      // Ideally, an admin SDK on a backend would create users.
      // This is a simplified approach for this context.
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, firebaseCompatibleEmail, userData.passwordInput);
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
      setLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, initializing, login, logout, registerFarmer, createTechnicianWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
