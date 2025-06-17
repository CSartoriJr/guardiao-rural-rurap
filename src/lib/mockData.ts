
import type { User, AgriRequest } from '@/types';

// These keys might still be used if some part of the app falls back or for cleanup.
const MOCK_USERS_STORAGE_KEY = 'app_mock_users_v2'; 
const MOCK_REQUESTS_STORAGE_KEY = 'app_mock_requests_v2';


// --- Default Data (Primarily for amapaMunicipalities now) ---
export let mockUsers: User[] = []; // No longer the source of truth for users
export let mockRequests: AgriRequest[] = []; // No longer the source of truth for requests


// --- Amapá Municipalities List (Still useful) ---
export const amapaMunicipalities: string[] = [
  "Amapá", "Calçoene", "Cutias", "Ferreira Gomes", "Itaubal",
  "Laranjal do Jari", "Macapá", "Mazagão", "Oiapoque",
  "Pedra Branca do Amaparí", "Porto Grande", "Pracuúba", "Santana",
  "Serra do Navio", "Tartarugalzinho", "Vitória do Jari"
];

// --- Persistence Logic (Commented out as Firebase is the primary store) ---
/*
let R_MOCK_USERS_INITIALIZED = false;
let R_MOCK_REQUESTS_INITIALIZED = false;
const defaultPlaceholderUri = 'https://placehold.co/300x300.png';

const defaultMockUsers: User[] = [
  // Default users are now managed via Firebase Auth and Firestore seeding/creation
];

const defaultMockRequests: AgriRequest[] = [
  // Default requests are now managed via Firestore
];


const loadMockData = () => {
  console.log('[MockData] Attempting to load data from localStorage (legacy).');
  // Load Users
  if (typeof window !== 'undefined' && !R_MOCK_USERS_INITIALIZED) {
    const storedUsers = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
    if (storedUsers) {
      // ... (parsing logic)
    } else {
      // ... (init logic)
    }
    R_MOCK_USERS_INITIALIZED = true;
  }

  // Load Requests
  if (typeof window !== 'undefined' && !R_MOCK_REQUESTS_INITIALIZED) {
    const storedRequests = localStorage.getItem(MOCK_REQUESTS_STORAGE_KEY);
    if (storedRequests) {
      // ... (parsing logic)
    } else {
      // ... (init logic)
    }
    R_MOCK_REQUESTS_INITIALIZED = true;
  }
   console.log('[MockData] Legacy data loading attempt complete.');
};

if (typeof window !== 'undefined') {
  // loadMockData(); // No longer automatically load mock data from localStorage
}


const persistUsers = () => {
  // if (typeof window !== 'undefined') {
  //   localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(mockUsers));
  // }
};

const persistRequests = () => {
  // if (typeof window !== 'undefined') {
  //   localStorage.setItem(MOCK_REQUESTS_STORAGE_KEY, JSON.stringify(mockRequests));
  // }
};


// --- Mutating Functions for Users (Legacy - To be removed or adapted for Firestore if needed elsewhere) ---
export const addMockUser = (newUser: User): User => {
  // This logic should now primarily interact with Firebase Auth & Firestore
  console.warn("[MockData] addMockUser is deprecated. Use Firebase services.");
  return newUser;
};


export const updateUserInMockData = async (userId: string, updatedUserData: Partial<User>): Promise<User | null> => {
  console.warn("[MockData] updateUserInMockData is deprecated. Use Firebase services.");
  return null;
};

export const deleteUserFromMockData = async (userId: string): Promise<boolean> => {
  console.warn("[MockData] deleteUserFromMockData is deprecated. Use Firebase services.");
  return false;
};

// --- Mutating Functions for Requests (Legacy - To be removed or adapted for Firestore) ---
export const addMockRequest = async (newRequestData: Omit<AgriRequest, 'id' | 'submissionDate' | 'status'>): Promise<AgriRequest> => {
  console.warn("[MockData] addMockRequest is deprecated. Use Firebase services.");
  // Dummy implementation to satisfy calls if any remain
  const newRequest: AgriRequest = {
    ...newRequestData,
    id: `mock_req_${Date.now()}`,
    submissionDate: new Date().toISOString(),
    status: 'Pending',
    photoUrls: newRequestData.photoUrls || [defaultPlaceholderUri,defaultPlaceholderUri,defaultPlaceholderUri],
  };
  return newRequest;
};

export const updateMockRequest = async (updatedRequestData: AgriRequest): Promise<AgriRequest | null> => {
  console.warn("[MockData] updateMockRequest is deprecated. Use Firebase services.");
  return updatedRequestData;
};

export const deleteMockRequest = async (requestId: string): Promise<boolean> => {
  console.warn("[MockData] deleteMockRequest is deprecated. Use Firebase services.");
  return false;
};
*/
