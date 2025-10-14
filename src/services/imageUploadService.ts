
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

interface UploadFileResult {
  uploadTask: UploadTask;
  promise: Promise<string>;
}

export function uploadImage(
  file: File,
  uploadPath: string,
  onProgressUpdate?: (percentage: number) => void
): UploadFileResult {
  return uploadFile(file, uploadPath, onProgressUpdate);
}

export function uploadFile(
  file: File,
  path: string, // This is the full path e.g., `requests/${userId}` or `laudos/${requestId}`
  onProgressUpdate?: (percentage: number) => void
): UploadFileResult {
  ensureFirebaseInitialized();
  console.log(`[FileUploader] Initiating upload for file: ${file.name}, size: ${file.size}, type: ${file.type}`);

  if (!path) {
    const err = new Error('O caminho de destino é obrigatório para o upload do arquivo.');
    console.error(`[FileUploader] ${err.message}`);
    // Retorna uma Promise rejeitada imediatamente para que o chamador possa tratar o erro.
    return {
      uploadTask: {} as UploadTask, // Dummy task
      promise: Promise.reject(err)
    };
  }

  const fileExtension = file.name.split('.').pop() || 'dat';
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const storagePath = `${path}/${uniqueFileName}`;
  const storageRef = ref(storage!, storagePath);

  console.log(`[FileUploader] Attempting to upload to path: ${storagePath}`);
  
  const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

  const promise = new Promise<string>((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = snapshot.totalBytes > 0 ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;
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
