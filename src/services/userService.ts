
// src/services/userService.ts
import { db, firebaseInitializedCorrectly, auth as firebaseAuth } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch, deleteField } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth'; // Firebase Auth user type
import type { User as AppUser } from '@/types'; // Your application's user type

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
    municipality: additionalData.municipality,
    familyMembers: additionalData.familyMembers,
    assignedMunicipalities: additionalData.assignedMunicipalities,
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
    return { id: docSnap.id, ...docSnap.data() } as AppUser;
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

export const getFarmers = async (municipalities?: string[]): Promise<AppUser[]> => {
  ensureFirebaseInitialized();
  const usersRef = collection(db!, USERS_COLLECTION);
  let q;

  if (municipalities && municipalities.length > 0) {
    q = query(usersRef, where('role', '==', 'farmer'), where('municipality', 'in', municipalities));
  } else {
    q = query(usersRef, where('role', '==', 'farmer'));
  }

  try {
    const querySnapshot = await getDocs(q);
    const farmers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
    farmers.sort((a, b) => a.name.localeCompare(b.name));
    return farmers;
  } catch (error) {
    console.error("[UserService] Error fetching farmers:", error);
    throw new Error("Falha ao buscar agricultores.");
  }
};


// Important: Deleting a Firebase Auth user from the client-side is generally not recommended
// and has limitations. True user deletion should be handled by a backend Admin SDK.
// This function will only delete the Firestore document.
export const deleteUserFirestoreDocument = async (userId: string): Promise<void> => {
  ensureFirebaseInitialized();

  // Rule: Prevent deletion of the master admin
  if (userId === 'Cp9ZO2xfwCVRfuCXFhKpetUVJFz1') {
    throw new Error("O Administrador Master não pode ser removido.");
  }
  
  const currentUserDoc = await getUserDocument(userId);
  if (!currentUserDoc) {
    throw new Error("Usuário não encontrado no Firestore para verificar regras de exclusão.");
  }

  // First, check if the user is an admin and if they are the last admin
  if (currentUserDoc.role === 'admin') {
    const adminQuery = query(collection(db!, USERS_COLLECTION), where("role", "==", "admin"));
    const adminSnapshot = await getDocs(adminQuery);
    if (adminSnapshot.docs.length <= 1) {
      throw new Error("Não é possível remover o único administrador do sistema.");
    }
  }

  // Check for related requests for farmers or technicians
   if (currentUserDoc.role === 'farmer') {
    const requestQuery = query(collection(db!, 'requests'), where('farmerCpf', '==', currentUserDoc.cpf));
    const requestSnapshot = await getDocs(requestQuery);
    if (!requestSnapshot.empty) {
      throw new Error('Este agricultor possui Levantamentos e não pode ser removido. Remova os Levantamentos primeiro.');
    }
  } else if (currentUserDoc.role === 'technician') {
    const requestQuery = query(collection(db!, 'requests'), where('technicianId', '==', userId), where('status', '!=', 'Pending'));
    const requestSnapshot = await getDocs(requestQuery);
    if (!requestSnapshot.empty) {
      throw new Error('Este técnico possui respostas associadas a Levantamentos e não pode ser removido.');
    }
  }

  const userRef = doc(db!, USERS_COLLECTION, userId);
  await deleteDoc(userRef);
  console.log(`[UserService] User Firestore document deleted for ${userId}. Firebase Auth user may still exist.`);
  // Note: To delete the Firebase Auth user, you'd typically use an Admin SDK call from a backend.
  // For client-side, you might disable the user if the SDK allows, or just accept this limitation.
};
