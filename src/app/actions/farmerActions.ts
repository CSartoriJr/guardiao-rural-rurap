
'use server';
import { getFarmers, getUserDocumentSafely } from '@/services/userService';
import type { User } from '@/types';
import { cookies } from 'next/headers';
import { getUserDocument } from '@/services/userService';


async function getCurrentUser(): Promise<User | null> {
    try {
        const session = cookies().get('session')?.value || '';
        if (!session) return null;

        // Valide o token de sessão usando o Firebase Admin SDK (exemplo conceitual)
        // Em um app real, isso seria feito com uma verificação segura.
        // A lógica aqui é simplificada para o ambiente do Studio.
        // const decodedClaims = await auth().verifySessionCookie(session);
        // const user = await getUserDocument(decodedClaims.uid);
        
        // Simulação para o ambiente de desenvolvimento, assumindo que a sessão é válida
        // Em um projeto real, você teria uma forma de obter o UID do usuário a partir da sessão.
        // Como não temos acesso ao UID aqui de forma segura, vamos focar no que podemos fazer.
        // Esta parte do código é mais um placeholder, a lógica principal está no `getFarmers`.
        // A lógica de `getFarmers` foi ajustada para não depender do usuário aqui, mas sim dos municípios passados.

    } catch (error) {
        console.error('Error getting current user from session:', error);
    }
    return null;
}


export async function getFarmersList(municipalities?: string[]): Promise<User[]> {
  try {
    // A lógica foi simplificada para depender apenas dos municípios passados.
    // O `getFarmers` em `userService` já lida com o caso de `municipalities` ser undefined
    // e busca todos os agricultores, o que atende aos perfis de consulta.
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
