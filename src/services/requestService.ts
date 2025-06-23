
// src/services/requestService.ts
import { db, firebaseInitializedCorrectly } from '@/lib/firebase';
import { collection, addDoc, getDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import type { AgriRequest, RequestStatus } from '@/types';

const REQUESTS_COLLECTION = 'requests';

const ensureFirebaseInitialized = () => {
  if (!firebaseInitializedCorrectly || !db) {
    const errorMessage = "[RequestService] Firebase não está devidamente inicializado. Não é possível realizar operações Firestore.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

const requestFromFirestore = (docSnap: any): AgriRequest => {
    const data = docSnap.data();
    // Ensure photoUrls is always an array of 3 strings, defaulting to placeholders if necessary
    let photoUrls: [string, string, string] = ['https://placehold.co/300x300.png', 'https://placehold.co/300x300.png', 'https://placehold.co/300x300.png'];
    if (Array.isArray(data.photoUrls) && data.photoUrls.length === 3) {
        photoUrls = data.photoUrls.map((url: any) => typeof url === 'string' && url ? url : 'https://placehold.co/300x300.png') as [string, string, string];
    } else if (Array.isArray(data.photoDataUris) && data.photoDataUris.length === 3) {
      // Legacy support for photoDataUris if migrating or if old data exists
      console.warn(`[RequestService] Request ${docSnap.id} using legacy photoDataUris. Please ensure data is migrated to photoUrls.`);
      photoUrls = data.photoDataUris.map((uri: any) => typeof uri === 'string' && uri ? uri : 'https://placehold.co/300x300.png') as [string, string, string];
    }

    const request: AgriRequest = {
      id: docSnap.id,
      ...data,
      submissionDate: data.submissionDate instanceof Timestamp ? data.submissionDate.toDate().toISOString() : data.submissionDate,
      responseDate: data.responseDate instanceof Timestamp ? data.responseDate.toDate().toISOString() : (data.responseDate || undefined),
      photoUrls: photoUrls,
    } as AgriRequest;
    
    return request;
};


export const addRequest = async (
  requestData: Omit<AgriRequest, 'id' | 'submissionDate' | 'status' | 'responseDate' | 'technicianId' | 'technicianName' | 'recommendation'>
): Promise<AgriRequest> => {
  ensureFirebaseInitialized();
  try {
    const docData = {
      ...requestData,
      submissionDate: serverTimestamp(), // Use server timestamp for creation
      status: 'Pending' as RequestStatus,
      photoUrls: requestData.photoUrls, // Should be an array of 3 Firebase Storage URLs
      // Ensure optional fields not in Omit are explicitly set or handled
      recommendation: null,
      technicianId: null,
      technicianName: null,
      responseDate: null,
      plantedArea: requestData.plantedArea ?? null,
      infectedArea: requestData.infectedArea ?? null,
      latitude: requestData.latitude ?? null,
      longitude: requestData.longitude ?? null,
      deviceLocationStatus: requestData.deviceLocationStatus ?? 'idle',
      municipality: requestData.municipality ?? null,
    };

    const docRef = await addDoc(collection(db!, REQUESTS_COLLECTION), docData);
    console.log('[RequestService] Request added with ID:', docRef.id);
    
    const newDocSnap = await getDoc(docRef);
    if (!newDocSnap.exists()) {
        throw new Error("Falha ao buscar o Levantamento recém-criado do Firestore.");
    }
    return requestFromFirestore(newDocSnap);

  } catch (error) {
    console.error('[RequestService] Error adding request:', error);
    throw error;
  }
};

export const getRequestById = async (requestId: string): Promise<AgriRequest | undefined> => {
  ensureFirebaseInitialized();
  try {
    const docRef = doc(db!, REQUESTS_COLLECTION, requestId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return requestFromFirestore(docSnap);
    }
    console.log(`[RequestService] No request found with ID: ${requestId}`);
    return undefined;
  } catch (error) {
    console.error('[RequestService] Error fetching request by ID:', error);
    throw error;
  }
};

export const updateRequest = async (requestId: string, updates: Partial<AgriRequest>): Promise<AgriRequest | null> => {
  ensureFirebaseInitialized();
  try {
    const docRef = doc(db!, REQUESTS_COLLECTION, requestId);
    const firestoreUpdates: any = {};
    
    // Ensure all keys from 'updates' are processed
    for (const key in updates) {
        const typedKey = key as keyof AgriRequest;
        if (updates[typedKey] === undefined) { // Explicitly handle undefined to remove field or set to null
            firestoreUpdates[key] = null;
        } else if ((typedKey === 'submissionDate' || typedKey === 'responseDate') && typeof updates[typedKey] === 'string') {
            firestoreUpdates[key] = Timestamp.fromDate(new Date(updates[typedKey] as string));
        } else {
            firestoreUpdates[key] = updates[typedKey];
        }
    }
    
    // If responseDate is part of updates and is being set (not just cleared)
    if (updates.responseDate && !(firestoreUpdates.responseDate instanceof Timestamp) && firestoreUpdates.responseDate !== null) {
        firestoreUpdates.responseDate = serverTimestamp(); // Use server time if being set to a new date
    }


    await updateDoc(docRef, firestoreUpdates);
    console.log(`[RequestService] Request updated: ${requestId}`);
    const updatedDocSnap = await getDoc(docRef);
    if (!updatedDocSnap.exists()) {
        return null;
    }
    return requestFromFirestore(updatedDocSnap);
  } catch (error) {
    console.error('[RequestService] Error updating request:', error);
    throw error;
  }
};

export const getRequestsForFarmer = async (farmerId: string): Promise<AgriRequest[]> => {
  ensureFirebaseInitialized();
  const q = query(
    collection(db!, REQUESTS_COLLECTION),
    where('farmerId', '==', farmerId),
    orderBy('submissionDate', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(requestFromFirestore);
};

export const getPendingRequestsForTechnician = async (): Promise<AgriRequest[]> => {
  ensureFirebaseInitialized();
  const q = query(
    collection(db!, REQUESTS_COLLECTION),
    where('status', '==', 'Pending'),
    orderBy('submissionDate', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(requestFromFirestore);
};

export const getAllRequestsForAdmin = async (): Promise<AgriRequest[]> => {
  ensureFirebaseInitialized();
  const q = query(collection(db!, REQUESTS_COLLECTION), orderBy('submissionDate', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(requestFromFirestore);
};

export const deleteRequestFromFirestore = async (requestId: string): Promise<void> => {
  ensureFirebaseInitialized();
  try {
    const docRef = doc(db!, REQUESTS_COLLECTION, requestId);
    await deleteDoc(docRef);
    console.log(`[RequestService] Request deleted from Firestore: ${requestId}`);
  } catch (error) {
    console.error('[RequestService] Error deleting request from Firestore:', error);
    throw error;
  }
};
