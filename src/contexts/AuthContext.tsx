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
import { createUserDocumentOnServer } from '@/ai/flows/create-user-document'; // Import the server flow

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUserType | null;
  loading: boolean;
  initializing: boolean;
  login: (numericCpf: string, password: string) => Promise<AppUser | null>;
  logout: () => void;
  registerFarmer: (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }) => Promise<AppUser | null>;
  registerFarmerByTechnician: (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }, technician: AppUser) => Promise<AppUser | null>;
  createTechnicianWithAuth: (userData: Omit<AppUser, 'id' | 'role' | 'assignedMunicipalities'> & { passwordInput: string }) => Promise<AppUser | null>;
  createAdminWithAuth: (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }) => Promise<AppUser | null>;
  updateCurrentUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  reauthenticateCurrentUser: (password: string) => Promise<boolean>;
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
        if (user && user.id === fbUser.uid) {
            // Se o usuário do estado já corresponde ao usuário do Firebase, não faz nada
            setInitializing(false);
            setLoading(false);
            return;
        }
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
  }, [user]);

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

  const createAuthAndFirestoreUser = async (
    userData: Omit<AppUser, 'id'> & { passwordInput: string; role: AppUser['role'] }
  ): Promise<AppUser | null> => {
    if (!firebaseInitializedCorrectly) {
      throw new Error("Firebase não está inicializado.");
    }

    const useTempAuth = userData.role !== 'farmer' || !!userData.registeredByTechnicianId;
    let authProvider = firebaseAuth;
    let tempApp: FirebaseApp | undefined;
    
    setLoading(true);

    try {
      if (useTempAuth) {
        const tempAppName = `auth-worker-${userData.role}-${Date.now()}`;
        tempApp = initializeApp(firebaseConfig, tempAppName);
        authProvider = getAuth(tempApp);
      }

      const firebaseCompatibleEmail = `${userData.cpf.replace(/\D/g, '')}@cacabruxa.app`;
      
      const userCredential = await createUserWithEmailAndPassword(authProvider, firebaseCompatibleEmail, userData.passwordInput);
      const fbUser = userCredential.user;

      await updateProfile(fbUser, { displayName: userData.name });
      
      const { passwordInput, ...firestoreData } = userData;

      const appUser = await createUserDocumentOnServer({
        userId: fbUser.uid,
        userData: firestoreData,
      });

      // If a farmer is self-registering, log them in directly
      if (!useTempAuth) {
        console.log("[AuthContext] Self-registration complete. Setting user state now.");
        setFirebaseUser(fbUser);
        setUser(appUser);
      }

      return appUser;

    } catch (error: any) {
      console.error(`[AuthContext] ${userData.role} creation failed:`, error.message, error);
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
    return createAuthAndFirestoreUser({ 
      ...userData, 
      role: 'farmer',
      registrationStatus: 'Pendente' 
    });
  };

  const registerFarmerByTechnician = async (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }, technician: AppUser): Promise<AppUser | null> => {
    const userDataWithTechnician = {
        ...userData,
        role: 'farmer' as const,
        registeredByTechnicianId: technician.id,
        registeredByTechnicianName: technician.name,
        registrationStatus: 'Confirmado' as const,
    };
    return createAuthAndFirestoreUser(userDataWithTechnician);
  };
  
  const createTechnicianWithAuth = async (userData: Omit<AppUser, 'id' | 'role' | 'assignedMunicipalities'> & { passwordInput: string }): Promise<AppUser | null> => {
    return createAuthAndFirestoreUser({ ...userData, role: 'technician' });
  };

  const createAdminWithAuth = async (userData: Omit<AppUser, 'id' | 'role'> & { passwordInput: string }): Promise<AppUser | null> => {
    return createAuthAndFirestoreUser({ ...userData, role: 'admin' });
  };
  
  const reauthenticateCurrentUser = async (password: string): Promise<boolean> => {
    if (!firebaseAuth || !firebaseAuth.currentUser) {
      console.error('[reauthenticateCurrentUser] No current user to reauthenticate.');
      return false;
    }
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser.email) {
      console.error('[reauthenticateCurrentUser] Current user has no email.');
      return false;
    }
  
    const credential = EmailAuthProvider.credential(currentUser.email, password);
  
    try {
      await reauthenticateWithCredential(currentUser, credential);
      console.log(`[AuthContext] User ${currentUser.uid} reauthenticated successfully.`);
      return true;
    } catch (error: any) {
      console.error('[AuthContext] Reauthentication failed:', error.code);
      return false;
    }
  };
  
  const updateCurrentUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const reauthenticated = await reauthenticateCurrentUser(currentPassword);
    if (!reauthenticated) {
      throw new Error('A senha atual está incorreta.');
    }
    
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      throw new Error('Nenhum usuário logado para alterar a senha.');
    }
  
    try {
      await updatePassword(currentUser, newPassword);
      console.log(`[AuthContext] Password updated for user ${currentUser.uid}. Signing out for security.`);
      await logout();
    } catch (error: any) {
      console.error('[AuthContext] Failed to update password after reauthentication:', error);
      throw new Error(error.message || 'Falha ao alterar a senha.');
    }
  };
  

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, initializing, login, logout, registerFarmer, registerFarmerByTechnician, createTechnicianWithAuth, createAdminWithAuth, updateCurrentUserPassword, reauthenticateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};
