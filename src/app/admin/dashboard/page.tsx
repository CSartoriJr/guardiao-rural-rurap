
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import TechnicianRequestCard from '@/components/technician/RequestCard'; // Reusing for display
import type { AgriRequest, RequestStatus } from '@/types';
import { getAllRequestsForAdmin } from '@/services/requestService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { UserPlus, ClipboardList, Frown, Search, ListFilter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

const statusOptions: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'Pending', label: 'Pendente' },
  { value: 'Positive', label: 'Positivo' },
  { value: 'Negative', label: 'Negativo' },
  { value: 'Inconclusive', label: 'Inconclusivo' },
];

const getStatusDisplayName = (statusValue: RequestStatus | 'all'): string => {
  const option = statusOptions.find(opt => opt.value === statusValue);
  return option ? option.label : 'Status Desconhecido';
};


export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AgriRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [farmerSearchTerm, setFarmerSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');

  useEffect(() => {
    if (user && user.role === 'admin') {
      setIsLoading(true);
      getAllRequestsForAdmin()
        .then(data => {
          setRequests(data);
        })
        .catch(error => {
          console.error("Falha ao buscar todos os pedidos para admin via Firestore:", error);
          toast({
            title: "Erro ao Carregar Pedidos",
            description: "Não foi possível buscar os pedidos do sistema. Verifique sua conexão ou tente mais tarde.",
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

  const filteredRequests = useMemo(() => {
    let tempRequests = requests;

    if (statusFilter !== 'all') {
      tempRequests = tempRequests.filter(request => request.status === statusFilter);
    }

    if (farmerSearchTerm.trim()) {
      const lowercasedFilter = farmerSearchTerm.toLowerCase();
      tempRequests = tempRequests.filter(request =>
        (request.farmerName && request.farmerName.toLowerCase().includes(lowercasedFilter)) ||
        (request.farmerId && request.farmerId.toLowerCase().includes(lowercasedFilter))
      );
    }
    return tempRequests;
  }, [requests, farmerSearchTerm, statusFilter]);

  return (
    <PageWrapper allowedRoles={['admin']}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-headline text-gray-800">Painel do Administrador</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center text-primary bg-primary/10 px-3 py-2 rounded-md text-sm">
            <ClipboardList className="h-5 w-5 mr-2"/>
            <span>Pedidos Exibidos: {isLoading ? 'Carregando...' : filteredRequests.length}</span>
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
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Label htmlFor="status-filter" className="text-sm font-medium text-foreground">Filtrar por Status</Label>
           <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequestStatus | 'all')}>
            <SelectTrigger id="status-filter" className="w-full mt-1 bg-card">
              <ListFilter className="mr-2 h-4 w-4 text-primary" />
              <SelectValue placeholder="Filtrar por status..." />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            { (farmerSearchTerm.trim() || statusFilter !== 'all') && requests.length > 0
              ? `Nenhum pedido encontrado para os filtros aplicados.`
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

