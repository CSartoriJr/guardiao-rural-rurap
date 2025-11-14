'use server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserDocumentSafely } from '@/services/userService';
import type { User, AgriRequest, RegistrationStatus } from '@/types';
import { cookies } from 'next/headers';

async function getCurrentUser(): Promise<User | null> {
    try {
        const session = cookies().get('session')?.value || '';
        if (!session) return null;
    } catch (error) {
        console.error('Error getting current user from session:', error);
    }
    return null;
}

export async function getFarmers(municipalities?: string[]): Promise<User[]> {
  const usersRef = collection(db, 'users');
  let q = query(usersRef, where('role', '==', 'farmer'));

  // If specific municipalities are provided, filter by them.
  if (municipalities && municipalities.length > 0) {
      q = query(usersRef, where('role', '==', 'farmer'), where('municipality', 'in', municipalities));
  }


  try {
    const querySnapshot = await getDocs(q);
    const allFarmers = querySnapshot.docs.reduce((acc, docSnap) => {
        const data = docSnap.data();
        const validStatuses: RegistrationStatus[] = ['Pendente', 'Confirmado', 'Inapto', 'Excluir'];
        if (data && typeof data.name === 'string' && typeof data.cpf === 'string') {
            const safeUser: User = {
              id: docSnap.id,
              cpf: data.cpf,
              role: 'farmer',
              name: data.name,
              email: typeof data.email === 'string' ? data.email : undefined,
              phone: typeof data.phone === 'string' ? data.phone : undefined,
              address: typeof data.address === 'string' ? data.address : undefined,
              organizationalUnit: typeof data.organizationalUnit === 'string' ? data.organizationalUnit : undefined,
              municipality: typeof data.municipality === 'string' ? data.municipality : undefined,
              familyMembers: typeof data.familyMembers === 'number' ? data.familyMembers : undefined,
              caf: typeof data.caf === 'string' ? data.caf : undefined,
              registrationStatus: validStatuses.includes(data.registrationStatus) ? data.registrationStatus : 'Pendente',
            };
            acc.push(safeUser);
        }
        return acc;
    }, [] as User[]);

    allFarmers.sort((a, b) => a.name.localeCompare(b.name));
    return allFarmers;

  } catch (error) {
    console.error("[FarmerActions] Error fetching farmers:", error);
    return [];
  }
};


export async function getFarmersList(municipalities?: string[]): Promise<User[]> {
  try {
    const farmers = await getFarmers(municipalities);
    return farmers;
  } catch (error) {
    console.error('Failed to get farmers list via server action:', error);
    return [];
  }
}


export async function getFarmersListWithRequestCounts(municipalities?: string[]): Promise<(User & { requestCount: number })[]> {
  try {
    const [farmers, allRequests] = await Promise.all([
      getFarmers(municipalities),
      getDocs(collection(db, 'requests'))
    ]);

    const requestsByFarmer = allRequests.docs.reduce((acc, doc) => {
      const request = doc.data() as AgriRequest;
      if (request.farmerId) {
        acc[request.farmerId] = (acc[request.farmerId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return farmers.map(farmer => ({
      ...farmer,
      requestCount: requestsByFarmer[farmer.id] || 0
    }));

  } catch (error) {
    console.error('Failed to get farmers list with counts via server action:', error);
    return [];
  }
}

export async function getFarmerDetails(farmerId: string): Promise<User | null> {
    try {
        const farmer = await getUserDocumentSafely(farmerId);
        if (farmer && farmer.role === 'farmer') {
            return farmer;
        }
        return null;
    } catch (error) {
        console.error(`Failed to get details for farmer ${farmerId}:`, error);
        return null;
    }
}
