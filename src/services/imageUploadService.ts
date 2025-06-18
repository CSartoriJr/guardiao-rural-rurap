
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
    const dummyTask = { cancel: () => {}, snapshot: { totalBytes: 0, bytesTransferred: 0 } } as unknown as UploadTask;
    return { uploadTask: dummyTask, promise: Promise.reject(err) };
  }
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const storagePath = `requests_images/${userId}/${uniqueFileName}`;
  const storageRef = ref(storage!, storagePath);

  console.log(`[ImageUploadService] Attempting to upload ${file.name} to ${storagePath}`);
  const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

  const promise = new Promise<string>((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = snapshot.totalBytes > 0 ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;
        // Log detalhado do progresso cru do Firebase
        console.log(`[ImageUploadService] RAW FIREBASE PROGRESS for ${file.name}: ${progress.toFixed(2)}%, State: ${snapshot.state}, Transferred: ${snapshot.bytesTransferred}, Total: ${snapshot.totalBytes}`);
        if (onProgressUpdate) {
          onProgressUpdate(Math.round(progress));
        }
      },
      (error: any) => {
        console.error(`[ImageUploadService] Error during upload for ${file.name}:`, error);
        let finalError: Error;

        if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
          console.error(`[ImageUploadService] Firebase Storage Error - Code: ${error.code}, Message: ${error.message || 'Sem mensagem adicional.'}`);
          finalError = new Error(error.message || `Erro do Firebase Storage: ${error.code}`);
          (finalError as any).code = error.code;
        } else if (error instanceof ProgressEvent) {
          console.error(`[ImageUploadService] ProgressEvent caught as error. Treating as network/unknown issue.`);
          finalError = new Error('Falha na comunicação durante o upload. Verifique sua conexão.');
          (finalError as any).code = 'storage/network-error';
        } else {
          console.error(`[ImageUploadService] Unknown or generic error type.`);
          finalError = new Error((error && error.message) || 'Ocorreu um erro desconhecido durante o upload.');
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
