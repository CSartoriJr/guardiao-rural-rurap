'use client';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUploadUrl } from '@/ai/flows/get-signed-upload-url';

/**
 * Uploads a file to Firebase Storage using a secure signed URL.
 * This is the recommended method for client-side uploads.
 *
 * @param file The file to upload.
 * @param path The base path in storage (e.g., 'requests/userId').
 * @param onProgressUpdate Callback function to report upload progress (0-100).
 * @param signal AbortSignal to allow canceling the upload.
 * @returns A promise that resolves with the public URL of the uploaded file.
 */
export async function uploadImageWithSignedUrl(
  file: File,
  path: string,
  onProgressUpdate?: (percentage: number) => void,
  signal?: AbortSignal
): Promise<string> {
  if (!path) {
    throw new Error('O caminho de destino é obrigatório para o upload do arquivo.');
  }

  const fileExtension = file.name.split('.').pop() || 'dat';
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const fullPath = `${path}/${uniqueFileName}`;

  try {
    // 1. Get the signed URL from our secure Genkit flow
    console.log(`[uploadImage] Requesting signed URL for path: ${fullPath}`);
    const { signedUrl } = await getSignedUploadUrl({
      filePath: fullPath,
      contentType: file.type,
    });
    console.log(`[uploadImage] Received signed URL.`);

    // 2. Upload the file directly to Firebase Storage using fetch
    console.log(`[uploadImage] Starting upload to signed URL...`);
    
    // We use XMLHttpRequest instead of fetch to get upload progress
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Listen for abort signal
      if (signal) {
        signal.addEventListener('abort', () => {
          console.log('[uploadImage] Abort signal received. Aborting XHR.');
          xhr.abort();
          reject(new DOMException('Upload aborted by user', 'AbortError'));
        });
      }

      // Progress listener
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgressUpdate) {
          const percentage = (event.loaded / event.total) * 100;
          onProgressUpdate(percentage);
        }
      };

      // Error listener
      xhr.onerror = () => {
        console.error('[uploadImage] XHR upload failed.');
        reject(new Error('Falha na requisição de upload. Verifique sua conexão.'));
      };

      // Success listener
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // 3. Construct the public URL after successful upload
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(fullPath)}?alt=media`;
          console.log(`[uploadImage] Upload successful. Public URL: ${publicUrl}`);
          resolve(publicUrl);
        } else {
          console.error(`[uploadImage] Upload failed with status: ${xhr.status} - ${xhr.statusText}`);
          reject(new Error(`Falha no upload com o código: ${xhr.status}.`));
        }
      };
      
      xhr.open('PUT', signedUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

  } catch (error: any) {
    console.error('[uploadImage] Error during signed URL upload process:', error);
    throw new Error(error.message || 'Não foi possível concluir o upload da imagem.');
  }
}

// Deprecated original functions are kept to avoid breaking imports, but they are empty.

interface UploadFileResult {
  uploadTask: any; // Mock to avoid breaking type signatures
  promise: Promise<string>;
}

/**
 * @deprecated Use uploadImageWithSignedUrl instead. This function uses the client SDK which has permission issues and lacks robustness.
 */
export function uploadImage(
  file: File,
  path: string,
  onProgressUpdate?: (percentage: number) => void
): UploadFileResult {
  console.warn("[DEPRECATED] uploadImage service is called. Should migrate to signed URL uploads.");
  return {
    uploadTask: {},
    promise: Promise.reject(new Error("This upload method is deprecated. Use uploadImageWithSignedUrl."))
  };
}

/**
 * @deprecated Use uploadImageWithSignedUrl instead.
 */
export function uploadFile(
  file: File,
  path: string,
  onProgressUpdate?: (percentage: number) => void
): UploadFileResult {
    console.warn("[DEPRECATED] uploadFile service is called. Should migrate to signed URL uploads.");
    return {
        uploadTask: {},
        promise: Promise.reject(new Error("This upload method is deprecated. Use uploadImageWithSignedUrl."))
    };
}
