
'use client';
import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import FarmerRequestCard from '@/components/farmer/RequestCard';
import type { AgriRequest } from '@/types';
import { getRequestsForFarmer } from '@/services/requestService'; // Changed to Firestore service
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { PlusCircle, Frown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';


export default function FarmerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast(); 
  const [requests, setRequests] = useState<AgriRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.id) {
      setIsLoading(true);
      getRequestsForFarmer(user.id)
        .then(data => {
          setRequests(data);
        })
        .catch(error => {
          console.error("Failed to fetch requests from Firestore:", error);
          toast({
            title: "Erro ao Carregar Pedidos",
            description: "Não foi possível buscar seus pedidos. Verifique sua conexão ou tente mais tarde.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (user === null) { // Explicitly handle case where user is null (not just undefined during init)
        setIsLoading(false); // Stop loading if user is definitely not logged in
    }
  }, [user, toast]);

  return (
    <PageWrapper allowedRoles={['farmer']}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-headline text-gray-800">Meus Pedidos</h1>
        <Link href={APP_ROUTES.FARMER_SUBMIT_REQUEST} passHref>
          <Button className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-5 w-5" /> Criar Novo Pedido
          </Button>
        </Link>
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
            <FarmerRequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <Frown className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum Pedido Ainda</h2>
          <p className="text-muted-foreground mb-6">Você ainda não enviou nenhum pedido. Comece criando um!</p>
          <Link href={APP_ROUTES.FARMER_SUBMIT_REQUEST} passHref>
            <Button className="bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Criar Primeiro Pedido
            </Button>
          </Link>
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
    <Skeleton className="h-4 w-1/2" />
    <div className="flex justify-center sm:justify-start -space-x-2 overflow-hidden my-2">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-16 w-16 rounded-full" />
    </div>
    <Skeleton className="h-8 w-full" />
     <Skeleton className="h-10 w-full" />
  </div>
);

