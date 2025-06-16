
'use client';
import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import TechnicianRequestCard from '@/components/technician/RequestCard';
import type { AgriRequest } from '@/types';
import { mockRequests } from '@/lib/mockData'; // Reverted to mockData
// import { getPendingRequestsForTechnician } from '@/services/requestService'; // Commented out Firestore service
import { useAuth } from '@/hooks/useAuth';
import { ClipboardList, Frown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function TechnicianDashboard() {
  const { user } = useAuth(); 
  const { toast } = useToast(); // Keep for other potential notifications
  const [requests, setRequests] = useState<AgriRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) { 
      setIsLoading(true);
      // Revert to mockData: Filter pending requests from the global mockRequests array
      const pendingRequests = mockRequests.filter(req => req.status === 'Pending')
        .sort((a, b) => new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime());
      setRequests(pendingRequests);
      setIsLoading(false);

      // Previous Firestore logic:
      // getPendingRequestsForTechnician()
      //   .then(data => {
      //     setRequests(data);
      //   })
      //   .catch(error => {
      //     console.error("Falha ao buscar pedidos do técnico via Firestore:", error);
      //     toast({
      //       title: "Erro ao Carregar Pedidos",
      //       description: "Não foi possível buscar os pedidos pendentes. Verifique sua conexão ou tente mais tarde.",
      //       variant: "destructive",
      //     });
      //   })
      //   .finally(() => {
      //     setIsLoading(false);
      //   });
    }
  }, [user]);

  return (
    <PageWrapper allowedRoles={['technician']}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-headline text-gray-800">Painel do Técnico</h1>
        <div className="flex items-center text-primary">
          <ClipboardList className="h-6 w-6 mr-2"/>
          <span>{requests.length} Pedido{requests.length !== 1 ? 's' : ''} Pendente{requests.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum Pedido Pendente</h2>
          <p className="text-muted-foreground">Todos os pedidos dos agricultores foram atendidos. Ótimo trabalho!</p>
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
