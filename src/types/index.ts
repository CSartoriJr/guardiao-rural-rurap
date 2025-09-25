export type RegistrationStatus = 'Pendente' | 'Confirmado' | 'Inapto';

export interface User {
  id: string; // Firebase Auth UID
  cpf: string;
  role: 'farmer' | 'technician' | 'admin';
  name: string;
  email?: string; // Firebase Auth uses email, so we'll store the actual email or a dummy one if CPF is used for auth.
  password?: string; // Only used for initial creation/reset, not stored directly in Firestore if using Firebase Auth.
  caf?: string;
  registeredByTechnicianId?: string; // ID of the technician who registered the farmer
  registeredByTechnicianName?: string; // Name of the technician who registered the farmer
  registrationStatus?: RegistrationStatus; // Status of the farmer's registration

  // Fields specific to farmer role, stored in Firestore document
  phone?: string;
  address?: string;
  organizationalUnit?: string;
  municipality?: string;
  familyMembers?: number;

  // Fields specific to technician role
  assignedMunicipalities?: string[];
}

export type RequestStatus = 'Pending' | 'Positive' | 'Negative' | 'Inconclusive' | 'Suspeita de Infecção';
export type DeviceLocationStatus = 'idle' | 'fetching' | 'success' | 'error' | 'denied' | 'unavailable' | 'timeout' | 'unsupported';
export type SoilTexture = "Arenoso" | "Argiloso" | "Textura Média";
export type VegetationType = "Mata (Floresta)" | "Cerrado";


export interface AgriRequest {
  id: string; // Firestore document ID
  farmerId: string; // Firebase Auth UID of the farmer
  farmerCpf: string; // CPF of the farmer, used for stable linking
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
  mandiocaPlantingDate?: string; // ISO String
  mandiocaSymptomsDate?: string; // ISO String
  macaxeiraPlantingDate?: string; // ISO String
  macaxeiraSymptomsDate?: string; // ISO String;
  soilTexture?: SoilTexture;
  vegetationType?: VegetationType;
  laudoPdfUrl?: string; // URL for the uploaded PDF report
}
