// src/services/userService.ts
import { db, firebaseInitializedCorrectly } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch, deleteField } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth'; // Firebase Auth user type
import type { User as AppUser, RegistrationStatus } from '@/types'; // Your application's user type

const USERS_COLLECTION = 'users';

const ensureFirebaseInitialized = () => {
  if (!firebaseInitializedCorrectly || !db) {
    const errorMessage = "[UserService] Firebase not properly initialized. Cannot perform Firestore operations.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

export const createUserDocument = async (
  userAuth: AuthUser,
  additionalData: Partial<Omit<AppUser, 'id'>>
): Promise<AppUser> => {
  ensureFirebaseInitialized();
  if (!userAuth) throw new Error('User object from Firebase Auth is required.');

  const userRef = doc(db!, USERS_COLLECTION, userAuth.uid);
  const userData: AppUser = {
    id: userAuth.uid,
    email: additionalData.email || userAuth.email || '', // Prefer passed email, then auth email
    name: additionalData.name || userAuth.displayName || 'Usuário Anônimo',
    cpf: additionalData.cpf || '', // CPF must be provided in additionalData
    role: additionalData.role || 'farmer', // Default to farmer if not specified
    phone: additionalData.phone,
    address: additionalData.address,
    organizationalUnit: additionalData.organizationalUnit,
    municipality: additionalData.municipality,
    familyMembers: additionalData.familyMembers,
    assignedMunicipalities: additionalData.assignedMunicipalities,
    caf: additionalData.caf,
    registrationStatus: additionalData.registrationStatus,
    // Password is not stored in Firestore document
  };

  // Remove undefined fields before saving
  Object.keys(userData).forEach(key => {
    const K = key as keyof AppUser;
    if (userData[K] === undefined) {
      delete userData[K];
    }
  });


  await setDoc(userRef, userData);
  console.log(`[UserService] User document created for ${userAuth.uid} with email ${userData.email}`);
  return userData;
};

export const getUserDocument = async (userId: string): Promise<AppUser | null> => {
  ensureFirebaseInitialized();
  const userRef = doc(db!, USERS_COLLECTION, userId);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    // Apply defensive transformation to handle potential data inconsistencies
    const data = docSnap.data();
    const validRoles: AppUser['role'][] = ['farmer', 'technician', 'admin', 'GabineteGov', 'Diagro', 'SDR'];
    const validStatuses: RegistrationStatus[] = ['Pendente', 'Confirmado', 'Inapto', 'Excluir'];

    const safeUser: AppUser = {
      id: docSnap.id,
      cpf: typeof data.cpf === 'string' ? data.cpf : '',
      role: validRoles.includes(data.role) ? data.role : 'farmer',
      name: typeof data.name === 'string' ? data.name : 'Nome Inválido',
      email: typeof data.email === 'string' ? data.email : undefined,
      phone: typeof data.phone === 'string' ? data.phone : undefined,
      address: typeof data.address === 'string' ? data.address : undefined,
      organizationalUnit: typeof data.organizationalUnit === 'string' ? data.organizationalUnit : undefined,
      municipality: typeof data.municipality === 'string' ? data.municipality : undefined,
      familyMembers: typeof data.familyMembers === 'number' ? data.familyMembers : undefined,
      assignedMunicipalities: Array.isArray(data.assignedMunicipalities) ? data.assignedMunicipalities : undefined,
      caf: typeof data.caf === 'string' ? data.caf : undefined,
      registrationStatus: validStatuses.includes(data.registrationStatus) ? data.registrationStatus : undefined,
    };
    return safeUser;
  }
  return null;
};

export const updateUserDocument = async (userId: string, data: Partial<AppUser>): Promise<void> => {
  ensureFirebaseInitialized();
  const userRef = doc(db!, USERS_COLLECTION, userId);
  
  const updateData: {[key: string]: any} = { ...data };
  delete updateData.id;

  // Convert undefined values to deleteField() to ensure fields are removed from the document
  for (const key in updateData) {
    if (updateData[key] === undefined) {
      updateData[key] = deleteField();
    }
  }
  
  await updateDoc(userRef, updateData);
  console.log(`[UserService] User document updated for ${userId}`);
};


export const getUserDocumentSafely = async (userId: string): Promise<AppUser | null> => {
    ensureFirebaseInitialized();
    try {
        const userDoc = await getUserDocument(userId);
        return userDoc;
    } catch (error) {
        console.error(`[UserService] Failed to get document for user ${userId}, returning null. Error:`, error);
        return null;
    }
};
