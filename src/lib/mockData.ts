import type { User, AgriRequest } from '@/types';

export const mockUsers: User[] = [
  { id: 'farmer1', email: 'farmer1@example.com', role: 'farmer', name: 'John Farmer' },
  { id: 'tech1', email: 'tech1@example.com', role: 'technician', name: 'Alice Technician' },
  { id: 'farmer2', email: 'farmer2@example.com', role: 'farmer', name: 'Maria Garcia' },
  { id: 'farmer3', email: 'farmer3@example.com', role: 'farmer', name: 'Chen Wei' },
  { id: 'tech2', email: 'tech2@example.com', role: 'technician', name: 'David Miller' },
  { id: 'tech3', email: 'tech3@example.com', role: 'technician', name: 'Fatima Khan' },
];

// Placeholder data URIs for images (replace with actual placeholders or leave empty if not needed for mock)
const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';


export const mockRequests: AgriRequest[] = [
  {
    id: 'req1',
    farmerId: 'farmer1',
    farmerName: 'John Farmer',
    cassavaType: 'TMS 30572',
    photoDataUris: [placeholderImage, placeholderImage, placeholderImage],
    status: 'Pending',
    submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 'req2',
    farmerId: 'farmer1',
    farmerName: 'John Farmer',
    cassavaType: 'TME 419',
    photoDataUris: [placeholderImage, placeholderImage, placeholderImage],
    status: 'Positive',
    recommendation: 'The plant looks healthy. Continue current practices. Monitor for pests.',
    submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    technicianId: 'tech1',
    technicianName: 'Alice Technician',
    responseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

