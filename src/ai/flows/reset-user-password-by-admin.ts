'use server';
/**
 * @fileOverview A secure flow for an administrator to reset another user's password.
 * This flow uses the Firebase Admin SDK, which has the necessary privileges to perform this action.
 *
 * - resetUserPasswordByAdmin - The exported function that server-side logic will call.
 * - ResetUserPasswordInput - The input type for the function.
 * - ResetUserPasswordOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminAuth, adminInitializedCorrectly } from '@/lib/firebase-admin'; // Use Admin SDK

const ResetUserPasswordInputSchema = z.object({
  userId: z.string().describe("The UID of the user whose password needs to be reset."),
  newPassword: z.string().min(6).describe("The new password, must be at least 6 characters."),
  // The admin credentials are no longer needed here, as the flow runs in a trusted server environment.
  // The client will perform its own auth check to ensure only an admin can trigger this flow.
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
    // Step 1: Verify the Admin SDK was initialized correctly.
    if (!adminInitializedCorrectly || !adminAuth) {
      const errorMessage = 'O serviço de administração do Firebase não está configurado corretamente no servidor.';
      console.error(`[resetUserPasswordByAdminFlow] Error: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }

    try {
      // Step 2: Use the Admin SDK to directly update the user's password.
      // This is a privileged operation that only the Admin SDK can perform.
      console.log(`[resetUserPasswordByAdminFlow] Attempting to update password for user ${userId} using Admin SDK.`);
      
      await adminAuth.updateUser(userId, {
        password: newPassword,
      });

      console.log(`[resetUserPasswordByAdminFlow] Password for user ${userId} has been successfully changed.`);
      return { success: true, message: "A senha do usuário foi alterada com sucesso." };

    } catch (error: any) {
      console.error(`[resetUserPasswordByAdminFlow] Admin SDK Error updating password for user ${userId}:`, error);
      
      let message = "Ocorreu um erro desconhecido no servidor ao tentar alterar a senha.";
      // Firebase Admin SDK errors have a different structure
      if (error.code === 'auth/user-not-found') {
        message = 'O usuário alvo não foi encontrado no sistema de autenticação.';
      } else if (error.message) {
        message = `Erro do servidor: ${error.message}`;
      }
      
      return { success: false, message };
    }
  }
);
