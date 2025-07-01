

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

  // Fields specific to technician role
  assignedMunicipalities?: string[];
}

export type RequestStatus = 'Pending' | 'Positive' | 'Negative' | 'Inconclusive';
export type DeviceLocationStatus = 'idle' | 'fetching' | 'success' | 'error' | 'denied' | 'unavailable' | 'timeout' | 'unsupported';


export interface AgriRequest {
  id: string; // Firestore document ID
  farmerId: string; // Firebase Auth UID of the farmer
  farmerName: string;
  mandiocaVariety?: string;
  macaxeiraVariety?: string;
  isMandioca?: boolean;
  isMacaxeira?: boolean;
  photoUrls: [string, string, string]; // URLs from Firebase Storage
  status: RequestStatus;
  recommendation?: string;
  submissionDate: string; // ISO date string (from Firestore Timestamp)
  technicianId?: string; // Firebase Auth UID of the technician
  technicianName?: string;
  responseDate?: string; // ISO date string (from Firestore Timestamp)
  municipality?: string;
  mandiocaPlantedArea?: number;
  mandiocaInfectedArea?: number;
  macaxeiraPlantedArea?: number;
  macaxeiraInfectedArea?: number;
  latitude?: number;
  longitude?: number;
  deviceLocationStatus?: DeviceLocationStatus;
}
