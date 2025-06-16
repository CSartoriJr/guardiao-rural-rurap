
// src/services/imageUploadService.ts
// This service is for Firebase Storage. Since we are reverting to Data URIs,
// its content will be commented out or cleared to prevent accidental use
// and to avoid build errors if it were still imported by ImageUploadInput.

/*
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // For unique filenames

export async function uploadImage(file: File, userId: string): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required for uploading image.');
  }
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const storagePath = `requests_images/${userId}/${uniqueFileName}`;
  const storageRef = ref(storage, storagePath);

  try {
    console.log(`[ImageUploadService] Uploading ${file.name} to ${storagePath}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('[ImageUploadService] File uploaded successfully. URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('[ImageUploadService] Error uploading image:', error);
    throw new Error('Falha ao enviar imagem.');
  }
}
*/

// Placeholder export to avoid breaking imports if any exist elsewhere,
// though ImageUploadInput.tsx will be changed to not import this.
export {};
