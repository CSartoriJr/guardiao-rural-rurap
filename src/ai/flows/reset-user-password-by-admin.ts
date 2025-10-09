'use server';
/**
 * @fileOverview A secure flow for an administrator to reset another user's password.
 * This flow is necessary because client-side SDKs cannot change passwords for other users.
 * It uses a temporary, isolated Firebase Auth instance on the server-side to perform this privileged action.
 *
 * - resetUserPasswordByAdmin - The exported function that server-side logic will call.
 * - ResetUserPasswordInput - The input type for the function.
 * - ResetUserPasswordOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebase';
import { getUserDocument } from '@/services/userService';

const ResetUserPasswordInputSchema = z.object({
  userId: z.string().describe("The UID of the user whose password needs to be reset."),
  newPassword: z.string().min(6).describe("The new password, must be at least 6 characters."),
  adminCpf: z.string().describe("The CPF of the admin performing the action."),
  adminPassword: z.string().describe("The password of the admin performing the action.")
});
export type ResetUserPasswordInput = z.infer<typeof ResetUserPasswordInputSchema>;

const ResetUserPasswordOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
export type ResetUserPasswordOutput = z.infer<typeof ResetUserPasswordOutputSchema>;

export async function resetUserPasswordByAdmin(input: ResetUserPasswordInput): Promise<ResetUserPasswordOutput> {
  return resetUserPasswordByAdminFlow(input);
}

const resetUserPasswordByAdminFlow = ai.defineFlow(
  {
    name: 'resetUserPasswordByAdminFlow',
    inputSchema: ResetUserPasswordInputSchema,
    outputSchema: ResetUserPasswordOutputSchema,
  },
  async ({ userId, newPassword, adminCpf, adminPassword }) => {
    const tempAppName = `auth-worker-pw-reset-${Date.now()}`;
    let tempApp: FirebaseApp | undefined;

    try {
      // Step 1: Initialize a temporary Firebase app to act as an admin worker
      tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);

      // Step 2: Authenticate the admin within this temporary session to verify their identity
      const adminFirebaseEmail = `${adminCpf.replace(/\D/g, '')}@cacabruxa.app`;
      console.log(`[resetUserPasswordByAdminFlow] Authenticating admin: ${adminFirebaseEmail}`);
      await signInWithEmailAndPassword(tempAuth, adminFirebaseEmail, adminPassword);
      console.log(`[resetUserPasswordByAdminFlow] Admin authenticated successfully.`);
      
      // Step 3: Fetch the target user's document to get their CPF for re-authentication
      const targetUserDoc = await getUserDocument(userId);
      if (!targetUserDoc || !targetUserDoc.cpf) {
        throw new Error("Usuário alvo não encontrado ou não possui CPF no banco de dados.");
      }
      
      // Step 4: To change another user's password, we must sign them in.
      // We need their original password, which we don't have.
      // The secure alternative is using the Admin SDK, which isn't available here.
      // The current workaround is to inform the user that this action requires backend privileges
      // that are not available in this sandboxed environment.
      // For a real-world scenario, this flow would be replaced by a proper Firebase Admin SDK call.
      
      console.error("[resetUserPasswordByAdminFlow] SECURITY LIMITATION: The client-side SDK cannot directly reset another user's password without their old password. This flow requires the Firebase Admin SDK, which is not available in this environment. Aborting.");
      return { success: false, message: "Funcionalidade de reset de senha não está disponível neste ambiente. Requer privilégios de administrador de back-end." };


    } catch (error: any) {
      console.error(`[resetUserPasswordByAdminFlow] Error:`, error);
      let message = "Ocorreu um erro desconhecido no servidor ao tentar alterar a senha.";
      if (error.code === 'auth/user-not-found') {
        message = 'O usuário não foi encontrado no sistema de autenticação.';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Credenciais de administrador inválidas.';
      }
      else if (error.message) {
        message = error.message;
      }
      return { success: false, message };
    } finally {
      if (tempApp) {
        await deleteApp(tempApp);
        console.log(`[resetUserPasswordByAdminFlow] Deleted temporary Firebase app: ${tempAppName}`);
      }
    }
  }
);
