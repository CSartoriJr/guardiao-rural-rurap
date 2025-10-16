// src/services/imageUploadService.ts
import { storage, firebaseInitializedCorrectly } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot, UploadTask, FirebaseStorageError } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // For unique filenames

// This service is now deprecated in favor of signed URL uploads.
// The functions are kept to avoid breaking imports, but they should not be used for new uploads.

const ensureFirebaseInitialized = () => {
  if (!firebaseInitializedCorrectly) {
    const errorMessage = "[ImageUploadService] Firebase not properly initialized. Cannot perform storage operations.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  if (!storage) {
    const errorMessage = "[ImageUploadService] Firebase Storage instance is not available. Check firebase.ts initialization.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

interface UploadFileResult {
  uploadTask: UploadTask;
  promise: Promise<string>;
}

/**
 * @deprecated Use a signed URL flow for new uploads. This function uses the client SDK which can have permission issues.
 */
export function uploadImage(
  file: File,
  path: string,
  onProgressUpdate?: (percentage: number) => void
): UploadFileResult {
  return uploadFile(file, path, onProgressUpdate);
}

/**
 * @deprecated Use a signed URL flow for new uploads. This function uses the client SDK which can have permission issues.
 */
export function uploadFile(
  file: File,
  path: string,
  onProgressUpdate?: (percentage: number) => void
): UploadFileResult {
  console.warn("[DEPRECATED] uploadFile service is called. Should migrate to signed URL uploads.");
  ensureFirebaseInitialized();

  if (!path) {
    const err = new Error('O caminho de destino é obrigatório para o upload do arquivo.');
    console.error(`[FileUploader] ${err.message}`);
    // We need to return a structure that includes a rejected promise.
    return {
      uploadTask: {} as UploadTask,
      promise: Promise.reject(err),
    };
  }

  const fileExtension = file.name.split('.').pop() || 'dat';
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const storagePath = `${path}/${uniqueFileName}`;
  const storageRef = ref(storage!, storagePath);

  console.log(`[FileUploader] Tentando fazer upload para a pasta: "${path}" com o nome de arquivo: "${uniqueFileName}"`);

  const uploadTask = uploadBytesResumable(storageRef, file);

  const promise = new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`[FileUploader] Upload is ${progress.toFixed(2)}% done for ${file.name}`);
        if (onProgressUpdate) {
          onProgressUpdate(Math.round(progress));
        }
      },
      (error: FirebaseStorageError) => {
        if (error.code === 'storage/canceled') {
          console.log(`[FileUploader] Upload canceled by user for file: ${file.name}`);
          const cancellationError = new Error('Upload cancelado pelo usuário.');
          (cancellationError as any).code = 'storage/canceled';
          reject(cancellationError);
          return;
        }
        
        console.error(`[FileUploader] Firebase Storage Error for ${file.name} - Code: ${error.code}, Message: ${error.message}`);
        
        let userFriendlyMessage = 'Ocorreu um erro ao enviar seu arquivo. Tente novamente.';
        switch(error.code) {
            case 'storage/unauthorized':
                userFriendlyMessage = 'Você não tem permissão para enviar arquivos. Verifique as regras de segurança do Firebase Storage.';
                break;
            case 'storage/retry-limit-exceeded':
                userFriendlyMessage = 'Falha de comunicação com o servidor. Por favor, verifique sua conexão e tente novamente em alguns instantes.';
                break;
            case 'storage/unknown':
                userFriendlyMessage = 'Ocorreu um erro desconhecido no servidor. Verifique sua conexão e tente novamente.';
                break;
        }

        const finalError = new Error(userFriendlyMessage);
        (finalError as any).code = error.code;
        
        reject(finalError);
      },
      async () => {
        try {
          console.log('[FileUploader] Upload complete. Getting download URL...');
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`[FileUploader] File ${file.name} uploaded successfully. URL:`, downloadURL);
          if (onProgressUpdate) {
            onProgressUpdate(100);
          }
          resolve(downloadURL);
        } catch (e: any) {
          console.error(`[FileUploader] Error getting download URL for ${file.name}:`, e);
          const getUrlError = new Error(e.message || 'Falha ao obter URL de download após o upload.');
          (getUrlError as any).code = e.code || 'storage/get-url-failed';
          reject(getUrlError);
        }
      }
    );
  });

  return { uploadTask, promise };
}
