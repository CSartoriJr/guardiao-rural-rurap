import type { User, AgriRequest } from '@/types';

export const mockUsers: User[] = [
  { id: 'farmer1', email: 'farmer1@example.com', role: 'farmer', name: 'João Agricultor' },
  { id: 'tech1', email: 'tech1@example.com', role: 'technician', name: 'Alice Técnica' },
  { id: 'farmer2', email: 'farmer2@example.com', role: 'farmer', name: 'Maria Garcia' },
  { id: 'farmer3', email: 'farmer3@example.com', role: 'farmer', name: 'Chen Wei' },
  { id: 'tech2', email: 'tech2@example.com', role: 'technician', name: 'David Moleiro' },
  { id: 'tech3', email: 'tech3@example.com', role: 'technician', name: 'Fátima Khan' },
  { id: 'farmer4', email: 'farmer4@example.com', role: 'farmer', name: 'Bento Agricultor' },
  { id: 'tech4', email: 'tech4@example.com', role: 'technician', name: 'Clara Artesã' },
  { id: 'farmer5', email: 'farmer5@example.com', role: 'farmer', name: 'Kenji Tanaka' },
  { id: 'tech5', email: 'tech5@example.com', role: 'technician', name: 'Isabelle Moreau' },
];

// Placeholder data URIs for images (replace with actual placeholders or leave empty if not needed for mock)
const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';


export const mockRequests: AgriRequest[] = [
  {
    id: 'req1',
    farmerId: 'farmer1',
    farmerName: 'João Agricultor',
    cassavaType: 'TMS 30572',
    photoDataUris: [placeholderImage, placeholderImage, placeholderImage],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 'req2',
    farmerId: 'farmer1',
    farmerName: 'João Agricultor',
    cassavaType: 'TME 419',
    photoDataUris: [placeholderImage, placeholderImage, placeholderImage],
    status: 'Positive',
    recommendation: 'The plant looks healthy. Continue current practices. Monitor for pests.', // Kept in English for simplicity
    submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    technicianId: 'tech1',
    technicianName: 'Alice Técnica',
    responseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
   {
    id: 'req3',
    farmerId: 'farmer2',
    farmerName: 'Maria Garcia',
    cassavaType: 'BRA fortitude',
    photoDataUris: [placeholderImage, placeholderImage, placeholderImage],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: 'req4',
    farmerId: 'farmer4',
    farmerName: 'Bento Agricultor',
    cassavaType: 'IAC 90',
    photoDataUris: [placeholderImage, placeholderImage, placeholderImage],
    status: 'Negative',
    recommendation: 'Appears to have Cassava Mosaic Disease. Recommend removing infected plants and using certified cuttings for future planting.', // Kept in English
    submissionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    technicianId: 'tech2',
    technicianName: 'David Moleiro',
    responseDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
