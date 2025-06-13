export interface User {
  id: string;
  email: string;
  role: 'farmer' | 'technician';
  name: string;
}

export type RequestStatus = 'Pending' | 'Positive' | 'Negative' | 'Inconclusive';

export interface AgriRequest {
  id: string;
  farmerId: string;
  farmerName: string; // For display convenience
  cassavaType: string;
  photoDataUris: [string, string, string]; // Storing as data URIs for direct use with AI
  status: RequestStatus;
  recommendation?: string;
  submissionDate: string; // ISO date string
  technicianId?: string;
  technicianName?: string; // For display convenience
  responseDate?: string; // ISO date string
  aiSuggestedRecommendation?: string;
}
