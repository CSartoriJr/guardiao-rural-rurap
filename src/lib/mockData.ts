
import type { User, AgriRequest } from '@/types';

const MOCK_USERS_STORAGE_KEY = 'app_mock_users_v2';
const MOCK_REQUESTS_STORAGE_KEY = 'app_mock_requests_v2';

// --- Default Data ---
const defaultMockUsers: User[] = [
  { id: 'farmer1', cpf: '111.111.111-11', role: 'farmer', name: 'João Agricultor', password: 'password123', email: 'joao@example.com', phone: '(96)99999-1111', address: 'Rua das Palmeiras, 123', municipality: 'Macapá', familyMembers: 4 },
  { id: 'tech1', cpf: '222.222.222-22', role: 'technician', name: 'Alice Técnica', password: 'password123' },
  { id: 'farmer2', cpf: '333.333.333-33', role: 'farmer', name: 'Maria Garcia', password: 'password123', email: 'maria@example.com', phone: '(96)98888-2222', address: 'Av. Beira Rio, 456', municipality: 'Santana', familyMembers: 3 },
  { id: 'farmer3', cpf: '444.444.444-44', role: 'farmer', name: 'Chen Wei', password: 'password123', email: 'chen@example.com', phone: '(96)97777-3333', address: 'Travessa das Acácias, 789', municipality: 'Macapá', familyMembers: 5 },
  { id: 'tech2', cpf: '555.555.555-55', role: 'technician', name: 'David Moleiro', password: 'password123' },
  { id: 'tech3', cpf: '666.666.666-66', role: 'technician', name: 'Fátima Khan', password: 'password123' },
  { id: 'farmer4', cpf: '777.777.777-77', role: 'farmer', name: 'Bento Agricultor', password: 'password123', email: 'bento@example.com', phone: '(96)96666-4444', address: 'Estrada Principal, S/N', municipality: 'Mazagão', familyMembers: 2 },
  { id: 'tech4', cpf: '888.888.888-88', role: 'technician', name: 'Clara Artesã', password: 'password123' },
  { id: 'farmer5', cpf: '999.999.999-99', role: 'farmer', name: 'Kenji Tanaka', password: 'password123', email: 'kenji@example.com', phone: '(96)95555-5555', address: 'Alameda dos Ipes, 321', municipality: 'Oiapoque', familyMembers: 1 },
  { id: 'tech5', cpf: '000.000.000-01', role: 'technician', name: 'Isabelle Moreau', password: 'password123' },
  { id: 'farmer6', cpf: '000.000.000-02', role: 'farmer', name: 'Pedro Alvares', password: 'password123', email: 'pedro@example.com', phone: '(96)94444-6666', address: 'Rua da Colina, 987', municipality: 'Porto Grande', familyMembers: 6 },
  { id: 'farmer7', cpf: '000.000.000-03', role: 'farmer', name: 'Sofia Costa', password: 'password123', email: 'sofia@example.com', phone: '(96)93333-7777', address: 'Vila Esperança, 654', municipality: 'Laranjal do Jari', familyMembers: 3 },
  { id: 'tech6', cpf: '000.000.000-04', role: 'technician', name: 'Ricardo Neves', password: 'password123' },
  { id: 'tech7', cpf: '000.000.000-05', role: 'technician', name: 'Lúcia Ferreira', password: 'password123' },
  { id: 'admin1', cpf: '000.000.000-00', role: 'admin', name: 'Admin Adicional', password: 'adminpassword' },
  { id: 'farmer8', cpf: '000.000.000-06', role: 'farmer', name: 'Carlos Silva', password: 'password123', email: 'carlos@example.com', phone: '(96)92222-8888', address: 'Comunidade Rio Verde', municipality: 'Pedra Branca do Amaparí', familyMembers: 4 },
  { id: 'farmer9', cpf: '000.000.000-07', role: 'farmer', name: 'Ana Pereira', password: 'password123', email: 'ana@example.com', phone: '(96)91111-9999', address: 'Bairro Novo, 101', municipality: 'Vitória do Jari', familyMembers: 2 },
  { id: 'tech8', cpf: '000.000.000-08', role: 'technician', name: 'Roberto Dias', password: 'password123' },
  { id: 'tech9', cpf: '000.000.000-09', role: 'technician', name: 'Juliana Andrade', password: 'password123' },
  { id: 'farmer10', cpf: '101.010.101-01', role: 'farmer', name: 'Lucas Mendes', password: 'password123', email: 'lucas@example.com', phone: '(96)90000-1010', address: 'Centro, Sala 10', municipality: 'Amapá', familyMembers: 1 },
  { id: 'farmer11', cpf: '111.011.011-01', role: 'farmer', name: 'Beatriz Almeida', password: 'password123', email: 'beatriz@example.com', phone: '(96)91234-1101', address: 'Residencial Sol Nascente, Bloco A', municipality: 'Calçoene', familyMembers: 3 },
  { id: 'tech10', cpf: '121.212.121-21', role: 'technician', name: 'André Sousa', password: 'password123' },
  { id: 'tech11', cpf: '131.313.131-31', role: 'technician', name: 'Camila Santos', password: 'password123' },
  { id: 'farmer12', cpf: '141.414.141-41', role: 'farmer', name: 'Agricultor Novo 1', password: 'password123', email: 'novo1@example.com', phone: '(96)95678-1414', address: 'Sitio Boa Vista', municipality: 'Cutias', familyMembers: 5 },
  { id: 'farmer13', cpf: '151.515.151-51', role: 'farmer', name: 'Agricultora Nova 2', password: 'password123', email: 'nova2@example.com', phone: '(96)98765-1515', address: 'Fazenda Alegria', municipality: 'Ferreira Gomes', familyMembers: 2 },
  { id: 'tech12', cpf: '161.616.161-61', role: 'technician', name: 'Técnico Novo 1', password: 'password123' },
  { id: 'tech13', cpf: '171.717.171-71', role: 'technician', name: 'Técnica Nova 2', password: 'password123' },
  { id: 'admin2', cpf: '961.391.452-87', role: 'admin', name: 'Admin Mestre', password: '23jr02cs' },
];

const VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // 1x1 black pixel gif
const placeholderImage2 = 'https://placehold.co/300x300.png';


const defaultMockRequests: AgriRequest[] = [
  {
    id: 'req1',
    farmerId: 'farmer1',
    farmerName: 'João Agricultor',
    cassavaType: 'TMS 30572',
    isMandioca: true,
    isMacaxeira: false,
    photoDataUris: [VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, placeholderImage2, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Macapá',
    plantedArea: 10,
    infectedArea: 1,
    latitude: 0.0349,
    longitude: -51.0694,
  },
  {
    id: 'req2',
    farmerId: 'farmer1',
    farmerName: 'João Agricultor',
    cassavaType: 'TME 419',
    isMandioca: false,
    isMacaxeira: true,
    photoDataUris: [placeholderImage2, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI],
    status: 'Positive',
    recommendation: 'A planta parece saudável. Continue com as práticas atuais. Monitore para pragas.',
    submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    technicianId: 'tech1',
    technicianName: 'Alice Técnica',
    responseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Santana',
    plantedArea: 5,
  },
   {
    id: 'req3',
    farmerId: 'farmer2',
    farmerName: 'Maria Garcia',
    cassavaType: 'BRA fortitude',
    isMandioca: true,
    isMacaxeira: true,
    photoDataUris: [VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, placeholderImage2],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Laranjal do Jari',
    infectedArea: 0.5,
    latitude: -0.5000,
    longitude: -52.5167,
  },
  {
    id: 'req4',
    farmerId: 'farmer4',
    farmerName: 'Bento Agricultor',
    cassavaType: 'IAC 90',
    isMandioca: true,
    isMacaxeira: false,
    photoDataUris: [VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, placeholderImage2, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI],
    status: 'Negative',
    recommendation: 'Parece ter a Doença do Mosaico da Mandioca. Recomenda-se remover as plantas infectadas e usar mudas certificadas para plantios futuros.',
    submissionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    technicianId: 'tech2',
    technicianName: 'David Moleiro',
    responseDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Macapá',
    plantedArea: 20,
    infectedArea: 8,
  },
  {
    id: 'req5',
    farmerId: 'farmer5',
    farmerName: 'Kenji Tanaka',
    cassavaType: 'BRS Kiriris',
    isMandioca: false,
    isMacaxeira: true,
    photoDataUris: [placeholderImage2, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, placeholderImage2],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Oiapoque',
    latitude: 3.8439,
    longitude: -51.8339,
  },
  {
    id: 'req6',
    farmerId: 'farmer6',
    farmerName: 'Pedro Alvares',
    cassavaType: 'BRS Formosa',
    isMandioca: true,
    isMacaxeira: false,
    photoDataUris: [VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI],
    status: 'Inconclusive',
    recommendation: 'Os sintomas não são claros. Sugiro monitorar a planta por mais uma semana e, se não houver melhora, enviar novas fotos com detalhes das folhas e do caule.',
    submissionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    technicianId: 'tech6',
    technicianName: 'Ricardo Neves',
    responseDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Mazagão',
    plantedArea: 12.5,
    infectedArea: 0,
  },
  {
    id: 'req7',
    farmerId: 'farmer7',
    farmerName: 'Sofia Costa',
    cassavaType: 'Vassourinha',
    isMandioca: true,
    isMacaxeira: true,
    photoDataUris: [placeholderImage2, placeholderImage2, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI],
    status: 'Positive',
    recommendation: 'A planta está vigorosa e sem sinais de doença. Continue com o bom trabalho!',
    submissionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    technicianId: 'tech7',
    technicianName: 'Lúcia Ferreira',
    responseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Porto Grande',
    plantedArea: 3,
  },
  {
    id: 'req8',
    farmerId: 'farmer8',
    farmerName: 'Carlos Silva',
    cassavaType: 'Casca Roxa',
    isMandioca: true,
    isMacaxeira: false,
    photoDataUris: [VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, placeholderImage2],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Pedra Branca do Amaparí',
    plantedArea: 7,
    infectedArea: 2.5,
    latitude: 0.7716,
    longitude: -51.9502,
  },
  {
    id: 'req9',
    farmerId: 'farmer9',
    farmerName: 'Ana Pereira',
    cassavaType: 'BRS CS01',
    isMandioca: false,
    isMacaxeira: true,
    photoDataUris: [placeholderImage2, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI],
    status: 'Negative',
    recommendation: 'A planta exibe sinais de deficiência de nutrientes, especificamente nitrogênio. Recomenda-se aplicar um fertilizante rico em nitrogênio.',
    submissionDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    technicianId: 'tech8',
    technicianName: 'Roberto Dias',
    responseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Vitória do Jari',
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
    if (storedRequests) {
      console.log('[MockData] Found stored requests in localStorage.');
      try {
        const parsedRequests = JSON.parse(storedRequests) as AgriRequest[]; // Assume they are AgriRequest[]
        if (Array.isArray(parsedRequests)) {
          // When loading, ensure photoDataUris are valid, especially if they were stored as placeholders.
          // For this mock, we'll just load them. A more robust system might re-validate or transform.
           mockRequests = parsedRequests.map(req => ({
            ...req,
            // Ensure photoDataUris is always an array of 3 strings, falling back to small placeholder if needed
            photoDataUris: (
              Array.isArray(req.photoDataUris) && req.photoDataUris.length === 3
              ? req.photoDataUris
              : [VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI]
            ) as [string, string, string] // Cast to tuple
          }));
          console.log(`[MockData] Successfully parsed and mapped ${mockRequests.length} requests from localStorage.`);
        } else {
          console.warn("[MockData] Malformed requests data in localStorage, resetting to default.");
          mockRequests = [...defaultMockRequests];
          localStorage.setItem(MOCK_REQUESTS_STORAGE_KEY, JSON.stringify(defaultMockRequests));
        }
      } catch (e)
      {
        console.error("[MockData] Failed to parse requests from localStorage, resetting to default.", e);
        mockRequests = [...defaultMockRequests];
        localStorage.setItem(MOCK_REQUESTS_STORAGE_KEY, JSON.stringify(defaultMockRequests));
      }
    } else {
      console.log('[MockData] No stored requests found, using default requests and saving to localStorage.');
      mockRequests = [...defaultMockRequests];
      localStorage.setItem(MOCK_REQUESTS_STORAGE_KEY, JSON.stringify(defaultMockRequests));
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
    // Create a version of requests suitable for localStorage to avoid quota issues.
    const requestsToStore = mockRequests.map(req => {
      const sanitizedPhotoUris = (req.photoDataUris || []).map(uri => {
        // If URI is a long base64 string, replace it. Keep URLs or short data URIs.
        if (typeof uri === 'string' && uri.startsWith('data:image') && uri.length > 256) { // 256 chars is an arbitrary threshold
          return VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI;
        }
        return uri;
      }) as [string, string, string]; // Ensure it's a tuple

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
      // Potentially, clear localStorage or part of it if quota is still an issue with sanitized data
      // For now, just log the error. A more robust app might try other strategies.
    }
  }
};


// --- Mutating Functions for Users ---
export const addMockUser = (newUser: User): User => {
  if (!R_MOCK_USERS_INITIALIZED) loadMockData();
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
    // Ensure photoDataUris is correctly typed as a tuple if newRequestData provides it
    photoDataUris: (newRequestData.photoDataUris 
        ? newRequestData.photoDataUris 
        : [VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI]) as [string, string, string],
  };
  mockRequests.unshift(newRequest); // Add to the beginning of the array (in-memory full data)
  persistRequests(); // This will save the sanitized version to localStorage
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
        persistRequests(); // Persist sanitized version
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
    persistRequests(); // Persist after deletion
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

// Ensure that all default mock requests also use the small placeholder for long data URIs or valid URLs
defaultMockRequests.forEach(req => {
  req.photoDataUris = (req.photoDataUris || [VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI, VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI]).map(uri => {
    if (typeof uri === 'string' && uri.startsWith('data:image') && uri.length > 256) {
      return VERY_SMALL_PLACEHOLDER_IMAGE_DATA_URI;
    }
    return uri;
  }) as [string, string, string];
});


  