'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import TechnicianRequestCard from '@/components/technician/RequestCard'; // Reusing for display
import type { AgriRequest, RequestStatus } from '@/types';
import { getAllRequestsForAdmin } from '@/services/requestService'; // Changed to system-wide fetch
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { ClipboardList, Frown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AgriRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') {
      setIsLoading(true);
      getAllRequestsForAdmin() // Use the system-wide function to fetch ALL requests
        .then(data => {
          setRequests(data);
        })
        .catch(error => {
          console.error("Falha ao buscar todos os Levantamentos para admin via Firestore:", error);
          toast({
            title: "Erro ao Carregar Levantamentos",
            description: "Não foi possível buscar os Levantamentos do sistema. Verifique sua conexão ou tente mais tarde.",
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
  
  return (
    <PageWrapper allowedRoles={['admin']}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-headline text-gray-800">Painel do Administrador</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center text-primary bg-primary/10 px-3 py-2 rounded-md text-sm">
            <ClipboardList className="h-5 w-5 mr-2"/>
            <span>Levantamentos Totais: {isLoading ? 'Carregando...' : requests.length}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(request => (
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
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-4 w-1/2" />
     <div className="flex justify-center sm:justify-start -space-x-2 overflow-hidden my-2">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
    <Skeleton className="h-10 w-full" />
  </div>
);
