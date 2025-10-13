'use server';
/**
 * @fileOverview A secure flow for an administrator to reset a user's password
 * using the Firebase Admin SDK.
 *
 * - resetUserPasswordByAdmin - The exported function.
 * - ResetUserPasswordInput - The input type for the function.
 * - ResetUserPasswordOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminAuth, adminInitialized } from '@/lib/firebase-admin';

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
    if (!adminInitialized || !adminAuth) {
      const errorMessage = "A SDK de administração do Firebase não está inicializada. A alteração de senha não pode ser concluída.";
      console.error(`[resetUserPasswordByAdminFlow] ${errorMessage}`);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
    
    try {
      console.log(`[resetUserPasswordByAdminFlow] Attempting to update password for user ${userId} using Admin SDK.`);
      await adminAuth.updateUser(userId, {
        password: newPassword,
      });
      console.log(`[resetUserPasswordByAdminFlow] Successfully updated password for user ${userId}.`);
      return { 
        success: true,
        message: "Senha alterada com sucesso."
      };
    } catch (error: any) {
      console.error(`[resetUserPasswordByAdminFlow] Error updating user password for ${userId}:`, error);
      let userFriendlyMessage = "Ocorreu um erro desconhecido no servidor ao tentar alterar a senha.";
      if (error.code === 'auth/user-not-found') {
        userFriendlyMessage = "O usuário não foi encontrado no sistema de autenticação.";
      } else if (error.message) {
        userFriendlyMessage = error.message;
      }
      return { 
        success: false, 
        message: userFriendlyMessage 
      };
    }
  }
);
