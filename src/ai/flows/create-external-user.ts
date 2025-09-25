'use server';
/**
 * @fileOverview A secure flow for creating an external user (GabineteGov, Diagro, SDR).
 * This flow is called by an admin to create a new user with view-only permissions.
 *
 * - createExternalUser - The exported function that server-side logic will call.
 * - CreateExternalUserInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { firebaseConfig } from '@/lib/firebase';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User as AppUser } from '@/types';

const USERS_COLLECTION = 'users';

const CreateExternalUserInputSchema = z.object({
  name: z.string(),
  cpf: z.string(),
  email: z.string().email(),
  role: z.enum(['GabineteGov', 'Diagro', 'SDR']),
  password: z.string(),
});
export type CreateExternalUserInput = z.infer<typeof CreateExternalUserInputSchema>;

const CreateExternalUserOutputSchema = z.object({
    success: z.boolean(),
    user: z.custom<AppUser>().optional(),
    message: z.string().optional(),
});


export async function createExternalUser(input: CreateExternalUserInput): Promise<z.infer<typeof CreateExternalUserOutputSchema>> {
  return createExternalUserFlow(input);
}

const createExternalUserFlow = ai.defineFlow(
  {
    name: 'createExternalUserFlow',
    inputSchema: CreateExternalUserInputSchema,
    outputSchema: CreateExternalUserOutputSchema,
  },
  async (userData) => {
    if (!db) {
      const msg = "[createExternalUserFlow] Firestore not initialized.";
      console.error(msg);
      return { success: false, message: msg };
    }

    const tempAppName = `auth-worker-external-${Date.now()}`;
    let tempApp: FirebaseApp | undefined;
    
    try {
      tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);
      const firebaseCompatibleEmail = `${userData.cpf.replace(/\D/g, '')}@cacabruxa.app`;
      
      console.log(`[createExternalUserFlow] Creating Firebase Auth user: ${firebaseCompatibleEmail}`);
      const userCredential = await createUserWithEmailAndPassword(tempAuth, firebaseCompatibleEmail, userData.password);
      const fbUser = userCredential.user;

      await updateProfile(fbUser, { displayName: userData.name });
      
      const appUser: AppUser = {
        id: fbUser.uid,
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email,
        role: userData.role,
      };

      const userRef = doc(db, USERS_COLLECTION, fbUser.uid);
      await setDoc(userRef, appUser);
      console.log(`[createExternalUserFlow] Firestore document created for external user ${fbUser.uid}`);

      return { success: true, user: appUser };

    } catch (error: any) {
      console.error(`[createExternalUserFlow] Error:`, error);
      let message = "Ocorreu um erro desconhecido no servidor.";
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este CPF já está cadastrado no sistema.';
      } else if (error.message) {
        message = error.message;
      }
      return { success: false, message };
    } finally {
      if (tempApp) {
        await deleteApp(tempApp);
        console.log(`[createExternalUserFlow] Deleted temporary Firebase app: ${tempAppName}`);
      }
    }
  }
);
