'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import TechnicianRequestCard from '@/components/technician/RequestCard'; // Reusing for display
import type { AgriRequest, User as AppUser } from '@/types';
import { getAllRequestsForAdmin } from '@/services/requestService'; // Changed to system-wide fetch
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { ClipboardList, Frown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query } from 'firebase/firestore';
import { db, firebaseInitializedCorrectly } from '@/lib/firebase';

const fetchAllUsers = async (): Promise<AppUser[]> => {
  if (!firebaseInitializedCorrectly || !db) return [];
  const usersCollectionRef = collection(db, 'users');
  const userSnapshot = await getDocs(query(usersCollectionRef));
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
};


export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allRequests, setAllRequests] = useState<AgriRequest[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') {
      setIsLoading(true);
      Promise.all([
        getAllRequestsForAdmin(),
        fetchAllUsers()
      ]).then(([requestsData, usersData]) => {
          setAllRequests(requestsData);
          setAllUsers(usersData);
      }).catch(error => {
          console.error("Falha ao buscar dados para o painel de admin:", error);
          toast({
            title: "Erro ao Carregar Dados",
            description: "Não foi possível buscar os levantamentos ou usuários. Verifique sua conexão ou tente mais tarde.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (user === null && user?.role !== 'admin') {
        setIsLoading(false);
    }
  }, [user, toast]);
  
  const enrichedRequests = useMemo(() => {
    if (allRequests.length === 0 || allUsers.length === 0) {
      return allRequests;
    }
    const usersMap = new Map(allUsers.map(u => [u.id, u]));
    return allRequests.map(req => {
      const farmer = usersMap.get(req.farmerId);
      return {
        ...req,
        farmerRegistrationStatus: farmer?.registrationStatus,
      };
    });
  }, [allRequests, allUsers]);

  return (
    <PageWrapper allowedRoles={['admin']}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-headline text-gray-800">Painel do Administrador</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center text-primary bg-primary/10 px-3 py-2 rounded-md text-sm">
            <ClipboardList className="h-5 w-5 mr-2"/>
            <span>Levantamentos Totais: {isLoading ? 'Carregando...' : enrichedRequests.length}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : enrichedRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrichedRequests.map(request => (
            <TechnicianRequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <Frown className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum Levantamento Encontrado</h2>
          <p className="text-muted-foreground">
            Ainda não há Levantamentos registrados no sistema.
          </p>
        </div>
      )}
    </PageWrapper>
  );
}

const CardSkeleton = () => (
  <div className="bg-card p-4 rounded-lg shadow space-y-3">
    <div className="flex justify-between items-start">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-5 w-20" />
    </div>
     <div className="space-y-1">
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-1/2" />
     </div>
     <div className="flex justify-center sm:justify-start -space-x-2 overflow-hidden my-2">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  </div>
);