
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import UserList from '@/components/admin/UserList';
import type { User } from '@/types';
import { mockUsers, mockRequests, updateUserInMockData, deleteUserFromMockData } from '@/lib/mockData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Frown, ListFilter, UserCheck, Users as UsersIcon, TractorIcon } from 'lucide-react'; // Added UserCheck, UsersIcon, TractorIcon
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

const fetchAllUsers = async (): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockUsers]; 
};

export type UserWithActivityCount = User & { 
  requestCount?: number; 
  responseCount?: number; 
};

export default function ManageUsersPage() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithActivityCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'all'>('all');

  useEffect(() => {
    if (adminUser && adminUser.role === 'admin') {
      setIsLoading(true);
      fetchAllUsers()
        .then(data => {
          const usersWithCounts = data.map(u => {
            let activityCount: Partial<UserWithActivityCount> = {};
            if (u.role === 'farmer') {
              const count = mockRequests.filter(req => req.farmerId === u.id).length;
              activityCount = { requestCount: count };
            } else if (u.role === 'technician') {
              const count = mockRequests.filter(req => req.technicianId === u.id && req.status !== 'Pending').length;
              activityCount = { responseCount: count };
            }
            return { ...u, ...activityCount };
          });
          setUsers(usersWithCounts);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Falha ao buscar usuários:", error);
          toast({ title: "Erro ao Carregar", description: "Não foi possível buscar os usuários.", variant: "destructive" });
          setIsLoading(false);
        });
    }
  }, [adminUser, toast]);

  const handleUserUpdate = async (userId: string, updatedData: Partial<User>) => {
    try {
      const updatedUser = await updateUserInMockData(userId, updatedData);
      if (updatedUser) {
        setUsers(prevUsers => prevUsers.map(u => {
          if (u.id === userId) {
            let activityCount: Partial<UserWithActivityCount> = {};
            if (updatedData.role === 'farmer' || (u.role === 'farmer' && !updatedData.role)) {
              const count = mockRequests.filter(req => req.farmerId === u.id).length;
              activityCount = { requestCount: count, responseCount: undefined };
            } else if (updatedData.role === 'technician' || (u.role === 'technician' && !updatedData.role)) {
              const count = mockRequests.filter(req => req.technicianId === u.id && req.status !== 'Pending').length;
              activityCount = { responseCount: count, requestCount: undefined };
            } else {
                 activityCount = { requestCount: undefined, responseCount: undefined };
            }
            return { ...u, ...updatedUser, ...activityCount };
          }
          return u;
        }));
        toast({ title: "Usuário Atualizado", description: `Os dados de ${updatedUser.name} foram atualizados.` });
      } else {
        toast({ title: "Erro na Atualização", description: "Não foi possível encontrar o usuário para atualizar.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Falha ao atualizar usuário:", error);
      toast({ title: "Falha na Atualização", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    }
  };

  const handleUserDelete = async (userId: string, userName: string) => {
    try {
      const success = await deleteUserFromMockData(userId);
      if (success) {
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        toast({ title: "Usuário Removido", description: `O usuário ${userName} foi removido com sucesso.` });
      } else {
        toast({ title: "Erro na Remoção", description: "Não foi possível encontrar o usuário para remover.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Falha ao remover usuário:", error);
      toast({ title: "Falha na Remoção", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    }
  };
  
  const getRoleDisplayName = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'technician': return 'Técnico';
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
      technicians: users.filter(u => u.role === 'technician').length,
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
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Label htmlFor="role-filter" className="text-sm font-medium">Filtrar por Função</Label>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as User['role'] | 'all')}>
            <SelectTrigger id="role-filter" className="w-full mt-1 bg-card">
              <ListFilter className="mr-2 h-4 w-4 text-primary" />
              <SelectValue placeholder="Filtrar por função..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Funções</SelectItem>
              <SelectItem value="admin">Administradores ({totalCounts.admins})</SelectItem>
              <SelectItem value="technician">Técnicos ({totalCounts.technicians})</SelectItem>
              <SelectItem value="farmer">Agricultores ({totalCounts.farmers})</SelectItem>
            </SelectContent>
          </Select>
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
            <div className="text-2xl font-bold">{totalCounts.technicians}</div>
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


      {isLoading ? (
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
              : `Não há usuários com a função "${getRoleDisplayName(roleFilter as User['role'])}" cadastrados.`}
          </p>
        </div>
      )}
    </PageWrapper>
  );
}
