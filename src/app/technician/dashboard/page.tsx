'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import TechnicianRequestCard from '@/components/technician/RequestCard';
import type { AgriRequest, User as AppUser, RegistrationStatus, RequestStatus } from '@/types';
import { getAllRequestsForAdmin as getAllRequestsSystemWide } from '@/services/requestService'; 
import { useAuth } from '@/hooks/useAuth';
import { ClipboardList, Frown, PlusCircle, UserPlus, ListFilter, MapPin, Search, Building, Clock, CheckCircle, XCircle, HelpCircle, AlertCircle } from 'lucide-react';
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
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [organizationalUnitFilter, setOrganizationalUnitFilter] = useState<string | 'all'>('all');
  const [municipalityFilter, setMunicipalityFilter] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState<RequestStatus | 'all'>('Pending');


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

  const baseRequests = useMemo(() => {
    if (!user) return [];
    const hasAssignedMunicipalities = user.role === 'technician' && user.assignedMunicipalities && user.assignedMunicipalities.length > 0;
    if (hasAssignedMunicipalities) {
      return allRequests.filter(req => req.municipality && user.assignedMunicipalities!.includes(req.municipality));
    }
    return allRequests;
  }, [allRequests, user]);
  
  const { technicianVisibleRequests, registrationStatusCounts, requestStatusCounts, municipalityCounts, orgUnitCounts, availableMunicipalities, availableOrganizationalUnits } = useMemo(() => {
    const initialResult = { 
        technicianVisibleRequests: [], 
        registrationStatusCounts: { all: 0, Confirmed: 0, Pending: 0, Inapto: 0 },
        requestStatusCounts: { all: 0, Pending: 0, Positive: 0, Negative: 0, Inconclusive: 0, 'Suspeita de Infecção': 0 },
        municipalityCounts: {} as Record<string, number>,
        orgUnitCounts: {} as Record<string, number>,
        availableMunicipalities: [] as string[],
        availableOrganizationalUnits: [] as string[]
    };

    if (!user || baseRequests.length === 0 || allUsers.length === 0) {
      return initialResult;
    }
    
    const availableMuniSet = new Set<string>();
    const availableOrgUnitSet = new Set<string>();
    baseRequests.forEach(req => {
      if(req.municipality) {
        availableMuniSet.add(req.municipality);
        initialResult.municipalityCounts[req.municipality] = (initialResult.municipalityCounts[req.municipality] || 0) + 1;
      }
      if(req.organizationalUnit) {
        availableOrgUnitSet.add(req.organizationalUnit);
        initialResult.orgUnitCounts[req.organizationalUnit] = (initialResult.orgUnitCounts[req.organizationalUnit] || 0) + 1;
      }
    });

    initialResult.availableMunicipalities = Array.from(availableMuniSet).sort();
    initialResult.availableOrganizationalUnits = Array.from(availableOrgUnitSet).sort();
    
    const usersMap = new Map(allUsers.map(u => [u.id, u]));
    
    const enrichedRequests = baseRequests.map(req => {
      const farmer = usersMap.get(req.farmerId);
      return {
        ...req,
        farmerRegistrationStatus: farmer?.registrationStatus,
      };
    });

    let filteredForStatusCounts = enrichedRequests;
    if (organizationalUnitFilter !== 'all') {
      filteredForStatusCounts = filteredForStatusCounts.filter(req => req.organizationalUnit === organizationalUnitFilter);
    }
    if (municipalityFilter !== 'all') {
      filteredForStatusCounts = filteredForStatusCounts.filter(req => req.municipality === municipalityFilter);
    }
    
    initialResult.requestStatusCounts = {
        all: filteredForStatusCounts.length,
        'Pending': filteredForStatusCounts.filter(req => req.status === 'Pending').length,
        'Positive': filteredForStatusCounts.filter(req => req.status === 'Positive').length,
        'Negative': filteredForStatusCounts.filter(req => req.status === 'Negative').length,
        'Inconclusive': filteredForStatusCounts.filter(req => req.status === 'Inconclusive').length,
        'Suspeita de Infecção': filteredForStatusCounts.filter(req => req.status === 'Suspeita de Infecção').length
    }

    initialResult.registrationStatusCounts = {
      all: filteredForStatusCounts.length,
      Confirmed: filteredForStatusCounts.filter(req => req.farmerRegistrationStatus === 'Confirmado').length,
      Pending: filteredForStatusCounts.filter(req => req.farmerRegistrationStatus === 'Pendente').length,
      Inapto: filteredForStatusCounts.filter(req => req.farmerRegistrationStatus === 'Inapto').length,
    };
    
    let finalFilteredRequests = filteredForStatusCounts;

    if (statusFilter !== 'all') {
      finalFilteredRequests = finalFilteredRequests.filter(req => req.farmerRegistrationStatus === statusFilter);
    }
    
    if (requestStatusFilter !== 'all') {
        finalFilteredRequests = finalFilteredRequests.filter(req => req.status === requestStatusFilter);
    }
    
    if (searchQuery) {
        finalFilteredRequests = finalFilteredRequests.filter(req => 
            req.farmerName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    initialResult.technicianVisibleRequests = finalFilteredRequests;

    return initialResult;

  }, [baseRequests, allUsers, user, statusFilter, municipalityFilter, searchQuery, organizationalUnitFilter, requestStatusFilter]);


  return (
    <PageWrapper allowedRoles={['technician']}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-headline text-gray-800">Painel do Técnico</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
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
      
      <div className="flex flex-col md:flex-row items-end justify-between gap-2 mb-8">
        <div className="flex flex-col sm:flex-row items-end gap-2 w-full flex-wrap">
            <div className="w-full sm:w-auto sm:min-w-[150px]">
                <Label htmlFor="search-input" className="sr-only">Buscar</Label>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="search-input"
                        type="text"
                        placeholder="Buscar por agricultor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 h-9 text-xs"
                    />
                </div>
            </div>
            <div className="w-full sm:w-auto sm:max-w-[220px]">
                <Label htmlFor="organizational-unit-filter" className="text-xs text-muted-foreground">Unidade</Label>
                <Select value={organizationalUnitFilter} onValueChange={(value) => setOrganizationalUnitFilter(value)}>
                    <SelectTrigger id="organizational-unit-filter" className="w-full h-9 text-xs">
                    <Building className="mr-1.5 h-3.5 w-3.5" />
                    <SelectValue placeholder="Filtrar unidade..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Unidades ({baseRequests.length})</SelectItem>
                        {availableOrganizationalUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit} ({orgUnitCounts[unit] || 0})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="w-full sm:w-auto sm:max-w-[220px]">
                <Label htmlFor="municipality-filter" className="text-xs text-muted-foreground">Município</Label>
                <Select value={municipalityFilter} onValueChange={(value) => setMunicipalityFilter(value)}>
                    <SelectTrigger id="municipality-filter" className="w-full h-9 text-xs">
                    <MapPin className="mr-1.5 h-3.5 w-3.5" />
                    <SelectValue placeholder="Filtrar município..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Municípios ({baseRequests.length})</SelectItem>
                        {availableMunicipalities.map(muni => (
                        <SelectItem key={muni} value={muni}>{muni} ({municipalityCounts[muni] || 0})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="w-full sm:w-auto sm:max-w-[220px]">
                <Label htmlFor="status-filter" className="text-xs text-muted-foreground">Cadastro</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RegistrationStatus | 'all')}>
                    <SelectTrigger id="status-filter" className="w-full h-9 text-xs">
                    <ListFilter className="mr-1.5 h-3.5 w-3.5" />
                    <SelectValue placeholder="Filtrar status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status ({registrationStatusCounts.all})</SelectItem>
                        <SelectItem value="Confirmado">Confirmado ({registrationStatusCounts.Confirmed})</SelectItem>
                        <SelectItem value="Pendente">Pendente ({registrationStatusCounts.Pending})</SelectItem>
                        <SelectItem value="Inapto">Inapto ({registrationStatusCounts.Inapto})</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="w-full sm:w-auto sm:max-w-[220px]">
                <Label htmlFor="request-status-filter" className="text-xs text-muted-foreground">Solicitação</Label>
                <Select value={requestStatusFilter} onValueChange={(value) => setRequestStatusFilter(value as RequestStatus | 'all')}>
                    <SelectTrigger id="request-status-filter" className="w-full h-9 text-xs">
                    <ListFilter className="mr-1.5 h-3.5 w-3.5" />
                    <SelectValue placeholder="Filtrar status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status ({requestStatusCounts.all})</SelectItem>
                        <SelectItem value="Pending"><Clock className="mr-2 h-4 w-4 inline-block" />Pendente ({requestStatusCounts.Pending})</SelectItem>
                        <SelectItem value="Positive"><CheckCircle className="mr-2 h-4 w-4 inline-block text-green-600" />Positivo ({requestStatusCounts.Positive})</SelectItem>
                        <SelectItem value="Negative"><XCircle className="mr-2 h-4 w-4 inline-block text-red-600" />Possivelmente Negativo ({requestStatusCounts.Negative})</SelectItem>
                        <SelectItem value="Inconclusive"><HelpCircle className="mr-2 h-4 w-4 inline-block text-yellow-600" />Inconclusivo ({requestStatusCounts.Inconclusive})</SelectItem>
                        <SelectItem value="Suspeita de Infecção"><AlertCircle className="mr-2 h-4 w-4 inline-block text-orange-500" />Suspeita de Infecção ({requestStatusCounts['Suspeita de Infecção']})</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto justify-end mt-2 md:mt-0">
             <div className="flex items-center text-primary bg-primary/10 px-3 py-2 rounded-md text-sm shrink-0">
                <ClipboardList className="h-5 w-5 mr-2"/>
                <span>{isLoading ? '...' : `Exibindo ${technicianVisibleRequests.length}`}</span>
            </div>
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
