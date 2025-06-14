
import type { User, AgriRequest } from '@/types';

export let mockUsers: User[] = [
  { id: 'farmer1', email: 'agricultor1@example.com', role: 'farmer', name: 'João Agricultor' },
  { id: 'tech1', email: 'tecnico1@example.com', role: 'technician', name: 'Alice Técnica' },
  { id: 'farmer2', email: 'agricultora2@example.com', role: 'farmer', name: 'Maria Garcia' },
  { id: 'farmer3', email: 'agricultor3@example.com', role: 'farmer', name: 'Chen Wei' },
  { id: 'tech2', email: 'tecnico2@example.com', role: 'technician', name: 'David Moleiro' },
  { id: 'tech3', email: 'tecnica3@example.com', role: 'technician', name: 'Fátima Khan' },
  { id: 'farmer4', email: 'agricultor4@example.com', role: 'farmer', name: 'Bento Agricultor' },
  { id: 'tech4', email: 'tecnica4@example.com', role: 'technician', name: 'Clara Artesã' },
  { id: 'farmer5', email: 'agricultor5@example.com', role: 'farmer', name: 'Kenji Tanaka' },
  { id: 'tech5', email: 'tecnica5@example.com', role: 'technician', name: 'Isabelle Moreau' },
  { id: 'farmer6', email: 'agricultor6@example.com', role: 'farmer', name: 'Pedro Alvares' },
  { id: 'farmer7', email: 'agricultora7@example.com', role: 'farmer', name: 'Sofia Costa' },
  { id: 'tech6', email: 'tecnico6@example.com', role: 'technician', name: 'Ricardo Neves' },
  { id: 'tech7', email: 'tecnica7@example.com', role: 'technician', name: 'Lúcia Ferreira' },
  { id: 'admin1', email: 'admin@example.com', role: 'admin', name: 'Admin Mestre' },
  { id: 'farmer8', email: 'agricultor8@example.com', role: 'farmer', name: 'Carlos Silva' },
  { id: 'farmer9', email: 'agricultora9@example.com', role: 'farmer', name: 'Ana Pereira' },
  { id: 'tech8', email: 'tecnico8@example.com', role: 'technician', name: 'Roberto Dias' },
  { id: 'tech9', email: 'tecnica9@example.com', role: 'technician', name: 'Juliana Andrade' },
];

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
