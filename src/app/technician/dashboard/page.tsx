
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import TechnicianRequestCard from '@/components/technician/RequestCard';
import type { AgriRequest, RequestStatus } from '@/types';
import { getAllRequestsForAdmin as getAllRequestsSystemWide } from '@/services/requestService'; // Renamed for clarity
import { useAuth } from '@/hooks/useAuth';
import { ClipboardList, Frown, ListFilter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
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

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allRequests, setAllRequests] = useState<AgriRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all'); // Default to all

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getAllRequestsSystemWide() // Fetch all requests
        .then(data => {
          setAllRequests(data);
        })
        .catch(error => {
          console.error("Falha ao buscar todos os Levantamentos para técnico via Firestore:", error);
          toast({
            title: "Erro ao Carregar Levantamentos",
            description: "Não foi possível buscar os Levantamentos do sistema. Verifique sua conexão ou tente mais tarde.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (user === null) {
        setIsLoading(false);
    }
  }, [user, toast]);

  const statusCounts = useMemo(() => {
    if (!allRequests) return { Pending: 0, Positive: 0, Negative: 0, Inconclusive: 0, all: 0 };
    return {
      Pending: allRequests.filter(req => req.status === 'Pending').length,
      Positive: allRequests.filter(req => req.status === 'Positive').length,
      Negative: allRequests.filter(req => req.status === 'Negative').length,
      Inconclusive: allRequests.filter(req => req.status === 'Inconclusive').length,
      all: allRequests.length,
    };
  }, [allRequests]);

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') {
      return allRequests;
    }
    return allRequests.filter(request => request.status === statusFilter);
  }, [allRequests, statusFilter]);

  const getHeaderText = () => {
    if (isLoading) return 'Carregando...';
    const count = filteredRequests.length;
    const noun = count === 1 ? 'Levantamento' : 'Levantamentos';
    if (statusFilter === 'all') {
      return `${count} ${noun} Exibido${count === 1 ? '' : 's'}`;
    }
    return `${count} ${noun} ${getStatusDisplayName(statusFilter)}${count === 1 ? '' : 's'}`;
  };

  return (
    <PageWrapper allowedRoles={['technician']}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-headline text-gray-800">Painel do Técnico</h1>
        <div className="flex items-center text-primary bg-primary/10 px-3 py-2 rounded-md text-sm">
          <ClipboardList className="h-5 w-5 mr-2"/>
          <span>{getHeaderText()}</span>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-start items-center gap-4">
        <div className="w-full sm:w-auto sm:min-w-[250px]"> {/* Adjusted min-width for longer text */}
          <Label htmlFor="status-filter" className="text-sm font-medium text-foreground">Filtrar por Status</Label>
           <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequestStatus | 'all')}>
            <SelectTrigger id="status-filter" className="w-full mt-1 bg-card">
              <ListFilter className="mr-2 h-4 w-4 text-primary" />
              <SelectValue placeholder="Filtrar por status..." />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} ({option.value === 'all' ? statusCounts.all : statusCounts[option.value as RequestStatus]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Nenhum Levantamento Encontrado
          </h2>
          <p className="text-muted-foreground">
            {statusFilter !== 'all' && allRequests.length > 0
              ? `Nenhum Levantamento encontrado com o status "${getStatusDisplayName(statusFilter)}".`
              : `Não há Levantamentos com o status "${getStatusDisplayName(statusFilter)}" no momento.`}
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
