
'use client';
import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import UserList from '@/components/admin/UserList';
import type { User } from '@/types';
import { mockUsers, updateUserInMockData } from '@/lib/mockData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Frown } from 'lucide-react';

const fetchAllUsers = async (): Promise<User[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockUsers]; // Return a copy to avoid direct mutation issues if any
};

export default function ManageUsersPage() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (adminUser && adminUser.role === 'admin') {
      setIsLoading(true);
      fetchAllUsers()
        .then(data => {
          setUsers(data);
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
        setUsers(prevUsers => prevUsers.map(u => (u.id === userId ? updatedUser : u)));
        toast({ title: "Usuário Atualizado", description: `Os dados de ${updatedUser.name} foram atualizados.` });
      } else {
        toast({ title: "Erro na Atualização", description: "Não foi possível encontrar o usuário para atualizar.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Falha ao atualizar usuário:", error);
      toast({ title: "Falha na Atualização", description: error.message || "Ocorreu um erro.", variant: "destructive" });
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


  return (
    <PageWrapper allowedRoles={['admin']}>
      <div className="mb-8">
        <h1 className="text-3xl font-headline text-gray-800">Gerenciar Usuários</h1>
        <p className="text-muted-foreground">Visualize e edite os usuários do sistema.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : users.length > 0 ? (
        <UserList users={users} onUserUpdate={handleUserUpdate} getRoleDisplayName={getRoleDisplayName} />
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <Frown className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum Usuário Encontrado</h2>
          <p className="text-muted-foreground">Não há usuários cadastrados no sistema além de você.</p>
        </div>
      )}
    </PageWrapper>
  );
}
