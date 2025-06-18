
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
      (error: FirebaseStorageError | Error | ProgressEvent) => { 
        console.log(`[ImageUploadService] Error callback triggered for ${file.name}. Original error object:`, error);
        
        let finalError: Error;

        if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
            const firebaseError = error as FirebaseStorageError;
            if (firebaseError.code === 'storage/canceled') {
              console.warn(`[ImageUploadService] User canceled upload for ${file.name}. Code: ${firebaseError.code}, Message: ${firebaseError.message || 'Sem mensagem adicional.'}`);
            } else {
              console.error(`[ImageUploadService] Firebase Storage Error - Code: ${firebaseError.code}, Message: ${firebaseError.message || 'Sem mensagem adicional.'}`);
            }
            finalError = new Error(firebaseError.message || `Erro do Firebase Storage: ${firebaseError.code}`);
            (finalError as any).code = firebaseError.code; 
        } else if (error instanceof ProgressEvent) {
            console.error(`[ImageUploadService] ProgressEvent caught as error. Treating as network/communication issue. Type: ${error.type}, Loaded: ${error.loaded}, Total: ${error.total}`);
            finalError = new Error('Falha na comunicação durante o upload. Verifique sua conexão e tente novamente.');
            (finalError as any).code = 'storage/network-error'; 
        } else if (error instanceof Error) {
            console.error(`[ImageUploadService] Generic JavaScript Error: ${error.message}`);
            finalError = new Error(error.message || 'Ocorreu um erro durante o upload.');
            (finalError as any).code = 'storage/unknown';
        } else {
            console.error(`[ImageUploadService] Unknown error type during upload:`, error);
            finalError = new Error('Ocorreu um erro desconhecido durante o upload.');
            (finalError as any).code = 'storage/unknown';
        }
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
