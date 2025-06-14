
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import UserList from '@/components/admin/UserList';
import type { User, AgriRequest } from '@/types';
import { mockUsers, mockRequests, updateUserInMockData, deleteUserFromMockData } from '@/lib/mockData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Frown, ListFilter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

const fetchAllUsers = async (): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockUsers]; 
};

// Define an extended user type for this page context
type UserWithRequestCount = User & { requestCount?: number };

export default function ManageUsersPage() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRequestCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'all'>('all');

  useEffect(() => {
    if (adminUser && adminUser.role === 'admin') {
      setIsLoading(true);
      fetchAllUsers()
        .then(data => {
          const usersWithCounts = data.map(u => {
            if (u.role === 'farmer') {
              const count = mockRequests.filter(req => req.farmerId === u.id).length;
              return { ...u, requestCount: count };
            }
            return u;
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
            const baseUpdatedUser = { ...u, ...updatedUser };
            if (baseUpdatedUser.role === 'farmer') {
              // Recalculate request count if role changed to farmer or if it was already a farmer
              const count = mockRequests.filter(req => req.farmerId === baseUpdatedUser.id).length;
              return { ...baseUpdatedUser, requestCount: count };
            } else if (u.requestCount !== undefined) {
              // If role changed from farmer, remove requestCount
              const { requestCount, ...rest } = baseUpdatedUser;
              return rest;
            }
            return baseUpdatedUser;
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
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="technician">Técnicos</SelectItem>
              <SelectItem value="farmer">Agricultores</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
              : `Não há usuários com a função "${getRoleDisplayName(roleFilter)}" cadastrados.`}
          </p>
        </div>
      )}
    </PageWrapper>
  );
}
