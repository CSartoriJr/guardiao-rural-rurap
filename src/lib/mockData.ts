
import type { User, AgriRequest } from '@/types';

// CPFs fictícios para demonstração
export let mockUsers: User[] = [
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
  { id: 'admin1', cpf: '000.000.000-00', role: 'admin', name: 'Admin Mestre', password: 'adminpassword' },
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
  { id: 'admin2', cpf: '961.391.452-87', role: 'admin', name: 'Admin Adicional', password: '23jr02cs' },
];

// Function to update a user in the mockUsers array
export const updateUserInMockData = async (userId: string, updatedUserData: Partial<User>): Promise<User | null> => {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return null;
  }

  // Check for CPF uniqueness if CPF is being changed
  if (updatedUserData.cpf) {
    const normalizedNewCpf = updatedUserData.cpf.replace(/\D/g, '');
    const existingUserWithCpf = mockUsers.find(
      u => u.id !== userId && u.cpf.replace(/\D/g, '') === normalizedNewCpf
    );
    if (existingUserWithCpf) {
      throw new Error("Este CPF já está cadastrado para outro usuário.");
    }
  }
  
  mockUsers[userIndex] = { ...mockUsers[userIndex], ...updatedUserData };
  return mockUsers[userIndex];
};

// Function to delete a user from the mockUsers array
export const deleteUserFromMockData = async (userId: string): Promise<boolean> => {
  const initialLength = mockUsers.length;
  mockUsers = mockUsers.filter(u => u.id !== userId);
  return mockUsers.length < initialLength;
};


// Placeholder data URIs for images (replace with actual placeholders or leave empty if not needed for mock)
const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const placeholderImage2 = 'https://placehold.co/300x300.png';


export const amapaMunicipalities: string[] = [
  "Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão",
  "Porto Grande", "Tartarugalzinho", "Pedra Branca do Amapari",
  "Vitória do Jari", "Amapá", "Calçoene", "Cutias", "Ferreira Gomes",
  "Itaubal", "Pracuúba", "Serra do Navio"
];

export let mockRequests: AgriRequest[] = [
  {
    id: 'req1',
    farmerId: 'farmer1',
    farmerName: 'João Agricultor',
    cassavaType: 'TMS 30572',
    photoDataUris: [placeholderImage, placeholderImage2, placeholderImage],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    municipality: 'Macapá',
  },
  {
    id: 'req2',
    farmerId: 'farmer1',
    farmerName: 'João Agricultor',
    cassavaType: 'TME 419',
    photoDataUris: [placeholderImage2, placeholderImage, placeholderImage],
    status: 'Positive',
    recommendation: 'A planta parece saudável. Continue com as práticas atuais. Monitore para pragas.',
    submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
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
    photoDataUris: [placeholderImage, placeholderImage, placeholderImage2],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    municipality: 'Laranjal do Jari',
  },
  {
    id: 'req4',
    farmerId: 'farmer4',
    farmerName: 'Bento Agricultor',
    cassavaType: 'IAC 90',
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
