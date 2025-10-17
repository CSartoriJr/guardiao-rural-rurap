'use server';
/**
 * @fileOverview A secure flow for generating a Signed URL for Firebase Storage uploads.
 * This allows clients to upload files directly to a specific location without needing
 * broad write permissions, bypassing client-side security rule complexities.
 *
 * - getSignedUploadUrl - The exported function for clients to call.
 * - GetSignedUploadUrlInput - The input type for the function.
 * - GetSignedUploadUrlOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';

// Securely initialize Firebase Admin SDK using service account credentials from environment variables
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error("Firebase Admin SDK credentials are not configured in environment variables.");
  }
  
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}


const GetSignedUploadUrlInputSchema = z.object({
  filePath: z.string().describe('The full path in Firebase Storage where the file will be uploaded. E.g., "requests/userId/fileName.jpg"'),
  contentType: z.string().describe('The MIME type of the file to be uploaded. E.g., "image/jpeg"'),
});
export type GetSignedUploadUrlInput = z.infer<typeof GetSignedUploadUrlInputSchema>;

const GetSignedUploadUrlOutputSchema = z.object({
  signedUrl: z.string().url(),
});
export type GetSignedUploadUrlOutput = z.infer<typeof GetSignedUploadUrlOutputSchema>;

export async function getSignedUploadUrl(input: GetSignedUploadUrlInput): Promise<GetSignedUploadUrlOutput> {
  return getSignedUploadUrlFlow(input);
}

const getSignedUploadUrlFlow = ai.defineFlow(
  {
    name: 'getSignedUploadUrlFlow',
    inputSchema: GetSignedUploadUrlInputSchema,
    outputSchema: GetSignedUploadUrlOutputSchema,
  },
  async ({ filePath, contentType }) => {
    try {
      console.log(`[getSignedUploadUrlFlow] Generating signed URL for path: ${filePath}`);
      const storage = getStorage();
      const bucket = storage.bucket();
      const file = bucket.file(filePath);

      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: contentType,
      });

      console.log(`[getSignedUploadUrlFlow] Successfully generated signed URL.`);
      return { signedUrl };

    } catch (error: any) {
      console.error('[getSignedUploadUrlFlow] Error generating signed URL:', error);
      throw new Error('Could not generate a secure upload link. ' + error.message);
    }
  }
);
