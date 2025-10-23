'use client';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/shared/PageWrapper';
import UserList from '@/components/admin/UserList';
import type { User as AppUserType, RegistrationStatus } from '@/types'; // Renamed to avoid conflict
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Frown, ListFilter, UserCheck, Users as UsersIcon, TractorIcon, ShieldPlus, UserPlus, Clock, UserX, Briefcase, Building, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { firebaseInitializedCorrectly, db } from '@/lib/firebase';
import { collection, getDocs, query as firestoreQuery, where } from 'firebase/firestore'; // Added firestoreQuery
import { getRequestsForFarmer } from '@/services/requestService'; // To count farmer requests
import { updateUserAsAdmin, deleteUserByAdmin } from '@/ai/flows/manage-user-by-admin';

// This is a new component to contain the main logic.
function UserPageContent() {
  const { user: adminUser, initializing: authInitializing } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserWithActivityCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<AppUserType['role'] | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');

  useEffect(() => {
    const statusParam = searchParams.get('status') as RegistrationStatus | null;
    if (statusParam && ['Pendente', 'Confirmado', 'Inapto', 'Excluir'].includes(statusParam)) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

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
          usersWithCounts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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
      const result = await updateUserAsAdmin({ userId, updatedData: firestoreData });

      if (!result.success) {
        throw new Error(result.message || 'Falha ao atualizar usuário no servidor.');
      }
      
      setUsers(prevUsers => {
          const userIndex = prevUsers.findIndex(u => u.id === userId);
          if (userIndex === -1) return prevUsers;
          const newUsers = [...prevUsers];
          const updatedUser = { ...newUsers[userIndex], ...firestoreData };
          newUsers[userIndex] = updatedUser;
          newUsers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          return newUsers;
        });

      toast({ title: "Usuário Atualizado", description: `Os dados de ${updatedData.name || 'usuário'} foram atualizados.` });
    } catch (error: any) {
      console.error("Falha ao atualizar usuário:", error);
      toast({ title: "Falha na Atualização", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    }
  };

  const handleUserDelete = async (userId: string, userName: string) => {
    try {
      const result = await deleteUserByAdmin({ userId });
      if (!result.success) {
        throw new Error(result.message || 'Falha ao remover usuário do servidor.');
      }
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      toast({ 
        title: "Usuário Removido", 
        description: result.message || `O usuário ${userName} foi removido com sucesso.` 
      });
    } catch (error: any) {
      console.error("Falha ao remover usuário:", error);
      toast({ title: "Falha na Remoção", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    }
  };
  
  const getRoleDisplayName = (role: AppUserType['role']) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'technician': return 'Técnico';
      case 'farmer': return 'Agricultor';
      case 'GabineteGov': return 'Gabinete Gov.';
      case 'Diagro': return 'Diagro';
      case 'SDR': return 'SDR';
      default: return role;
    }
  };
  
  const getStatusDisplayName = (status: RegistrationStatus | 'all') => {
    switch (status) {
        case 'Confirmado': return 'Confirmado';
        case 'Pendente': return 'Pendente';
        case 'Inapto': return 'Inapto';
        case 'Excluir': return 'Excluir';
        default: return 'Todos os Status';
    }
  }


  const filteredUsers = useMemo(() => {
    let usersToFilter = users;
    
    if (roleFilter !== 'all') {
      usersToFilter = usersToFilter.filter(user => user.role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
      // Allow 'Excluir' status to be filtered regardless of role
      if (statusFilter === 'Excluir') {
        usersToFilter = usersToFilter.filter(user => user.registrationStatus === statusFilter);
      } else {
        usersToFilter = usersToFilter.filter(user => user.role === 'farmer' && user.registrationStatus === statusFilter);
      }
    }

    return usersToFilter;
  }, [users, roleFilter, statusFilter]);

  const totalCounts = useMemo(() => {
    const farmers = users.filter(u => u.role === 'farmer');
    return {
      farmers: farmers.length,
      technicians: users.filter(u => u.role === 'technician').length,
      admins: users.filter(u => u.role === 'admin').length,
      gabineteGov: users.filter(u => u.role === 'GabineteGov').length,
      diagro: users.filter(u => u.role === 'Diagro').length,
      sdr: users.filter(u => u.role === 'SDR').length,
      confirmedFarmers: farmers.filter(f => f.registrationStatus === 'Confirmado').length,
      pendingFarmers: farmers.filter(f => f.registrationStatus === 'Pendente').length,
      unfitFarmers: farmers.filter(f => f.registrationStatus === 'Inapto').length,
      deletionRequests: users.filter(u => u.registrationStatus === 'Excluir').length, // Count across all roles
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
                  <SelectItem value="technician">Técnicos ({totalCounts.technicians})</SelectItem>
                  <SelectItem value="farmer">Agricultores ({totalCounts.farmers})</SelectItem>
                  <SelectItem value="GabineteGov">Gabinete Gov. ({totalCounts.gabineteGov})</SelectItem>
                  <SelectItem value="Diagro">Diagro ({totalCounts.diagro})</SelectItem>
                  <SelectItem value="SDR">SDR ({totalCounts.sdr})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[200px]">
              <Label htmlFor="status-filter" className="text-sm font-medium">Filtrar por Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RegistrationStatus | 'all')}>
                <SelectTrigger id="status-filter" className="w-full mt-1 bg-card">
                  <ListFilter className="mr-2 h-4 w-4 text-primary" />
                  <SelectValue placeholder="Filtrar por status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Confirmado">Confirmados ({totalCounts.confirmedFarmers})</SelectItem>
                  <SelectItem value="Pendente">Pendentes ({totalCounts.pendingFarmers})</SelectItem>
                  <SelectItem value="Inapto">Inaptos ({totalCounts.unfitFarmers})</SelectItem>
                  <SelectItem value="Excluir">Solicitou Exclusão ({totalCounts.deletionRequests})</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <Button asChild className="w-full sm:w-auto">
                <Link href={APP_ROUTES.ADMIN_CREATE_TECHNICIAN}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Técnico
                </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto" variant="outline">
                <Link href={APP_ROUTES.ADMIN_CREATE_EXTERNAL_USER}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Cadastro Externo
                </Link>
            </Button>
            {adminUser?.id === 'Cp9ZO2xfwCVRfuCXFhKpetUVJFz1' && (
              <Button asChild className="w-full sm:w-auto bg-success text-success-foreground hover:bg-success/90">
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
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TractorIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">Total de Agricultores</span>
            </div>
            <div className="text-2xl font-bold">{totalCounts.farmers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">Total de Técnicos</span>
            </div>
            <div className="text-2xl font-bold">{totalCounts.technicians}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UsersIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">Total de Administradores</span>
            </div>
            <div className="text-2xl font-bold">{totalCounts.admins}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">Agricultores Confirmados</span>
            </div>
            <div className="text-2xl font-bold">{totalCounts.confirmedFarmers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-yellow-600" />
              <span className="text-sm font-medium">Cadastros Pendentes</span>
            </div>
            <div className="text-2xl font-bold">{totalCounts.pendingFarmers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserX className="h-6 w-6 text-red-600" />
              <span className="text-sm font-medium">Cadastros Inaptos</span>
            </div>
            <div className="text-2xl font-bold">{totalCounts.unfitFarmers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">Gabinete Gov.</span>
                </div>
                <div className="text-2xl font-bold">{totalCounts.gabineteGov}</div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">Diagro</span>
                </div>
                <div className="text-2xl font-bold">{totalCounts.diagro}</div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">SDR</span>
                </div>
                <div className="text-2xl font-bold">{totalCounts.sdr}</div>
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

export type UserWithActivityCount = AppUserType & { 
  requestCount?: number; 
  responseCount?: number; 
};

const fetchAllUsersFromFirestore = async (): Promise<AppUserType[]> => {
  if (!firebaseInitializedCorrectly || !db) {
    console.error("Firebase não inicializado. Não é possível buscar usuários.");
    return [];
  }
  const usersCollectionRef = collection(db, 'users');
  const userSnapshot = await getDocs(usersCollectionRef);
  const userList = userSnapshot.docs.reduce((acc, doc) => {
    const data = doc.data();
    // Garante que o usuário tenha os campos mínimos necessários (id e nome)
    if (data && typeof data.name === 'string' && data.name.trim() !== '') {
      acc.push({ id: doc.id, ...data } as AppUserType);
    } else {
      console.warn(`[ManageUsersPage] Skipping malformed user document with ID: ${doc.id}`);
    }
    return acc;
  }, [] as AppUserType[]);
  return userList;
};

const countUserActivity = async (user: AppUserType): Promise<{ requestCount?: number; responseCount?: number }> => {
  if (!firebaseInitializedCorrectly || !db) return {};
  let activityCount: { requestCount?: number; responseCount?: number } = {};

  if (user.role === 'farmer' && user.id) { // Check for user ID
    try {
      const requests = await getRequestsForFarmer(user.id);
      activityCount = { requestCount: requests.length };
    } catch (e) {
      console.error(`Erro ao buscar Solicitações para agricultor ${user.id}:`, e);
      activityCount = { requestCount: 0 };
    }
  } else if (user.role === 'technician') {
    try {
      const requestsQuery = firestoreQuery(
        collection(db, 'requests'),
        where('technicianId', '==', user.id),
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const allRequests = requestsSnapshot.docs.map(doc => doc.data());
      const respondedRequests = allRequests.filter(req => req.status !== 'Pending');
      
      activityCount = { 
          responseCount: respondedRequests.length,
          requestCount: allRequests.length 
      };
    } catch (e) {
      console.error(`Erro ao buscar atividades para técnico ${user.id}:`, e);
      activityCount = { responseCount: 0, requestCount: 0 };
    }
  }
  return activityCount;
};

export default function ManageUsersPage() {
    return (
        <Suspense fallback={<UserPageSkeleton />}>
            <UserPageContent />
        </Suspense>
    )
}

function UserPageSkeleton() {
    return (
        <PageWrapper allowedRoles={['admin']}>
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-headline text-gray-800">Gerenciar Usuários</h1>
                    <p className="text-muted-foreground">Visualize, edite ou remova os usuários do sistema.</p>
                </div>
                <div className="flex w-full sm:w-auto flex-col sm:flex-row sm:items-end gap-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-48" />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </PageWrapper>
    )
}
