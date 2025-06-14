
export interface User {
  id: string;
  cpf: string; // Alterado de email para cpf
  role: 'farmer' | 'technician' | 'admin';
  name: string;
  password?: string; // Senha agora é parte do usuário
}

export type RequestStatus = 'Pending' | 'Positive' | 'Negative' | 'Inconclusive';

export interface AgriRequest {
  id: string;
  farmerId: string;
  farmerName: string; // For display convenience
  cassavaType: string; // This will now be more like "Variety"
  isMandioca?: boolean;
  isMacaxeira?: boolean;
  photoDataUris: [string, string, string]; // Storing as data URIs for direct use with AI
  status: RequestStatus;
  recommendation?: string;
  submissionDate: string; // ISO date string
  technicianId?: string;
  technicianName?: string; // For display convenience
  responseDate?: string; // ISO date string
  aiSuggestedRecommendation?: string;
  municipality?: string;
}

