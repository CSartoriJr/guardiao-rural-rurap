'use server';
/**
 * @fileOverview A flow to securely fetch farmer data for technicians.
 * This flow acts as a server-side proxy to bypass client-side Firestore security rules
 * that prevent technicians from querying the 'users' collection directly.
 *
 * - getFarmersForTechnician - A function that retrieves a list of farmers, optionally filtered by municipality.
 * - GetFarmersInput - The input type for the getFarmersForTechnician function.
 * - GetFarmersOutput - The return type for the getFarmersForTechnician function.
 */

import { ai } from '@/ai/genkit';
import { getFarmers as getFarmersFromDb } from '@/services/userService';
import { z } from 'genkit';
import { firebaseInitializedCorrectly } from '@/lib/firebase';

const GetFarmersInputSchema = z.object({
  municipalities: z.array(z.string()).optional().describe('An optional list of municipalities to filter farmers by.'),
});
export type GetFarmersInput = z.infer<typeof GetFarmersInputSchema>;

// Define a Zod schema that matches the User type from src/types/index.ts
const UserSchema = z.object({
    id: z.string(),
    cpf: z.string(),
    role: z.enum(['farmer', 'technician', 'admin']),
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    municipality: z.string().optional(),
    familyMembers: z.number().optional(),
    assignedMunicipalities: z.array(z.string()).optional(),
});

const GetFarmersOutputSchema = z.array(UserSchema);
export type GetFarmersOutput = z.infer<typeof GetFarmersOutputSchema>;

export async function getFarmersForTechnician(input: GetFarmersInput): Promise<GetFarmersOutput> {
  return getFarmersFlow(input);
}

const getFarmersFlow = ai.defineFlow(
  {
    name: 'getFarmersForTechnicianFlow',
    inputSchema: GetFarmersInputSchema,
    outputSchema: GetFarmersOutputSchema,
  },
  async (input) => {
    if (!firebaseInitializedCorrectly) {
      console.error('[getFarmersFlow] Firebase not initialized. Cannot fetch farmers.');
      return [];
    }
    console.log(`[getFarmersFlow] Fetching farmers for municipalities: ${input.municipalities?.join(', ')}`);
    // This function call now happens on the server via the flow, bypassing client permissions.
    const farmers = await getFarmersFromDb(input.municipalities);
    return farmers;
  }
);
