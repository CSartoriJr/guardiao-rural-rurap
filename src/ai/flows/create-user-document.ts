
'use server';
/**
 * @fileOverview A secure flow for creating a user document in Firestore.
 * This flow is called by the AuthContext after a new Firebase Auth user has been created.
 * It runs on the server to bypass client-side security rules that prevent a user (e.g., an admin)
 * from creating a document for another user.
 *
 * - createUserDocumentFlow - The flow that handles the document creation logic.
 * - createUserDocumentOnServer - The exported function that server-side logic will call.
 * - CreateUserDocumentInput - The input type for the createUserDocumentOnServer function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { firebaseInitializedCorrectly, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { User as AppUser } from '@/types';

const USERS_COLLECTION = 'users';

// Zod schema for the data needed to create a user document.
const CreateUserDocumentInputSchema = z.object({
  userId: z.string().describe('The Firebase Auth UID of the new user.'),
  userData: z.object({
    name: z.string(),
    cpf: z.string(),
    role: z.enum(['farmer', 'technician', 'admin']),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    municipality: z.string().optional(),
    familyMembers: z.number().int().nonnegative().optional(),
    assignedMunicipalities: z.array(z.string()).optional(),
    caf: z.string().optional(),
    registeredByTechnicianId: z.string().optional(),
    registeredByTechnicianName: z.string().optional(),
  }).describe('The data to be stored in the Firestore user document.'),
});

export type CreateUserDocumentInput = z.infer<typeof CreateUserDocumentInputSchema>;

// This is the function that the AuthContext will import and call from the server-side.
export async function createUserDocumentOnServer(input: CreateUserDocumentInput): Promise<AppUser> {
  return createUserDocumentFlow(input);
}

// The actual Genkit flow definition.
const createUserDocumentFlow = ai.defineFlow(
  {
    name: 'createUserDocumentFlow',
    inputSchema: CreateUserDocumentInputSchema,
    // The output is the created AppUser object.
    outputSchema: z.custom<AppUser>(),
  },
  async ({ userId, userData }) => {
    if (!firebaseInitializedCorrectly || !db) {
      const errorMessage = "[createUserDocumentFlow] Firebase not initialized. Cannot create user document.";
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    const userRef = doc(db, USERS_COLLECTION, userId);
    
    // Construct the final user object, ensuring the ID is included.
    const finalUserData: AppUser = {
      id: userId,
      ...userData,
    };
    
    // Clean up undefined fields before sending to Firestore.
    Object.keys(finalUserData).forEach(key => {
        const K = key as keyof AppUser;
        if (finalUserData[K] === undefined) {
          delete finalUserData[K];
        }
    });

    try {
      console.log(`[createUserDocumentFlow] Attempting to create Firestore document for user ${userId} with data:`, finalUserData);
      await setDoc(userRef, finalUserData);
      console.log(`[createUserDocumentFlow] Successfully created Firestore document for user ${userId}.`);
      return finalUserData;
    } catch (error: any) {
      console.error(`[createUserDocumentFlow] Error creating Firestore document for user ${userId}:`, error);
      throw new Error(error.message || "Ocorreu um erro desconhecido no servidor ao criar o documento do usuário.");
    }
  }
);
