
'use server';
import { getFarmers, getUserDocumentSafely } from '@/services/userService';
import type { User } from '@/types';

export async function getFarmersList(municipalities?: string[]): Promise<User[]> {
  try {
    const farmers = await getFarmers(municipalities);
    return farmers;
  } catch (error) {
    console.error('Failed to get farmers list via server action:', error);
    return []; // Return empty on error
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
