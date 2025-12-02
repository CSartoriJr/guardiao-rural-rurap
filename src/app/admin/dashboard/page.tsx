'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import TechnicianRequestCard from '@/components/technician/RequestCard'; // Reusing for display
import type { AgriRequest, User as AppUser, RegistrationStatus, RequestStatus } from '@/types';
import { getAllRequestsForAdmin } from '@/services/requestService'; // Changed to system-wide fetch
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { ClipboardList, Frown, Search, Building, MapPin, ListFilter, AlertCircle, CheckCircle, HelpCircle, XCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, firebaseInitializedCorrectly } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [organizationalUnitFilter, setOrganizationalUnitFilter] = useState<string | 'all'>('all');
  const [municipalityFilter, setMunicipalityFilter] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState<RequestStatus | 'all'>('all');


  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'Gestão')) {
      setIsLoading(true);
      Promise.all([
        getAllRequestsForAdmin(),
        fetchAllUsers()
      ]).then(([requestsData, usersData]) => {
          const usersMap = new Map(usersData.map(u => [u.id, u]));
          const enrichedRequests = requestsData.map(req => ({
            ...req,
            farmerRegistrationStatus: usersMap.get(req.farmerId)?.registrationStatus,
          }));
          setAllRequests(enrichedRequests);
          setAllUsers(usersData);
      }).catch(error => {
          console.error("Falha ao buscar dados para o painel de admin:", error);
          toast({
            title: "Erro ao Carregar Dados",
            description: "Não foi possível buscar as solicitações ou usuários. Verifique sua conexão ou tente mais tarde.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (user === null && user?.role !== 'admin' && user?.role !== 'Gestão') {
        setIsLoading(false);
    }
  }, [user, toast]);
  
  const usersRequestingDeletion = useMemo(() => {
    return allUsers.filter(u => u.registrationStatus === 'Excluir');
  }, [allUsers]);
  
  const { filteredRequests, counts } = useMemo(() => {
    // 1. Base filter for search query
    let baseFiltered = allRequests;
    if (searchQuery) {
        baseFiltered = baseFiltered.filter(req => 
            req.farmerName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // 2. Calculate counts for each filter dropdown, based on OTHER active filters
    const calculateCounts = (
      items: AgriRequest[],
      activeFilters: { org?: string; muni?: string; reg?: string; req?: string }
    ) => {
        const count = (list: AgriRequest[]) => ({
            orgUnitCounts: list.reduce((acc, req) => { if(req.organizationalUnit) acc[req.organizationalUnit] = (acc[req.organizationalUnit] || 0) + 1; return acc; }, {} as Record<string, number>),
            municipalityCounts: list.reduce((acc, req) => { if(req.municipality) acc[req.municipality] = (acc[req.municipality] || 0) + 1; return acc; }, {} as Record<string, number>),
            registrationStatusCounts: list.reduce((acc, req) => { if(req.farmerRegistrationStatus) acc[req.farmerRegistrationStatus] = (acc[req.farmerRegistrationStatus] || 0) + 1; return acc; }, {} as Record<RegistrationStatus, number>),
            requestStatusCounts: list.reduce((acc, req) => { acc[req.status] = (acc[req.status] || 0) + 1; return acc; }, {} as Record<RequestStatus, number>),
        });
        
        const orgContext = count(items.filter(i => (!activeFilters.muni || i.municipality === activeFilters.muni) && (!activeFilters.reg || i.farmerRegistrationStatus === activeFilters.reg) && (!activeFilters.req || i.status === activeFilters.req)));
        const muniContext = count(items.filter(i => (!activeFilters.org || i.organizationalUnit === activeFilters.org) && (!activeFilters.reg || i.farmerRegistrationStatus === activeFilters.reg) && (!activeFilters.req || i.status === activeFilters.req)));
        const regStatusContext = count(items.filter(i => (!activeFilters.org || i.organizationalUnit === activeFilters.org) && (!activeFilters.muni || i.municipality === activeFilters.muni) && (!activeFilters.req || i.status === activeFilters.req)));
        const reqStatusContext = count(items.filter(i => (!activeFilters.org || i.organizationalUnit === activeFilters.org) && (!activeFilters.muni || i.municipality === activeFilters.muni) && (!activeFilters.reg || i.farmerRegistrationStatus === activeFilters.reg)));

        return {
            orgUnitCounts: orgContext.orgUnitCounts,
            municipalityCounts: muniContext.municipalityCounts,
            registrationStatusCounts: regStatusContext.registrationStatusCounts,
            requestStatusCounts: reqStatusContext.requestStatusCounts,
        };
    };

    const activeFiltersForCounts = {
        org: organizationalUnitFilter !== 'all' ? organizationalUnitFilter : undefined,
        muni: municipalityFilter !== 'all' ? municipalityFilter : undefined,
        reg: statusFilter !== 'all' ? statusFilter : undefined,
        req: requestStatusFilter !== 'all' ? requestStatusFilter : undefined,
    };
    
    const calculatedCounts = calculateCounts(baseFiltered, activeFiltersForCounts);

    // 3. Get the final list to display by applying ALL active filters
    let displayList = baseFiltered;
    if (organizationalUnitFilter !== 'all') displayList = displayList.filter(req => req.organizationalUnit === organizationalUnitFilter);
    if (municipalityFilter !== 'all') displayList = displayList.filter(req => req.municipality === municipalityFilter);
    if (statusFilter !== 'all') displayList = displayList.filter(req => req.farmerRegistrationStatus === statusFilter);
    if (requestStatusFilter !== 'all') displayList = displayList.filter(req => req.status === requestStatusFilter);
    
    // 4. Get available options for dropdowns from the full dataset (not filtered)
    const availableMunicipalities = Array.from(new Set(allRequests.map(r => r.municipality).filter(Boolean as any))).sort();
    const availableOrganizationalUnits = Array.from(new Set(allRequests.map(r => r.organizationalUnit).filter(Boolean as any))).sort();

    return {
        filteredRequests: displayList,
        counts: {
            ...calculatedCounts,
            registrationStatusCounts: { all: Object.values(calculatedCounts.registrationStatusCounts).reduce((a,b) => a+b, 0), ...calculatedCounts.registrationStatusCounts },
            requestStatusCounts: { all: Object.values(calculatedCounts.requestStatusCounts).reduce((a,b) => a+b, 0), ...calculatedCounts.requestStatusCounts },
            availableMunicipalities,
            availableOrganizationalUnits,
        }
    };
  }, [allRequests, searchQuery, organizationalUnitFilter, municipalityFilter, statusFilter, requestStatusFilter]);


  return (
    <PageWrapper allowedRoles={['admin', 'Gestão']}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-headline text-gray-800">Painel do Administrador</h1>
      </div>

      {usersRequestingDeletion.length > 0 && user?.role === 'admin' && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ação Necessária: Solicitações de Exclusão</AlertTitle>
          <AlertDescription>
            {usersRequestingDeletion.length} agricultor(es) solicitaram a exclusão de suas contas.
            <Button asChild variant="link" className="p-0 h-auto ml-2 text-destructive font-semibold">
              <Link href={`${APP_ROUTES.ADMIN_MANAGE_USERS}?status=Excluir`}>
                Ir para Gerenciamento de Usuários
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}


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
                        <SelectItem value="all">Todas as Unidades ({Object.values(counts.orgUnitCounts).reduce((a,b) => a + b, 0)})</SelectItem>
                        {counts.availableOrganizationalUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit} ({counts.orgUnitCounts[unit] || 0})</SelectItem>
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
                        <SelectItem value="all">Todos os Municípios ({Object.values(counts.municipalityCounts).reduce((a,b) => a + b, 0)})</SelectItem>
                        {counts.availableMunicipalities.map(muni => (
                        <SelectItem key={muni} value={muni}>{muni} ({counts.municipalityCounts[muni] || 0})</SelectItem>
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
                        <SelectItem value="all">Todos os Status ({counts.registrationStatusCounts.all})</SelectItem>
                        <SelectItem value="Confirmado">Confirmado ({counts.registrationStatusCounts.Confirmado || 0})</SelectItem>
                        <SelectItem value="Pendente">Pendente ({counts.registrationStatusCounts.Pendente || 0})</SelectItem>
                        <SelectItem value="Inapto">Inapto ({counts.registrationStatusCounts.Inapto || 0})</SelectItem>
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
                        <SelectItem value="all">Todos os Status ({counts.requestStatusCounts.all})</SelectItem>
                        <SelectItem value="Pending"><Clock className="mr-2 h-4 w-4 inline-block" />Pendente ({counts.requestStatusCounts.Pending || 0})</SelectItem>
                        <SelectItem value="Positive"><CheckCircle className="mr-2 h-4 w-4 inline-block text-green-600" />Positivo ({counts.requestStatusCounts.Positive || 0})</SelectItem>
                        <SelectItem value="Negative"><XCircle className="mr-2 h-4 w-4 inline-block text-red-600" />Possivelmente Negativo ({counts.requestStatusCounts.Negative || 0})</SelectItem>
                        <SelectItem value="Inconclusive"><HelpCircle className="mr-2 h-4 w-4 inline-block text-yellow-600" />Inconclusivo ({counts.requestStatusCounts.Inconclusive || 0})</SelectItem>
                        <SelectItem value="Suspeita de Infecção"><AlertCircle className="mr-2 h-4 w-4 inline-block text-orange-500" />Suspeita de Infecção ({counts.requestStatusCounts['Suspeita de Infecção'] || 0})</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto justify-end mt-2 md:mt-0">
             <div className="flex items-center text-primary bg-primary/10 px-3 py-2 rounded-md text-sm shrink-0">
                <ClipboardList className="h-5 w-5 mr-2"/>
                <span>{isLoading ? '...' : `Exibindo ${filteredRequests.length}`} de {allRequests.length}</span>
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
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhuma Solicitação Encontrada</h2>
          <p className="text-muted-foreground">
            {searchQuery 
                ? `Nenhuma solicitação encontrada para "${searchQuery}".`
                : statusFilter !== 'all' 
                    ? `Não há solicitações com o status de cadastro "${statusFilter}".` 
                    : 'Não há solicitações registradas no sistema com os filtros atuais.'}
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

    