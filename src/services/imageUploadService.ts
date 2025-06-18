
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
      (error: any) => { // Firebase error object or potentially other error types
        console.error(`[ImageUploadService] Raw error object during upload of ${file.name}:`, error);
        let finalError: Error;

        if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
          // Likely a Firebase Storage Error (e.g., storage/canceled, storage/unauthorized)
          console.error(`[ImageUploadService] Firebase Storage Error for ${file.name}: Code: ${error.code}, Message: ${error.message || 'Sem mensagem adicional.'}`);
          // Create a new error to ensure it's an instance of Error, but carry over code and message
          finalError = new Error(error.message || `Erro do Firebase Storage: ${error.code}`);
          (finalError as any).code = error.code; // Preserve the original code if it exists
        } else if (error instanceof ProgressEvent) {
          // Explicitly handle ProgressEvent if it's thrown/caught as an error
          console.error(`[ImageUploadService] ProgressEvent caught as error for ${file.name}. Treating as network/unknown issue.`);
          finalError = new Error('Falha na comunicação durante o upload. Verifique sua conexão e tente novamente.');
          (finalError as any).code = 'storage/network-error'; // Assign a custom code for clarity
        } else {
          // Generic error or unexpected error type
          console.error(`[ImageUploadService] Unknown or generic error type for ${file.name}:`, error);
          finalError = new Error( (error && error.message) || 'Ocorreu um erro desconhecido durante o upload. Tente novamente.');
          (finalError as any).code = 'storage/unknown'; // Assign a custom code
        }
        reject(finalError);
      },
      async () => { // Complete callback
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`[ImageUploadService] File ${file.name} uploaded successfully. URL:`, downloadURL);
          if (onProgressUpdate) { // Ensure UI shows 100% on completion
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
