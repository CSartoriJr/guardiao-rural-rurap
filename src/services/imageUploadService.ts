
// src/services/imageUploadService.ts
import { storage, firebaseInitializedCorrectly } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot, UploadTask, FirebaseStorageError } from 'firebase/storage';
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
    // Criar uma "dummy task" para a interface não quebrar se precisar de um UploadTask
    const dummyTask = {
      cancel: () => { console.warn("[ImageUploadService] Dummy task cancel called."); },
      snapshot: { totalBytes: 0, bytesTransferred: 0, state: 'error', ref: {} } as any,
      then: () => Promise.reject(err),
      catch: () => Promise.reject(err),
      pause: () => { console.warn("[ImageUploadService] Dummy task pause called."); },
      resume: () => { console.warn("[ImageUploadService] Dummy task resume called."); }
    } as unknown as UploadTask;
    return { uploadTask: dummyTask, promise: Promise.reject(err) };
  }

  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const storagePath = `requests_images/${userId}/${uniqueFileName}`;
  const storageRef = ref(storage!, storagePath);

  console.log(`[ImageUploadService] Attempting to upload ${file.name} (size: ${file.size} bytes) to ${storagePath}`);
  const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

  const promise = new Promise<string>((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = snapshot.totalBytes > 0 ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;
        console.log(
            `[ImageUploadService] RAW FIREBASE PROGRESS for ${file.name}: ` +
            `State: ${snapshot.state}, ` +
            `Progress: ${progress.toFixed(2)}%, ` +
            `Transferred: ${snapshot.bytesTransferred} / ${snapshot.totalBytes} bytes`
        );
        
        if (onProgressUpdate) {
          onProgressUpdate(Math.round(progress));
        }
      },
      (error: FirebaseStorageError) => { 
        console.error(`[ImageUploadService] Firebase Storage Error for ${file.name} - Code: ${error.code}, Message: ${error.message}`);
        
        // Create a new error to propagate a cleaner message.
        // The original error object is logged above for full debugging.
        const finalError = new Error(error.message || `Erro do Firebase Storage: ${error.code}`);
        (finalError as any).code = error.code; // Preserve the original code for handling cancellations etc.
        
        reject(finalError);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`[ImageUploadService] File ${file.name} uploaded successfully. URL:`, downloadURL);
          if (onProgressUpdate) {
            onProgressUpdate(100); 
          }
          resolve(downloadURL);
        } catch (e: any) {
          console.error(`[ImageUploadService] Error getting download URL for ${file.name}:`, e);
          const getUrlError = new Error(e.message || 'Falha ao obter URL de download após o upload.');
          (getUrlError as any).code = e.code || 'storage/get-url-failed';
          reject(getUrlError);
        }
      }
    );
  });

  return { uploadTask, promise };
}
