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

export async function uploadImage(
  file: File,
  userId: string,
  onProgressUpdate?: (percentage: number) => void
): Promise<string> {
  ensureFirebaseInitialized();
  if (!userId) {
    throw new Error('User ID é obrigatório para o upload da imagem.');
  }
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const storagePath = `requests_images/${userId}/${uniqueFileName}`;
  const storageRef = ref(storage!, storagePath);

  return new Promise<string>((resolve, reject) => {
    const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

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
        let message = `Falha ao enviar ${file.name}. Tente novamente.`;
        // Firebase Storage error codes: https://firebase.google.com/docs/storage/web/handle-errors
         if (error instanceof ProgressEvent && error.type === 'error') { // Browser network error before/during Firebase init
            message = 'Erro de rede ao tentar iniciar o upload. Verifique sua conexão.';
        } else {
            switch (error.code) {
                case 'storage/unauthorized':
                    message = 'Falha no envio: permissão negada. Verifique as regras do Firebase Storage.';
                    break;
                case 'storage/canceled':
                    message = 'Falha no envio: upload cancelado.';
                    break;
                case 'storage/unknown': // Can be network issues
                    message = 'Erro desconhecido durante o upload. Verifique sua conexão e tente novamente.';
                    break;
                case 'storage/object-not-found':
                    message = 'Arquivo não encontrado no servidor (raro durante upload).';
                    break;
                case 'storage/bucket-not-found':
                    message = 'Problema de configuração do armazenamento. Contate o suporte.';
                    break;
                case 'storage/project-not-found':
                    message = 'Problema de configuração do projeto Firebase. Contate o suporte.';
                    break;
                case 'storage/quota-exceeded':
                    message = 'Cota de armazenamento excedida.';
                    break;
                case 'storage/unauthenticated':
                    message = 'Usuário não autenticado para realizar o upload.';
                    break;
                case 'storage/retry-limit-exceeded':
                    message = 'Tempo limite para envio da imagem excedido. Tente novamente.';
                    break;
                case 'storage/invalid-argument':
                    message = 'Argumento inválido fornecido para o upload. Verifique o arquivo.';
                    break;
                default:
                    message = `Falha no upload: ${error.message || 'Erro desconhecido'}`;
            }
        }
        reject(new Error(message));
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
          reject(new Error(e.message || 'Falha ao obter URL de download.'));
        }
      }
    );
  });
}
