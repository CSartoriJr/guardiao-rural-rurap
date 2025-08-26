'use server';
/**
 * @fileOverview A flow for administrators to securely update user documents.
 * This flow acts as a server-side proxy to bypass client-side Firestore security rules
 * that prevent one user (admin) from modifying another user's document directly.
 *
 * - updateUserByAdminFlow - The flow that handles the update logic.
 * - updateUserAsAdmin - The exported function that client components will call.
 * - UpdateUserAsAdminInput - The input type for the updateUserAsAdmin function.
 */

import { ai } from '@/ai/genkit';
import { updateUserDocument } from '@/services/userService';
import { z } from 'genkit';
import { firebaseInitializedCorrectly } from '@/lib/firebase';

// Zod schema for the data that can be updated.
// It's a subset of the main User type, reflecting what an admin can change.
const UserUpdateSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['farmer', 'tecnico', 'admin']).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  municipality: z.string().optional(),
  familyMembers: z.number().optional(),
  assignedMunicipalities: z.array(z.string()).optional(),
  caf: z.string().optional(),
});


// Input for the flow: which user to update, and what data to update.
const UpdateUserAsAdminInputSchema = z.object({
  userId: z.string().describe('The Firestore document ID of the user to update.'),
  updatedData: UserUpdateSchema.describe('An object containing the fields to update.'),
});
export type UpdateUserAsAdminInput = z.infer<typeof UpdateUserAsAdminInputSchema>;

// The output is a simple success boolean.
const UpdateUserAsAdminOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
export type UpdateUserAsAdminOutput = z.infer<typeof UpdateUserAsAdminOutputSchema>;


// This is the function that the client-side (React component) will import and call.
export async function updateUserAsAdmin(input: UpdateUserAsAdminInput): Promise<UpdateUserAsAdminOutput> {
  return updateUserByAdminFlow(input);
}


// The actual Genkit flow definition.
const updateUserByAdminFlow = ai.defineFlow(
  {
    name: 'updateUserByAdminFlow',
    inputSchema: UpdateUserAsAdminInputSchema,
    outputSchema: UpdateUserAsAdminOutputSchema,
  },
  async ({ userId, updatedData }) => {
    if (!firebaseInitializedCorrectly) {
      console.error('[updateUserByAdminFlow] Firebase not initialized. Cannot update user.');
      return { success: false, message: "A conexão com o servidor de dados não foi estabelecida." };
    }
    
    // The core logic: call the Firestore service function from the server-side flow.
    // This call has the necessary permissions because it originates from the server environment.
    try {
      console.log(`[updateUserByAdminFlow] Attempting to update user ${userId} with data:`, updatedData);
      await updateUserDocument(userId, updatedData);
      console.log(`[updateUserByAdminFlow] Successfully updated user ${userId}.`);
      return { success: true };
    } catch (error: any) {
      console.error(`[updateUserByAdminFlow] Error updating user ${userId}:`, error);
      return { success: false, message: error.message || "Ocorreu um erro desconhecido no servidor." };
    }
  }
);
