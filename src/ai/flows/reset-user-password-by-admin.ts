'use server';
/**
 * @fileOverview A secure flow for an administrator to reset another user's password.
 * This flow is necessary because client-side SDKs cannot change passwords for other users.
 * It uses the Firebase Admin SDK on the server-side to perform this privileged action.
 *
 * - resetUserPasswordByAdmin - The exported function that server-side logic will call.
 * - ResetUserPasswordInput - The input type for the function.
 * - ResetUserPasswordOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminAuth } from '@/lib/firebase-admin'; // Import the initialized Admin SDK Auth

const ResetUserPasswordInputSchema = z.object({
  userId: z.string().describe("The UID of the user whose password needs to be reset."),
  newPassword: z.string().min(6).describe("The new password, must be at least 6 characters."),
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
  async ({ userId, newPassword }) => {
    if (!adminAuth) {
      const msg = "[resetUserPasswordByAdminFlow] Firebase Admin Auth not initialized.";
      console.error(msg);
      return { success: false, message: msg };
    }

    try {
      console.log(`[resetUserPasswordByAdminFlow] Attempting to update password for user ${userId} using Admin SDK.`);
      await adminAuth.updateUser(userId, {
        password: newPassword,
      });

      console.log(`[resetUserPasswordByAdminFlow] Password updated successfully for user ${userId}.`);
      return { success: true };

    } catch (error: any) {
      console.error(`[resetUserPasswordByAdminFlow] Admin SDK Error:`, error);
      let message = "Ocorreu um erro desconhecido no servidor ao tentar alterar a senha.";
      if (error.code === 'auth/user-not-found') {
        message = 'O usuário não foi encontrado no sistema de autenticação.';
      } else if (error.message) {
        message = error.message;
      }
      return { success: false, message };
    }
  }
);
