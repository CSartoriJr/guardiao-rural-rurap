
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import UserList from '@/components/admin/UserList';
import type { User as AppUserType } from '@/types'; // Renamed to avoid conflict
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Frown, ListFilter, UserCheck, Users as UsersIcon, TractorIcon, ShieldPlus, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { firebaseInitializedCorrectly, db } from '@/lib/firebase';
import { collection, getDocs, query as firestoreQuery, where } from 'firebase/firestore'; // Added firestoreQuery
import { deleteUserFirestoreDocument } from '@/services/userService';
import { getRequestsForFarmer } from '@/services/requestService'; // To count farmer requests
import { updateUserAsAdmin } from '@/ai/flows/update-user-by-admin';


const fetchAllUsersFromFirestore = async (): Promise<AppUserType[]> => {
  if (!firebaseInitializedCorrectly || !db) {
    console.error("Firebase não inicializado. Não é possível buscar usuários.");
    return [];
  }
  const usersCollectionRef = collection(db, 'users');
  const userSnapshot = await getDocs(usersCollectionRef);
  const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUserType));
  return userList;
};

const countUserActivity = async (user: AppUserType): Promise<{ requestCount?: number; responseCount?: number }> => {
  if (!firebaseInitializedCorrectly || !db) return {};
  let activityCount: { requestCount?: number; responseCount?: number } = {};

  if (user.role === 'farmer' && user.id) {
    try {
      const requests = await getRequestsForFarmer(user.id);
      activityCount = { requestCount: requests.length };
    } catch (e) {
      console.error(`Erro ao buscar Levantamentos para agricultor ${user.id}:`, e);
      activityCount = { requestCount: 0 };
    }
  } else if (user.role === 'tecnico') {
    try {
      const q = firestoreQuery(
        collection(db, 'requests'),
        where('tecnicoId', '==', user.id),
        where('status', '!=', 'Pending')
      );
      const snapshot = await getDocs(q);
      activityCount = { responseCount: snapshot.size };
    } catch (e) {
      console.error(`Erro ao buscar respostas para técnico ${user.id}:`, e);
      activityCount = { responseCount: 0 };
    }
  }
  return activityCount;
};

export type UserWithActivityCount = AppUserType & { 
  requestCount?: number; 
  responseCount?: number; 
};

export default function ManageUsersPage() {
  const { user: adminUser, initializing: authInitializing } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithActivityCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<AppUserType['role'] | 'all'>('all');

  useEffect(() => {
    if (authInitializing) return;
    if (adminUser && adminUser.role === 'admin' && firebaseInitializedCorrectly) {
      setIsLoading(true);
      fetchAllUsersFromFirestore()
        .then(async fetchedUsers => {
          const usersWithCountsPromises = fetchedUsers.map(async u => {
            const activity = await countUserActivity(u);
            return { ...u, ...activity };
          });
          const usersWithCounts = await Promise.all(usersWithCountsPromises);
          usersWithCounts.sort((a, b) => a.name.localeCompare(b.name));
          setUsers(usersWithCounts);
        })
        .catch(error => {
          console.error("Falha ao buscar usuários do Firestore:", error);
          toast({ title: "Erro ao Carregar", description: "Não foi possível buscar os usuários do sistema.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    } else if (!authInitializing && !firebaseInitializedCorrectly) {
        toast({ title: "Erro de Configuração", description: "Firebase não está configurado. Funcionalidades limitadas.", variant: "destructive" });
        setIsLoading(false);
    }
  }, [adminUser, authInitializing, toast]);

  const handleUserUpdate = async (userId: string, updatedData: Partial<AppUserType>) => {
    try {
      const { password, ...firestoreData } = updatedData;

      // Call the secure Genkit flow to perform the update
      const result = await updateUserAsAdmin({ userId, updatedData: firestoreData });

      if (!result.success) {
        throw new Error(result.message || 'Falha ao atualizar usuário no servidor.');
      }
      
      // Re-fetch and update the specific user with new counts
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        const oldUserData = users[userIndex];
        const updatedUserWithOldCounts = { ...oldUserData, ...firestoreData }; // Apply updates, keep old counts for now
        const activity = await countUserActivity(updatedUserWithOldCounts as AppUserType); // Recalculate activity
        const fullyUpdatedUser = { ...updatedUserWithOldCounts, ...activity };

        setUsers(prevUsers => {
          const newUsers = [...prevUsers];
          newUsers[userIndex] = fullyUpdatedUser;
          newUsers.sort((a, b) => a.name.localeCompare(b.name));
          return newUsers;
        });
      }
      toast({ title: "Usuário Atualizado", description: `Os dados de ${updatedData.name || 'usuário'} foram atualizados.` });
    } catch (error: any) {
      console.error("Falha ao atualizar usuário:", error);
      toast({ title: "Falha na Atualização", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    }
  };

  const handleUserDelete = async (userId: string, userName: string) => {
    // Deleting Firebase Auth user client-side is complex and risky.
    // This will only delete the Firestore document.
    try {
      await deleteUserFirestoreDocument(userId);
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      toast({ 
        title: "Documento de Usuário Removido", 
        description: `O documento do usuário ${userName} foi removido. Para restaurar o acesso, crie um novo usuário para essa pessoa.` 
      });
    } catch (error: any) {
      console.error("Falha ao remover documento do usuário:", error);
      toast({ title: "Falha na Remoção do Documento", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    }
  };
  
  const getRoleDisplayName = (role: AppUserType['role']) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'tecnico': return 'Técnico';
      case 'farmer': return 'Agricultor';
      default: return role;
    }
  };

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') {
      return users;
    }
    return users.filter(user => user.role === roleFilter);
  }, [users, roleFilter]);

  const totalCounts = useMemo(() => {
    return {
      farmers: users.filter(u => u.role === 'farmer').length,
      tecnicos: users.filter(u => u.role === 'tecnico').length,
      admins: users.filter(u => u.role === 'admin').length,
    };
  }, [users]);


  return (
    <PageWrapper allowedRoles={['admin']}>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline text-gray-800">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">Visualize, edite ou remova os usuários do sistema.</p>
        </div>
        <div className="flex w-full sm:w-auto flex-col sm:flex-row sm:items-end gap-2">
            <div className="w-full sm:w-auto sm:min-w-[200px]">
              <Label htmlFor="role-filter" className="text-sm font-medium">Filtrar por Função</Label>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as AppUserType['role'] | 'all')}>
                <SelectTrigger id="role-filter" className="w-full mt-1 bg-card">
                  <ListFilter className="mr-2 h-4 w-4 text-primary" />
                  <SelectValue placeholder="Filtrar por função..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Funções</SelectItem>
                  <SelectItem value="admin">Administradores ({totalCounts.admins})</SelectItem>
                  <SelectItem value="tecnico">Técnicos ({totalCounts.tecnicos})</SelectItem>
                  <SelectItem value="farmer">Agricultores ({totalCounts.farmers})</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <Button asChild className="w-full sm:w-auto">
                <Link href={APP_ROUTES.ADMIN_CREATE_TECNICO}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Técnico
                </Link>
            </Button>
            {adminUser?.id === 'Cp9ZO2xfwCVRfuCXFhKpetUVJFz1' && (
              <Button asChild className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href={APP_ROUTES.ADMIN_CREATE_ADMIN}>
                  <ShieldPlus className="mr-2 h-4 w-4" />
                  Adicionar Admin
                </Link>
              </Button>
            )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agricultores</CardTitle>
            <TractorIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCounts.farmers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Técnicos</CardTitle>
            <UserCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCounts.tecnicos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Administradores</CardTitle>
            <UsersIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCounts.admins}</div>
          </CardContent>
        </Card>
      </div>


      {isLoading || authInitializing ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filteredUsers.length > 0 ? (
        <UserList 
          users={filteredUsers} 
          currentAdminId={adminUser?.id || ''}
          onUserUpdate={handleUserUpdate} 
          onUserDelete={handleUserDelete}
          getRoleDisplayName={getRoleDisplayName} 
        />
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <Frown className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum Usuário Encontrado</h2>
          <p className="text-muted-foreground">
            {roleFilter === 'all' 
              ? "Não há usuários cadastrados no sistema além de você." 
              : `Não há usuários com a função "${getRoleDisplayName(roleFilter as AppUserType['role'])}" cadastrados.`}
          </p>
        </div>
      )}
    </PageWrapper>
  );
}
