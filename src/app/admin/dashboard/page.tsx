
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import TechnicianRequestCard from '@/components/technician/RequestCard'; // Reusing for display
import type { AgriRequest } from '@/types';
import { mockRequests } from '@/lib/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { UserPlus, ClipboardList, Frown, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';

// Mock function to fetch all requests for admin
const fetchAllRequestsForAdmin = async (): Promise<AgriRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  return mockRequests.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()); // Newest first
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AgriRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [farmerSearchTerm, setFarmerSearchTerm] = useState<string>('');

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAllRequestsForAdmin()
        .then(data => {
          setRequests(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Falha ao buscar todos os pedidos para admin:", error);
          setIsLoading(false);
        });
    }
  }, [user]);

  const filteredRequests = useMemo(() => {
    if (!farmerSearchTerm.trim()) {
      return requests;
    }
    const lowercasedFilter = farmerSearchTerm.toLowerCase();
    return requests.filter(request =>
      (request.farmerName && request.farmerName.toLowerCase().includes(lowercasedFilter)) ||
      request.farmerId.toLowerCase().includes(lowercasedFilter)
    );
  }, [requests, farmerSearchTerm]);

  return (
    <PageWrapper allowedRoles={['admin']}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-headline text-gray-800">Painel do Administrador</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center text-primary bg-primary/10 px-3 py-2 rounded-md text-sm">
            <ClipboardList className="h-5 w-5 mr-2"/>
            <span>Pedidos Exibidos: {filteredRequests.length}</span>
          </div>
          <Link href={APP_ROUTES.ADMIN_CREATE_TECHNICIAN} passHref>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
              <UserPlus className="mr-2 h-5 w-5" /> Criar Novo Técnico
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-start items-center gap-4">
        <div className="w-full sm:w-auto sm:min-w-[300px]">
          <Label htmlFor="farmer-search" className="text-sm font-medium text-foreground">Buscar Pedidos por Agricultor</Label>
          <div className="relative mt-1">
            <Input
              id="farmer-search"
              type="text"
              placeholder="Nome ou ID do agricultor..."
              value={farmerSearchTerm}
              onChange={(e) => setFarmerSearchTerm(e.target.value)}
              className="w-full bg-card border-border pl-10"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map(request => (
            <TechnicianRequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <Frown className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum Pedido Encontrado</h2>
          <p className="text-muted-foreground">
            {farmerSearchTerm.trim() && requests.length > 0
              ? `Nenhum pedido encontrado para "${farmerSearchTerm}".`
              : 'Ainda não há pedidos registrados no sistema.'}
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

