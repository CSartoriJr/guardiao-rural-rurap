

export interface User {
  id: string; // Firebase Auth UID
  cpf: string;
  role: 'farmer' | 'technician' | 'admin';
  name: string;
  email?: string; // Firebase Auth uses email, so we'll store the actual email or a dummy one if CPF is used for auth.
  password?: string; // Only used for initial creation/reset, not stored directly in Firestore if using Firebase Auth.

  // Fields specific to farmer role, stored in Firestore document
  phone?: string;
  address?: string;
  municipality?: string;
  familyMembers?: number;
}

export type RequestStatus = 'Pending' | 'Positive' | 'Negative' | 'Inconclusive';
export type DeviceLocationStatus = 'idle' | 'fetching' | 'success' | 'error' | 'denied' | 'unavailable' | 'timeout' | 'unsupported';


export interface AgriRequest {
  id: string; // Firestore document ID
  farmerId: string; // Firebase Auth UID of the farmer
  farmerName: string;
  cassavaType: string;
  isMandioca?: boolean;
  isMacaxeira?: boolean;
  photoUrls: [string, string, string]; // URLs from Firebase Storage
  status: RequestStatus;
  recommendation?: string;
  submissionDate: string; // ISO date string (from Firestore Timestamp)
  technicianId?: string; // Firebase Auth UID of the technician
  technicianName?: string;
  responseDate?: string; // ISO date string (from Firestore Timestamp)
  // aiSuggestedRecommendation is removed as per previous cleanup
  municipality?: string;
  plantedArea?: number;
  infectedArea?: number;
  latitude?: number;
  longitude?: number;
  deviceLocationStatus?: DeviceLocationStatus;

  // Fields used by generateRecommendation AI flow, kept for consistency
  // but photoDataUris will be photoUrls from Storage when calling the flow.
  // These specific fields might not be directly stored in Firestore if photoUrls cover them.
  photoDataUri1?: string;
  photoDataUri2?: string;
  photoDataUri3?: string;
}

