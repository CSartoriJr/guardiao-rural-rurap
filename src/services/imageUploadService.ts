
// src/services/imageUploadService.ts
import { storage, firebaseInitializedCorrectly } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // For unique filenames

const ensureFirebaseInitialized = () => {
  if (!firebaseInitializedCorrectly || !storage) {
    const errorMessage = "[ImageUploadService] Firebase Storage not properly initialized. Cannot perform storage operations.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

export async function uploadImage(file: File, userId: string): Promise<string> {
  ensureFirebaseInitialized();
  if (!userId) {
    throw new Error('User ID é obrigatório para o upload da imagem.');
  }
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const storagePath = `requests_images/${userId}/${uniqueFileName}`; // Path includes userId
  const storageRef = ref(storage!, storagePath);

  try {
    console.log(`[ImageUploadService] Uploading ${file.name} to ${storagePath}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('[ImageUploadService] File uploaded successfully. URL:', downloadURL);
    return downloadURL;
  } catch (error: any) {
    console.error('[ImageUploadService] Error uploading image:', error);
    // Provide more specific error messages if possible
    if (error.code === 'storage/unauthorized') {
      throw new Error('Falha no envio: permissão negada. Verifique as regras do Firebase Storage.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Falha no envio: upload cancelado.');
    }
    throw new Error('Falha ao enviar imagem. Tente novamente.');
  }
}
