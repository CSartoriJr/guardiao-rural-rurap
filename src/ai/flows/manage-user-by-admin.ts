'use server';
/**
 * @fileOverview A flow for administrators to securely update and delete user documents.
 * This flow acts as a server-side proxy to bypass client-side Firestore security rules.
 *
 * - updateUserAsAdmin - The exported function for updating user data.
 * - deleteUserByAdmin - The exported function for deleting a user document and their auth record.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { firebaseInitializedCorrectly, db } from '@/lib/firebase';
import type { User } from '@/types';
import { doc, deleteDoc, collection, query, where, getDocs, updateDoc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

// Input for the update flow
const UpdateUserAsAdminInputSchema = z.object({
  userId: z.string().describe('The Firestore document ID of the user to update.'),
  updatedData: z.custom<Partial<User>>().describe('An object containing the fields to update.'),
});
export type UpdateUserAsAdminInput = z.infer<typeof UpdateUserAsAdminInputSchema>;

// Output for the update flow
const UpdateUserAsAdminOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
export type UpdateUserAsAdminOutput = z.infer<typeof UpdateUserAsAdminOutputSchema>;


// Input for the delete flow
const DeleteUserByAdminInputSchema = z.object({
  userId: z.string().describe('The Firestore document ID of the user to delete.'),
});
export type DeleteUserByAdminInput = z.infer<typeof DeleteUserByAdminInputSchema>;

// Output for the delete flow (same as update)
const DeleteUserByAdminOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
export type DeleteUserByAdminOutput = z.infer<typeof DeleteUserByAdminOutputSchema>;


// This is the function that the client-side (React component) will import and call for UPDATES.
export async function updateUserAsAdmin(input: UpdateUserAsAdminInput): Promise<UpdateUserAsAdminOutput> {
  return manageUserByAdminFlow(input);
}

// This is the function that the client-side (React component) will import and call for DELETES.
export async function deleteUserByAdmin(input: DeleteUserByAdminInput): Promise<DeleteUserByAdminOutput> {
    return deleteUserByAdminFlow(input);
}


// The actual Genkit flow definition for UPDATING.
const manageUserByAdminFlow = ai.defineFlow(
  {
    name: 'manageUserByAdminFlow',
    inputSchema: UpdateUserAsAdminInputSchema,
    outputSchema: UpdateUserAsAdminOutputSchema,
  },
  async ({ userId, updatedData }) => {
    if (!firebaseInitializedCorrectly || !db) {
      console.error('[manageUserByAdminFlow] Firebase not initialized. Cannot update user.');
      return { success: false, message: "A conexão com o servidor de dados não foi estabelecida." };
    }
    
    // Core logic: call the Firestore service function from the server-side flow.
    try {
      console.log(`[manageUserByAdminFlow] Attempting to update user ${userId} with data:`, updatedData);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updatedData);
      console.log(`[manageUserByAdminFlow] Successfully updated user ${userId}.`);
      return { success: true };
    } catch (error: any) {
      console.error(`[manageUserByAdminFlow] Error updating user ${userId}:`, error);
      return { success: false, message: error.message || "Ocorreu um erro desconhecido no servidor." };
    }
  }
);


// The actual Genkit flow definition for DELETING.
const deleteUserByAdminFlow = ai.defineFlow(
  {
    name: 'deleteUserByAdminFlow',
    inputSchema: DeleteUserByAdminInputSchema,
    outputSchema: DeleteUserByAdminOutputSchema,
  },
  async ({ userId }) => {
    if (!firebaseInitializedCorrectly || !db) {
      console.error('[deleteUserByAdminFlow] Firebase not initialized. Cannot delete user.');
      return { success: false, message: "A conexão com o servidor de dados não foi estabelecida." };
    }
    
    // Rule: Prevent deletion of the master admin
    if (userId === 'Cp9ZO2xfwCVRfuCXFhKpetUVJFz1') {
      return { success: false, message: "O Administrador Master não pode ser removido." };
    }
    
    // Initialize Firebase Admin SDK for Auth operations
    if (!getApps().length) {
      const serviceAccount = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
      if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        const msg = "Credenciais do Firebase Admin não estão configuradas. Não é possível excluir a autenticação do usuário.";
        console.error(`[deleteUserByAdminFlow] ${msg}`);
        return { success: false, message: msg };
      }
      initializeApp({ credential: cert(serviceAccount) });
    }

    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            return { success: false, message: "Usuário não encontrado no Firestore." };
        }
        const currentUserDoc = userDoc.data();

        if (currentUserDoc.role === 'admin') {
            const adminQuery = query(collection(db, 'users'), where("role", "==", "admin"));
            const adminSnapshot = await getDocs(adminQuery);
            if (adminSnapshot.docs.length <= 1) {
              return { success: false, message: "Não é possível remover o único administrador do sistema." };
            }
        }

        if (currentUserDoc.role === 'farmer') {
            const requestQuery = query(collection(db, 'requests'), where('farmerId', '==', userId));
            const requestSnapshot = await getDocs(requestQuery);
            if (!requestSnapshot.empty) {
                return { success: false, message: 'Este agricultor possui Solicitações e não pode ser removido. Remova as Solicitações primeiro.' };
            }
        } else if (currentUserDoc.role === 'technician') {
            const requestQuery = query(collection(db, 'requests'), where('technicianId', '==', userId), where('status', '!=', 'Pending'));
            const requestSnapshot = await getDocs(requestQuery);
            if (!requestSnapshot.empty) {
                return { success: false, message: 'Este técnico possui respostas associadas a Solicitações e não pode ser removido.' };
            }
        }

        // Delete Firestore document first
        await deleteDoc(userRef);
        console.log(`[deleteUserByAdminFlow] User Firestore document deleted for ${userId}.`);

        // Then, delete Firebase Auth user
        try {
            await getAdminAuth().deleteUser(userId);
            console.log(`[deleteUserByAdminFlow] Firebase Auth user deleted for ${userId}.`);
        } catch (authError: any) {
            // If the auth user doesn't exist, it's not a critical failure in this context.
            // This can happen if a user was manually deleted from Auth console.
            if (authError.code === 'auth/user-not-found') {
                console.warn(`[deleteUserByAdminFlow] Firebase Auth user not found for ID ${userId}. Only Firestore doc was deleted.`);
            } else {
                // For other auth errors, we should report them.
                throw authError;
            }
        }

        return { success: true, message: "Usuário removido do banco de dados e do sistema de autenticação." };

    } catch (error: any) {
        console.error(`[deleteUserByAdminFlow] Error deleting user ${userId}:`, error);
        return { success: false, message: error.message || "Ocorreu um erro desconhecido no servidor ao remover o usuário." };
    }
  }
);
