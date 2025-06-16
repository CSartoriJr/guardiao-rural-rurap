// src/services/imageUploadService.ts
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // For unique filenames

/**
 * Uploads an image file to Firebase Storage.
 * @param file The image file to upload.
 * @param userId The ID of the user uploading the image, for path organization.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
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
