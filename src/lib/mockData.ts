
import type { User, AgriRequest } from '@/types';

const MOCK_USERS_STORAGE_KEY = 'app_mock_users_v2';
const MOCK_REQUESTS_STORAGE_KEY = 'app_mock_requests_v2';

// --- Default Data ---
const VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
const placeholderImage2 = 'https://placehold.co/300x300.png';

const defaultMockUsers: User[] = [
  { id: 'admin_master', cpf: '961.391.452-87', role: 'admin', name: 'Claudemir Sartori Junior', password: '23jr02cs' },
  { id: 'tech_claudia_sartori', cpf: '291.751.862-68', role: 'technician', name: 'Claudia Sartori', password: 'senha123' },
  { id: 'farmer_joao_silva', cpf: '141.414.141-41', role: 'farmer', name: 'Agricultor Novo 1', password: 'password123', email: 'joao.silva@example.com', phone: '(96)99999-1111', address: 'Rua das Palmeiras, 123', municipality: 'Macapá', familyMembers: 4 },
];

const defaultMockRequests: AgriRequest[] = [
  {
    id: 'req_joao_1_new',
    farmerId: 'farmer_joao_silva',
    farmerName: 'Agricultor Novo 1',
    cassavaType: 'BRS Formosa',
    isMandioca: true,
    isMacaxeira: false,
    photoDataUris: [VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, placeholderImage2, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Macapá',
    plantedArea: 5,
    infectedArea: 1,
    latitude: 0.038,
    longitude: -51.05,
    deviceLocationStatus: 'success',
  },
  {
    id: 'req_joao_2_new',
    farmerId: 'farmer_joao_silva',
    farmerName: 'Agricultor Novo 1',
    cassavaType: 'Vassourinha',
    isMandioca: false,
    isMacaxeira: true,
    photoDataUris: [placeholderImage2, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI],
    status: 'Positive',
    recommendation: 'Planta parece saudável. Continue com as boas práticas de manejo.',
    submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    technicianId: 'tech_claudia_sartori',
    technicianName: 'Claudia Sartori',
    responseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Santana',
    plantedArea: 2,
    latitude: 0.0588,
    longitude: -51.1782,
    deviceLocationStatus: 'success',
    // aiSuggestedRecommendation field removed from here
  },
];

// --- Initialization and Persistence Logic ---
let R_MOCK_USERS_INITIALIZED = false;
export let mockUsers: User[] = [];

let R_MOCK_REQUESTS_INITIALIZED = false;
export let mockRequests: AgriRequest[] = [];


const loadMockData = () => {
  console.log('[MockData] Attempting to load data from localStorage.');
  // Load Users
  if (typeof window !== 'undefined' && !R_MOCK_USERS_INITIALIZED) {
    console.log('[MockData] Initializing users.');
    const storedUsers = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
    if (storedUsers) {
      console.log('[MockData] Found stored users in localStorage.');
      try {
        const parsedUsers = JSON.parse(storedUsers);
        if (Array.isArray(parsedUsers)) {
          mockUsers = parsedUsers;
          console.log(`[MockData] Successfully parsed ${mockUsers.length} users from localStorage.`);
        } else {
          console.warn("[MockData] Malformed users data in localStorage, resetting to default.");
          mockUsers = [...defaultMockUsers];
          localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(mockUsers));
        }
      } catch (e) {
        console.error("[MockData] Failed to parse users from localStorage, resetting to default.", e);
        mockUsers = [...defaultMockUsers];
        localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(mockUsers));
      }
    } else {
      console.log('[MockData] No stored users found, using default users and saving to localStorage.');
      mockUsers = [...defaultMockUsers];
      localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(mockUsers));
    }
    R_MOCK_USERS_INITIALIZED = true;
  }

  // Load Requests
  if (typeof window !== 'undefined' && !R_MOCK_REQUESTS_INITIALIZED) {
    console.log('[MockData] Initializing requests.');
    const storedRequests = localStorage.getItem(MOCK_REQUESTS_STORAGE_KEY);
    let dataLoadedFromStorage = false;

    if (storedRequests) {
      console.log('[MockData] Found stored requests in localStorage.');
      try {
        const parsedRequests = JSON.parse(storedRequests) as AgriRequest[];
        if (Array.isArray(parsedRequests)) {
           mockRequests = parsedRequests.map(req => ({
            ...req,
            photoDataUris: (
              Array.isArray(req.photoDataUris) && req.photoDataUris.length === 3
              ? req.photoDataUris
              : [VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI]
            ) as [string, string, string]
          }));
          dataLoadedFromStorage = true;
          console.log(`[MockData] Successfully parsed and mapped ${mockRequests.length} requests from localStorage.`);
        } else {
          console.warn("[MockData] Malformed requests data in localStorage, resetting to default.");
          mockRequests = [...defaultMockRequests]; 
        }
      } catch (e) {
        console.error("[MockData] Failed to parse requests from localStorage, resetting to default.", e);
        mockRequests = [...defaultMockRequests];
      }
    } else {
      console.log('[MockData] No stored requests found, using default requests.');
      mockRequests = [...defaultMockRequests];
    }

    // Persist changes if no data was in storage initially (so defaults were loaded and should be persisted).
    if (!storedRequests) {
      console.log('[MockData] Persisting requests to localStorage after initial load from defaults.');
      const requestsToStore = mockRequests.map(req => {
        const sanitizedPhotoUris = (req.photoDataUris || []).map(uri => {
          if (typeof uri === 'string' && uri.startsWith('data:image') && uri.length > 256) {
            return VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI;
          }
          return uri;
        }) as [string, string, string];
        return { ...req, photoDataUris: sanitizedPhotoUris };
      });
      try {
        localStorage.setItem(MOCK_REQUESTS_STORAGE_KEY, JSON.stringify(requestsToStore));
        console.log('[MockData] Successfully persisted initialized requests from defaults.');
      } catch (error) {
        console.error('[MockData] Error persisting requests to localStorage:', error);
      }
    }
    R_MOCK_REQUESTS_INITIALIZED = true;
  }
   console.log('[MockData] Data loading complete. Users:', mockUsers.length, 'Requests:', mockRequests.length);
};

if (typeof window !== 'undefined') {
  loadMockData();
}


const persistUsers = () => {
  if (typeof window !== 'undefined') {
    console.log('[MockData] Persisting users to localStorage:', mockUsers.length);
    localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(mockUsers));
  }
};

const persistRequests = () => {
  if (typeof window !== 'undefined') {
    console.log('[MockData] Persisting requests to localStorage:', mockRequests.length);
    const requestsToStore = mockRequests.map(req => {
      const sanitizedPhotoUris = (req.photoDataUris || []).map(uri => {
        if (typeof uri === 'string' && uri.startsWith('data:image') && uri.length > 256) {
          return VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI;
        }
        return uri;
      }) as [string, string, string];

      return {
        ...req,
        photoDataUris: sanitizedPhotoUris,
      };
    });
    try {
      localStorage.setItem(MOCK_REQUESTS_STORAGE_KEY, JSON.stringify(requestsToStore));
      console.log('[MockData] Successfully persisted sanitized requests.');
    } catch (error) {
      console.error('[MockData] Error persisting requests to localStorage:', error);
    }
  }
};


// --- Mutating Functions for Users ---
export const addMockUser = (newUser: User): User => {
  if (!R_MOCK_USERS_INITIALIZED) loadMockData(); // Ensure data is loaded
  // Check if user with this CPF already exists to prevent duplicates
  const existingUser = mockUsers.find(u => u.cpf.replace(/\D/g, '') === newUser.cpf.replace(/\D/g, ''));
  if (existingUser) {
    console.warn('[MockData] Add user failed: User with this CPF already exists', newUser.cpf);
    // Optionally, throw an error or return the existing user, or handle as per app logic
    // For now, let's prevent adding and return the existing one or throw an error.
    // throw new Error("Usuário com este CPF já existe.");
    return existingUser; // Or null, or throw error
  }
  mockUsers.push(newUser);
  persistUsers();
  console.log('[MockData] Added user:', newUser.id, 'Total users:', mockUsers.length);
  return newUser;
};


export const updateUserInMockData = async (userId: string, updatedUserData: Partial<User>): Promise<User | null> => {
  if (!R_MOCK_USERS_INITIALIZED) loadMockData();
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    console.warn('[MockData] Update failed: User not found', userId);
    return null;
  }

  if (updatedUserData.cpf) {
    const normalizedNewCpf = updatedUserData.cpf.replace(/\D/g, '');
    const existingUserWithCpf = mockUsers.find(
      u => u.id !== userId && u.cpf.replace(/\D/g, '') === normalizedNewCpf
    );
    if (existingUserWithCpf) {
      console.error('[MockData] Update failed: CPF already exists', updatedUserData.cpf);
      throw new Error("Este CPF já está cadastrado para outro usuário.");
    }
  }

  mockUsers[userIndex] = { ...mockUsers[userIndex], ...updatedUserData };
  persistUsers();
  console.log('[MockData] Updated user:', userId);
  return mockUsers[userIndex];
};

export const deleteUserFromMockData = async (userId: string): Promise<boolean> => {
  if (!R_MOCK_USERS_INITIALIZED) loadMockData();
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    mockUsers.splice(userIndex, 1);
    persistUsers();
    console.log('[MockData] Deleted user:', userId, 'Remaining users:', mockUsers.length);
    return true;
  }
  console.warn('[MockData] Delete failed: User not found', userId);
  return false;
};

// --- Mutating Functions for Requests ---
export const addMockRequest = async (newRequestData: Omit<AgriRequest, 'id' | 'submissionDate' | 'status'>): Promise<AgriRequest> => {
  if (!R_MOCK_REQUESTS_INITIALIZED) loadMockData();
  const newRequest: AgriRequest = {
    ...newRequestData,
    id: `req${Date.now()}`,
    submissionDate: new Date().toISOString(),
    status: 'Pending',
    photoDataUris: (newRequestData.photoDataUris
        ? newRequestData.photoDataUris
        : [VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI]) as [string, string, string],
  };
  mockRequests.unshift(newRequest);
  persistRequests();
  console.log('[MockData] Added request:', newRequest.id, 'Total requests:', mockRequests.length);
  return newRequest;
};

export const updateMockRequest = async (updatedRequestData: AgriRequest): Promise<AgriRequest | null> => {
  if (!R_MOCK_REQUESTS_INITIALIZED) loadMockData();
    const index = mockRequests.findIndex(r => r.id === updatedRequestData.id);
    if (index !== -1) {
        mockRequests[index] = {
          ...mockRequests[index],
          ...updatedRequestData,
          photoDataUris: (updatedRequestData.photoDataUris
            ? updatedRequestData.photoDataUris
            : [VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI]) as [string, string, string],
        };
        persistRequests();
        console.log('[MockData] Updated request:', updatedRequestData.id);
        return mockRequests[index];
    }
    console.warn(`[MockData] Update request failed: Request with id ${updatedRequestData.id} not found.`);
    return null;
};

export const deleteMockRequest = async (requestId: string): Promise<boolean> => {
  if (!R_MOCK_REQUESTS_INITIALIZED) loadMockData();
  const initialLength = mockRequests.length;
  mockRequests = mockRequests.filter(req => req.id !== requestId);
  if (mockRequests.length < initialLength) {
    persistRequests();
    console.log('[MockData] Deleted request:', requestId, 'Remaining requests:', mockRequests.length);
    return true;
  }
  console.warn('[MockData] Delete failed: Request not found', requestId);
  return false;
};


// --- Non-mutating Data ---
export const amapaMunicipalities: string[] = [
  "Amapá", "Calçoene", "Cutias", "Ferreira Gomes", "Itaubal",
  "Laranjal do Jari", "Macapá", "Mazagão", "Oiapoque",
  "Pedra Branca do Amaparí", "Porto Grande", "Pracuúba", "Santana",
  "Serra do Navio", "Tartarugalzinho", "Vitória do Jari"
];

defaultMockRequests.forEach(req => {
  // Ensure photoDataUris are always an array of 3 strings
  const currentPhotos = Array.isArray(req.photoDataUris) ? req.photoDataUris : [];
  const photos: [string, string, string] = [
    currentPhotos[0] || VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI,
    currentPhotos[1] || VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI,
    currentPhotos[2] || VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI,
  ];
  req.photoDataUris = photos.map(uri => {
    if (typeof uri === 'string' && uri.startsWith('data:image') && uri.length > 256) {
      return VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI;
    }
    return uri;
  }) as [string, string, string];
});
