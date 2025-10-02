'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import TechnicianRequestCard from '@/components/technician/RequestCard';
import type { AgriRequest, User as AppUser, RegistrationStatus } from '@/types';
import { getAllRequestsForAdmin as getAllRequestsSystemWide } from '@/services/requestService'; 
import { useAuth } from '@/hooks/useAuth';
import { ClipboardList, Frown, PlusCircle, UserPlus, ListFilter, MapPin, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { collection, getDocs, query } from 'firebase/firestore';
import { db, firebaseInitializedCorrectly } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const fetchAllUsers = async (): Promise<AppUser[]> => {
  if (!firebaseInitializedCorrectly || !db) return [];
  const usersCollectionRef = collection(db, 'users');
  const userSnapshot = await getDocs(query(usersCollectionRef));
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
};

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allRequests, setAllRequests] = useState<AgriRequest[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');
  const [municipalityFilter, setMunicipalityFilter] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      
      Promise.all([
        getAllRequestsSystemWide(),
        fetchAllUsers()
      ]).then(([requestsData, usersData]) => {
          setAllRequests(requestsData);
          setAllUsers(usersData);
      }).catch(error => {
          console.error("Falha ao buscar dados para o painel do técnico:", error);
          toast({
            title: "Erro ao Carregar Dados",
            description: "Não foi possível buscar as solicitações ou usuários. Verifique sua conexão ou tente mais tarde.",
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

  const { technicianVisibleRequests, statusCounts, availableMunicipalities } = useMemo(() => {
    const initialResult = { 
        technicianVisibleRequests: [], 
        statusCounts: { all: 0, Confirmed: 0, Pending: 0, Unfit: 0 },
        availableMunicipalities: [] as string[]
    };

    if (!user || allRequests.length === 0 || allUsers.length === 0) {
      return initialResult;
    }
    
    const hasAssignedMunicipalities = user.role === 'technician' && user.assignedMunicipalities && user.assignedMunicipalities.length > 0;

    let baseRequests = allRequests;
    let availableMuniSet = new Set<string>();

    if (hasAssignedMunicipalities) {
      baseRequests = allRequests.filter(req => {
        const isInAssigned = req.municipality && user.assignedMunicipalities!.includes(req.municipality);
        if(isInAssigned) availableMuniSet.add(req.municipality!);
        return isInAssigned;
      });
      initialResult.availableMunicipalities = user.assignedMunicipalities!.sort();
    } else {
        allRequests.forEach(req => {
            if(req.municipality) availableMuniSet.add(req.municipality);
        });
        initialResult.availableMunicipalities = Array.from(availableMuniSet).sort();
    }
    
    const usersMap = new Map(allUsers.map(u => [u.id, u]));
    
    let enrichedRequests = baseRequests.map(req => {
      const farmer = usersMap.get(req.farmerId);
      return {
        ...req,
        farmerRegistrationStatus: farmer?.registrationStatus,
      };
    });

    if (municipalityFilter !== 'all') {
      enrichedRequests = enrichedRequests.filter(req => req.municipality === municipalityFilter);
    }
    
    initialResult.statusCounts = {
      all: enrichedRequests.length,
      Confirmed: enrichedRequests.filter(req => req.farmerRegistrationStatus === 'Confirmado').length,
      Pending: enrichedRequests.filter(req => req.farmerRegistrationStatus === 'Pendente').length,
      Unfit: enrichedRequests.filter(req => req.farmerRegistrationStatus === 'Inapto').length,
    };

    let filteredRequests = enrichedRequests;

    if (statusFilter !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.farmerRegistrationStatus === statusFilter);
    }
    
    if (searchQuery) {
        filteredRequests = filteredRequests.filter(req => 
            req.farmerName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    initialResult.technicianVisibleRequests = filteredRequests;

    return initialResult;

  }, [allRequests, allUsers, user, statusFilter, municipalityFilter, searchQuery]);


  return (
    <PageWrapper allowedRoles={['technician']}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-headline text-gray-800">Painel do Técnico</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto sm:min-w-[150px]">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Buscar por agricultor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 h-9 text-xs"
            />
          </div>
          <div className="w-full sm:w-auto sm:max-w-[220px]">
            <Label htmlFor="municipality-filter" className="sr-only">Filtrar por Município</Label>
            <Select value={municipalityFilter} onValueChange={(value) => setMunicipalityFilter(value)}>
                <SelectTrigger id="municipality-filter" className="w-full h-9 text-xs">
                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Filtrar município..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Municípios</SelectItem>
                    {availableMunicipalities.map(muni => (
                      <SelectItem key={muni} value={muni}>{muni}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-auto sm:max-w-[220px]">
            <Label htmlFor="status-filter" className="sr-only">Filtrar por Status do Cadastro</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RegistrationStatus | 'all')}>
                <SelectTrigger id="status-filter" className="w-full h-9 text-xs">
                <ListFilter className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Filtrar status..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Status ({statusCounts.all})</SelectItem>
                    <SelectItem value="Confirmado">Confirmado ({statusCounts.Confirmed})</SelectItem>
                    <SelectItem value="Pendente">Pendente ({statusCounts.Pending})</SelectItem>
                    <SelectItem value="Inapto">Inapto ({statusCounts.Unfit})</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="flex items-center text-primary bg-primary/10 px-3 py-2 rounded-md text-sm shrink-0">
            <ClipboardList className="h-5 w-5 mr-2"/>
            <span>{isLoading ? '...' : `Exibindo ${technicianVisibleRequests.length}`}</span>
          </div>
           <Link href={APP_ROUTES.TECHNICIAN_SUBMIT_REQUEST} passHref className="w-full sm:w-auto">
            <Button className="bg-primary hover:bg-primary/90 w-full">
              <PlusCircle className="mr-2 h-5 w-5" /> Nova Solicitação
            </Button>
          </Link>
          <Link href={APP_ROUTES.TECHNICIAN_REGISTER_FARMER} passHref className="w-full sm:w-auto">
            <Button className="bg-success text-success-foreground hover:bg-success/90 w-full">
              <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Agricultor
            </Button>
          </Link>
        </div>
      </div>
      
      {isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : technicianVisibleRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicianVisibleRequests.map(request => (
            <TechnicianRequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <Frown className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Nenhuma Solicitação Encontrada
          </h2>
          <p className="text-muted-foreground">
            {searchQuery 
                ? `Nenhuma solicitação encontrada para "${searchQuery}".`
                : statusFilter !== 'all' 
                    ? `Não há solicitações com o status de cadastro "${statusFilter}".` 
                    : 'Não há solicitações designadas a você com os filtros atuais.'
            }
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
