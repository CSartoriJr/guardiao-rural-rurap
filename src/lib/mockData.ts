
import type { User, AgriRequest } from '@/types';

const MOCK_USERS_STORAGE_KEY = 'app_mock_users_v2';
const MOCK_REQUESTS_STORAGE_KEY = 'app_mock_requests_v2';

// --- Default Data ---
const defaultMockUsers: User[] = [
  { id: 'farmer1', cpf: '111.111.111-11', role: 'farmer', name: 'João Agricultor', password: 'password123' },
  { id: 'tech1', cpf: '222.222.222-22', role: 'technician', name: 'Alice Técnica', password: 'password123' },
  { id: 'farmer2', cpf: '333.333.333-33', role: 'farmer', name: 'Maria Garcia', password: 'password123' },
  { id: 'farmer3', cpf: '444.444.444-44', role: 'farmer', name: 'Chen Wei', password: 'password123' },
  { id: 'tech2', cpf: '555.555.555-55', role: 'technician', name: 'David Moleiro', password: 'password123' },
  { id: 'tech3', cpf: '666.666.666-66', role: 'technician', name: 'Fátima Khan', password: 'password123' },
  { id: 'farmer4', cpf: '777.777.777-77', role: 'farmer', name: 'Bento Agricultor', password: 'password123' },
  { id: 'tech4', cpf: '888.888.888-88', role: 'technician', name: 'Clara Artesã', password: 'password123' },
  { id: 'farmer5', cpf: '999.999.999-99', role: 'farmer', name: 'Kenji Tanaka', password: 'password123' },
  { id: 'tech5', cpf: '000.000.000-01', role: 'technician', name: 'Isabelle Moreau', password: 'password123' },
  { id: 'farmer6', cpf: '000.000.000-02', role: 'farmer', name: 'Pedro Alvares', password: 'password123' },
  { id: 'farmer7', cpf: '000.000.000-03', role: 'farmer', name: 'Sofia Costa', password: 'password123' },
  { id: 'tech6', cpf: '000.000.000-04', role: 'technician', name: 'Ricardo Neves', password: 'password123' },
  { id: 'tech7', cpf: '000.000.000-05', role: 'technician', name: 'Lúcia Ferreira', password: 'password123' },
  { id: 'admin1', cpf: '000.000.000-00', role: 'admin', name: 'Admin Adicional', password: 'adminpassword' },
  { id: 'farmer8', cpf: '000.000.000-06', role: 'farmer', name: 'Carlos Silva', password: 'password123' },
  { id: 'farmer9', cpf: '000.000.000-07', role: 'farmer', name: 'Ana Pereira', password: 'password123' },
  { id: 'tech8', cpf: '000.000.000-08', role: 'technician', name: 'Roberto Dias', password: 'password123' },
  { id: 'tech9', cpf: '000.000.000-09', role: 'technician', name: 'Juliana Andrade', password: 'password123' },
  { id: 'farmer10', cpf: '101.010.101-01', role: 'farmer', name: 'Lucas Mendes', password: 'password123' },
  { id: 'farmer11', cpf: '111.011.011-01', role: 'farmer', name: 'Beatriz Almeida', password: 'password123' },
  { id: 'tech10', cpf: '121.212.121-21', role: 'technician', name: 'André Sousa', password: 'password123' },
  { id: 'tech11', cpf: '131.313.131-31', role: 'technician', name: 'Camila Santos', password: 'password123' },
  { id: 'farmer12', cpf: '141.414.141-41', role: 'farmer', name: 'Agricultor Novo 1', password: 'password123' },
  { id: 'farmer13', cpf: '151.515.151-51', role: 'farmer', name: 'Agricultora Nova 2', password: 'password123' },
  { id: 'tech12', cpf: '161.616.161-61', role: 'technician', name: 'Técnico Novo 1', password: 'password123' },
  { id: 'tech13', cpf: '171.717.171-71', role: 'technician', name: 'Técnica Nova 2', password: 'password123' },
  { id: 'admin2', cpf: '961.391.452-87', role: 'admin', name: 'Admin Mestre', password: '23jr02cs' },
];

const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const placeholderImage2 = 'https://placehold.co/300x300.png';

const defaultMockRequests: AgriRequest[] = [
  {
    id: 'req1',
    farmerId: 'farmer1',
    farmerName: 'João Agricultor',
    cassavaType: 'TMS 30572',
    isMandioca: true,
    isMacaxeira: false,
    photoDataUris: [placeholderImage, placeholderImage2, placeholderImage],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Macapá',
  },
  {
    id: 'req2',
    farmerId: 'farmer1',
    farmerName: 'João Agricultor',
    cassavaType: 'TME 419',
    isMandioca: false,
    isMacaxeira: true,
    photoDataUris: [placeholderImage2, placeholderImage, placeholderImage],
    status: 'Positive',
    recommendation: 'A planta parece saudável. Continue com as práticas atuais. Monitore para pragas.',
    submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    technicianId: 'tech1',
    technicianName: 'Alice Técnica',
    responseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Santana',
  },
   {
    id: 'req3',
    farmerId: 'farmer2',
    farmerName: 'Maria Garcia',
    cassavaType: 'BRA fortitude',
    isMandioca: true,
    isMacaxeira: true,
    photoDataUris: [placeholderImage, placeholderImage, placeholderImage2],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Laranjal do Jari',
  },
  {
    id: 'req4',
    farmerId: 'farmer4',
    farmerName: 'Bento Agricultor',
    cassavaType: 'IAC 90',
    isMandioca: true,
    isMacaxeira: false,
    photoDataUris: [placeholderImage, placeholderImage2, placeholderImage],
    status: 'Negative',
    recommendation: 'Parece ter a Doença do Mosaico da Mandioca. Recomenda-se remover as plantas infectadas e usar mudas certificadas para plantios futuros.',
    submissionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    technicianId: 'tech2',
    technicianName: 'David Moleiro',
    responseDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Macapá',
  },
  {
    id: 'req5',
    farmerId: 'farmer5',
    farmerName: 'Kenji Tanaka',
    cassavaType: 'BRS Kiriris',
    isMandioca: false,
    isMacaxeira: true,
    photoDataUris: [placeholderImage2, placeholderImage, placeholderImage2],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Oiapoque',
  },
  {
    id: 'req6',
    farmerId: 'farmer6',
    farmerName: 'Pedro Alvares',
    cassavaType: 'BRS Formosa',
    isMandioca: true,
    isMacaxeira: false,
    photoDataUris: [placeholderImage, placeholderImage, placeholderImage],
    status: 'Inconclusive',
    recommendation: 'Os sintomas não são claros. Sugiro monitorar a planta por mais uma semana e, se não houver melhora, enviar novas fotos com detalhes das folhas e do caule.',
    submissionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    technicianId: 'tech6',
    technicianName: 'Ricardo Neves',
    responseDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Mazagão',
  },
  {
    id: 'req7',
    farmerId: 'farmer7',
    farmerName: 'Sofia Costa',
    cassavaType: 'Vassourinha',
    isMandioca: true,
    isMacaxeira: true,
    photoDataUris: [placeholderImage2, placeholderImage2, placeholderImage],
    status: 'Positive',
    recommendation: 'A planta está vigorosa e sem sinais de doença. Continue com o bom trabalho!',
    submissionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    technicianId: 'tech7',
    technicianName: 'Lúcia Ferreira',
    responseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Porto Grande',
  },
  {
    id: 'req8',
    farmerId: 'farmer8',
    farmerName: 'Carlos Silva',
    cassavaType: 'Casca Roxa',
    isMandioca: true,
    isMacaxeira: false,
    photoDataUris: [placeholderImage, placeholderImage, placeholderImage2],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    municipality: 'Pedra Branca do Amapari',
  },
  {
    id: 'req9',
    farmerId: 'farmer9',
    farmerName: 'Ana Pereira',
    cassavaType: 'BRS CS01',
    isMandioca: false,
    isMacaxeira: true,
    photoDataUris: [placeholderImage2, placeholderImage, placeholderImage],
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
export let mockUsers: User[] = []; // Initialize as empty, will be populated by loadMockData

let R_MOCK_REQUESTS_INITIALIZED = false;
export let mockRequests: AgriRequest[] = []; // Initialize as empty, will be populated by loadMockData


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
        const parsedRequests = JSON.parse(storedRequests);
        if (Array.isArray(parsedRequests)) {
          mockRequests = parsedRequests;
          console.log(`[MockData] Successfully parsed ${mockRequests.length} requests from localStorage.`);
        } else {
          console.warn("[MockData] Malformed requests data in localStorage, resetting to default.");
          mockRequests = [...defaultMockRequests];
          localStorage.setItem(MOCK_REQUESTS_STORAGE_KEY, JSON.stringify(mockRequests));
        }
      } catch (e)
      {
        console.error("[MockData] Failed to parse requests from localStorage, resetting to default.", e);
        mockRequests = [...defaultMockRequests];
        localStorage.setItem(MOCK_REQUESTS_STORAGE_KEY, JSON.stringify(mockRequests));
      }
    } else {
      console.log('[MockData] No stored requests found, using default requests and saving to localStorage.');
      mockRequests = [...defaultMockRequests];
      localStorage.setItem(MOCK_REQUESTS_STORAGE_KEY, JSON.stringify(mockRequests));
    }
    R_MOCK_REQUESTS_INITIALIZED = true;
  }
   console.log('[MockData] Data loading complete. Users:', mockUsers.length, 'Requests:', mockRequests.length);
};

// Call loadMockData on script initialization when window is available
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
    localStorage.setItem(MOCK_REQUESTS_STORAGE_KEY, JSON.stringify(mockRequests));
  }
};


// --- Mutating Functions for Users ---
export const addMockUser = (newUser: User): User => {
  if (!R_MOCK_USERS_INITIALIZED) loadMockData(); // Ensure data is loaded
  mockUsers.push(newUser);
  persistUsers();
  console.log('[MockData] Added user:', newUser.id, 'Total users:', mockUsers.length);
  return newUser;
};

export const updateUserInMockData = async (userId: string, updatedUserData: Partial<User>): Promise<User | null> => {
  if (!R_MOCK_USERS_INITIALIZED) loadMockData(); // Ensure data is loaded
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
  if (!R_MOCK_USERS_INITIALIZED) loadMockData(); // Ensure data is loaded
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
  if (!R_MOCK_REQUESTS_INITIALIZED) loadMockData(); // Ensure data is loaded
  const newRequest: AgriRequest = {
    ...newRequestData,
    id: `req${Date.now()}`,
    submissionDate: new Date().toISOString(),
    status: 'Pending',
  };
  mockRequests.unshift(newRequest);
  persistRequests();
  console.log('[MockData] Added request:', newRequest.id, 'Total requests:', mockRequests.length);
  return newRequest;
};

export const updateMockRequest = async (updatedRequestData: AgriRequest): Promise<AgriRequest | null> => {
  if (!R_MOCK_REQUESTS_INITIALIZED) loadMockData(); // Ensure data is loaded
    const index = mockRequests.findIndex(r => r.id === updatedRequestData.id);
    if (index !== -1) {
        // Preserve fields that might not be in updatedRequestData if it's a partial update in some contexts
        mockRequests[index] = { ...mockRequests[index], ...updatedRequestData };
        persistRequests();
        console.log('[MockData] Updated request:', updatedRequestData.id);
        return mockRequests[index];
    }
    console.warn(`[MockData] Update request failed: Request with id ${updatedRequestData.id} not found.`);
    return null;
};


// --- Non-mutating Data ---
export const amapaMunicipalities: string[] = [
  "Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão",
  "Porto Grande", "Tartarugalzinho", "Pedra Branca do Amapari",
  "Vitória do Jari", "Amapá", "Calçoene", "Cutias", "Ferreira Gomes",
  "Itaubal", "Pracuúba", "Serra do Navio"
];

