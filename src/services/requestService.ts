// src/services/requestService.ts
import { db } from '@/lib/firebase';
import { collection, addDoc, getDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import type { AgriRequest, RequestStatus } from '@/types';

const REQUESTS_COLLECTION = 'requests';

// Helper to convert Firestore Timestamps to ISO strings and vice-versa if needed
const convertTimestamps = (data: any): any => {
  const result: any = {};
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      result[key] = data[key].toDate().toISOString();
    } else if (key === 'submissionDate' || key === 'responseDate') {
      // Ensure dates are stored as Timestamps if they are strings
      if (typeof data[key] === 'string' && data[key]) {
        result[key] = Timestamp.fromDate(new Date(data[key]));
      } else if (data[key] === undefined) {
        result[key] = null; // Or serverTimestamp() if it's a creation
      } else {
        result[key] = data[key];
      }
    } else {
      result[key] = data[key];
    }
  }
  return result;
};

const requestFromFirestore = (docSnap: any): AgriRequest => {
    const data = docSnap.data();
    const request: AgriRequest = {
      id: docSnap.id,
      ...data,
      submissionDate: data.submissionDate instanceof Timestamp ? data.submissionDate.toDate().toISOString() : data.submissionDate,
      responseDate: data.responseDate instanceof Timestamp ? data.responseDate.toDate().toISOString() : data.responseDate,
      photoDataUris: Array.isArray(data.photoDataUris) && data.photoDataUris.length === 3 
        ? data.photoDataUris 
        : ['https://placehold.co/300x300.png', 'https://placehold.co/300x300.png', 'https://placehold.co/300x300.png'] // Fallback
    } as AgriRequest;
    // Ensure photoDataUris is always a tuple of 3 strings
    if (!Array.isArray(request.photoDataUris) || request.photoDataUris.length !== 3) {
        request.photoDataUris = ['https://placehold.co/300x300.png', 'https://placehold.co/300x300.png', 'https://placehold.co/300x300.png'];
    }
    return request;
};


export const addRequest = async (
  requestData: Omit<AgriRequest, 'id' | 'submissionDate' | 'status'>
): Promise<AgriRequest> => {
  try {
    const docData = {
      ...requestData,
      submissionDate: serverTimestamp(), // Use server timestamp for creation
      status: 'Pending' as RequestStatus,
      // Ensure optional fields that might be undefined are handled or explicitly set to null
      recommendation: requestData.recommendation ?? null,
      technicianId: requestData.technicianId ?? null,
      technicianName: requestData.technicianName ?? null,
      responseDate: requestData.responseDate ?? null,
      aiSuggestedRecommendation: requestData.aiSuggestedRecommendation ?? null,
      plantedArea: requestData.plantedArea ?? null,
      infectedArea: requestData.infectedArea ?? null,
      latitude: requestData.latitude ?? null,
      longitude: requestData.longitude ?? null,
      deviceLocationStatus: requestData.deviceLocationStatus ?? 'idle',
    };

    const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), docData);
    console.log('[RequestService] Request added with ID:', docRef.id);
    
    // Fetch the just-added document to get server-generated fields like submissionDate
    const newDocSnap = await getDoc(docRef);
    if (!newDocSnap.exists()) {
        throw new Error("Failed to fetch newly created request from Firestore.");
    }
    return requestFromFirestore(newDocSnap);

  } catch (error) {
    console.error('[RequestService] Error adding request:', error);
    throw error;
  }
};

export const getRequestById = async (requestId: string): Promise<AgriRequest | undefined> => {
  try {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
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
  try {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    // Convert date strings back to Timestamps if they are part of updates
    const firestoreUpdates: any = {};
    for (const key in updates) {
        const typedKey = key as keyof AgriRequest;
        if ((typedKey === 'submissionDate' || typedKey === 'responseDate') && typeof updates[typedKey] === 'string') {
            firestoreUpdates[key] = Timestamp.fromDate(new Date(updates[typedKey] as string));
        } else {
            firestoreUpdates[key] = updates[typedKey];
        }
    }
    if (updates.responseDate && !(firestoreUpdates.responseDate instanceof Timestamp)) {
        firestoreUpdates.responseDate = serverTimestamp();
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

// Add other service functions (getRequestsForFarmer, getPendingRequestsForTechnician, etc.) here later
// For now, focusing on add and getById for the core flow.

export const getRequestsForFarmer = async (farmerId: string): Promise<AgriRequest[]> => {
  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where('farmerId', '==', farmerId),
    orderBy('submissionDate', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(requestFromFirestore);
};

export const getPendingRequestsForTechnician = async (): Promise<AgriRequest[]> => {
  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where('status', '==', 'Pending'),
    orderBy('submissionDate', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(requestFromFirestore);
};

export const getAllRequestsForAdmin = async (): Promise<AgriRequest[]> => {
  // Consider pagination for very large datasets in a real production app
  const q = query(collection(db, REQUESTS_COLLECTION), orderBy('submissionDate', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(requestFromFirestore);
};


export const deleteRequestFromFirestore = async (requestId: string): Promise<void> => {
  try {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    await deleteDoc(docRef);
    console.log(`[RequestService] Request deleted from Firestore: ${requestId}`);
  } catch (error) {
    console.error('[RequestService] Error deleting request from Firestore:', error);
    throw error;
  }
};
