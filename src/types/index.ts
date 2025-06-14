
export interface User {
  id: string;
  cpf: string; // Alterado de email para cpf
  role: 'farmer' | 'technician' | 'admin';
  name: string;
  password?: string; // Senha agora é parte do usuário

  // Fields specific to farmer role, added during registration
  phone?: string;
  email?: string;
  address?: string;
  municipality?: string;
  familyMembers?: number;
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
  municipality?: string; // Municipality of the request, might be different from farmer's registration
  plantedArea?: number; // Área plantada em hectares
  infectedArea?: number; // Área infectada em hectares
  latitude?: number; // Latitude from panoramic image
  longitude?: number; // Longitude from panoramic image
}
