// src/services/imageUploadService.ts
import { storage, firebaseInitializedCorrectly } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot, UploadTask } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // For unique filenames

const ensureFirebaseInitialized = () => {
  if (!firebaseInitializedCorrectly || !storage) {
    const errorMessage = "[ImageUploadService] Firebase Storage not properly initialized. Cannot perform storage operations.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

interface UploadImageResult {
  uploadTask: UploadTask;
  promise: Promise<string>;
}

export function uploadImage(
  file: File,
  userId: string,
  onProgressUpdate?: (percentage: number) => void
): UploadImageResult {
  ensureFirebaseInitialized();
  if (!userId) {
    const err = new Error('User ID é obrigatório para o upload da imagem.');
    // Simulate UploadTask for consistent return type in case of early error
    const dummyTask = { cancel: () => {}, snapshot: { totalBytes: 0, bytesTransferred: 0 } } as unknown as UploadTask;
    return { uploadTask: dummyTask, promise: Promise.reject(err) };
  }
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const storagePath = `requests_images/${userId}/${uniqueFileName}`;
  const storageRef = ref(storage!, storagePath);

  console.log(`[ImageUploadService] Uploading ${file.name} to ${storagePath}`);
  const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

  const promise = new Promise<string>((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgressUpdate) {
          onProgressUpdate(Math.round(progress));
        }
        console.log(`[ImageUploadService] Upload for ${file.name} is ${progress}% done`);
      },
      (error) => {
        console.error(`[ImageUploadService] Error uploading ${file.name}:`, error.code, error.message, error);
        // Firebase error object (error) already has a 'code' and 'message' property
        // No need to wrap it in a new Error unless we want to customize the message based on code here.
        // For now, just reject with the original Firebase error object.
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`[ImageUploadService] File ${file.name} uploaded successfully. URL:`, downloadURL);
          if (onProgressUpdate) { // Ensure UI shows 100% on completion
            onProgressUpdate(100);
          }
          resolve(downloadURL);
        } catch (e: any) {
          console.error(`[ImageUploadService] Error getting download URL for ${file.name}:`, e);
          reject(e); // Reject with the error from getDownloadURL
        }
      }
    );
  });

  return { uploadTask, promise };
}
