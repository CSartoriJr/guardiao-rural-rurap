'use server';
/**
 * @fileOverview Placeholder flow for resetting a user's password.
 * NOTE: This functionality is disabled in the current environment as it requires
 * the Firebase Admin SDK with proper server credentials, which is not available.
 * Password resets for users must be done via the Firebase Console.
 *
 * - resetUserPasswordByAdmin - The exported function.
 * - ResetUserPasswordInput - The input type for the function.
 * - ResetUserPasswordOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
    const errorMessage = 'A alteração de senha por um administrador não é suportada neste ambiente. Por favor, use o Console do Firebase.';
    console.warn(`[resetUserPasswordByAdminFlow] Blocked attempt to reset password for user ${userId}. Reason: ${errorMessage}`);
    
    // Return a failure message to the client to indicate the feature is disabled.
    return { 
      success: false, 
      message: errorMessage 
    };
  }
);
