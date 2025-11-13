
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import FarmerList from '@/components/technician/farmers/FarmerList';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Search, ListFilter, TractorIcon, UserPlus, UserCheck, Clock, UserX, Building, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFarmersListWithRequestCounts } from '@/app/actions/farmerActions';
import type { User, RegistrationStatus } from '@/types';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';


export type FarmerWithRequestCount = User & { requestCount?: number };

export default function TechnicianFarmersPage() {
  const { user, initializing } = useAuth();
  const { toast } = useToast();
  const [farmers, setFarmers] = useState<FarmerWithRequestCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState<User | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');
  const [organizationalUnitFilter, setOrganizationalUnitFilter] = useState<string | 'all'>('all');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const assignedMunicipalities = useMemo(() => user?.assignedMunicipalities || [], [user]);

  useEffect(() => {
    if (initializing) return;
    if (user && ['technician', 'admin', 'Gestão', 'GabineteGov', 'Diagro', 'SDR'].includes(user.role)) {
      setIsLoading(true);
      
      const municipalitiesToFetch = user.role === 'technician' ? user.assignedMunicipalities : undefined;

      getFarmersListWithRequestCounts(municipalitiesToFetch)
        .then(setFarmers)
        .catch(error => {
          console.error("Falha ao buscar agricultores:", error);
          toast({ title: "Erro ao Carregar", description: "Não foi possível buscar a lista de agricultores.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    } else if (!initializing) {
        setIsLoading(false);
    }
  }, [user, initializing, toast]);

  const { filteredFarmers, statusCounts, orgUnitCounts, availableOrgUnits } = useMemo(() => {
    const orgUnits = new Set<string>();
    const orgCounts: Record<string, number> = {};

    farmers.forEach(farmer => {
      if (farmer.organizationalUnit) {
        orgUnits.add(farmer.organizationalUnit);
        orgCounts[farmer.organizationalUnit] = (orgCounts[farmer.organizationalUnit] || 0) + 1;
      }
    });

    let usersToFilter = farmers;

    if (organizationalUnitFilter !== 'all') {
      usersToFilter = usersToFilter.filter(farmer => farmer.organizationalUnit === organizationalUnitFilter);
    }
    
    if (statusFilter !== 'all') {
      usersToFilter = usersToFilter.filter(farmer => farmer.registrationStatus === statusFilter);
    }
    
    if (searchTerm) {
      usersToFilter = usersToFilter.filter(farmer => 
        farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (farmer.cpf && farmer.cpf.includes(searchTerm))
      );
    }
    
    setCurrentPage(1); // Reset to first page on filter change

    const counts = {
      confirmed: farmers.filter(f => f.registrationStatus === 'Confirmado').length,
      pending: farmers.filter(f => f.registrationStatus === 'Pendente').length,
      unfit: farmers.filter(f => f.registrationStatus === 'Inapto').length,
    };
    
    return {
      filteredFarmers: usersToFilter,
      statusCounts: counts,
      orgUnitCounts: orgCounts,
      availableOrgUnits: Array.from(orgUnits).sort()
    };
  }, [farmers, searchTerm, statusFilter, organizationalUnitFilter]);
  
  const totalFarmerCount = useMemo(() => farmers.length, [farmers]);

  const paginatedFarmers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredFarmers.slice(startIndex, endIndex);
  }, [filteredFarmers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredFarmers.length / itemsPerPage);

  const getStatusFilterDisplayName = (status: RegistrationStatus | 'all') => {
    switch (status) {
        case 'Confirmado': return 'Confirmados';
        case 'Pendente': return 'Pendentes';
        case 'Inapto': return 'Inaptos';
        default: return 'Todos os Status';
    }
  }
  
  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-muted-foreground">
            Exibindo {paginatedFarmers.length} de {filteredFarmers.length} agricultores.
        </span>
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                <ChevronsRight className="h-4 w-4" />
            </Button>
        </div>
    </div>
  );


  if (isLoading || initializing) {
    return (
      <PageWrapper allowedRoles={['technician', 'admin', 'Gestão', 'GabineteGov', 'Diagro', 'SDR']}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
          </div>
           <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper allowedRoles={['technician', 'admin', 'Gestão', 'GabineteGov', 'Diagro', 'SDR']}>
       <Dialog open={!!selectedFarmer} onOpenChange={(open) => !open && setSelectedFarmer(null)}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-headline text-gray-800">Agricultores</h1>
                <p className="text-muted-foreground">Visualize e cadastre agricultores.</p>
            </div>
            <div className="flex items-center gap-2">
                 <div className="flex items-center gap-2">
                    <Label htmlFor="items-per-page" className="text-sm font-medium whitespace-nowrap">Exibidos por página</Label>
                    <Select
                        value={String(itemsPerPage)}
                        onValueChange={(value) => setItemsPerPage(Number(value))}
                    >
                        <SelectTrigger id="items-per-page" className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 50, 100, 200, 500, 1000].map(val => (
                                <SelectItem key={val} value={String(val)}>{val}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                {user?.role === 'technician' && (
                <Button asChild className="bg-success text-success-foreground hover:bg-success/90">
                    <Link href={APP_ROUTES.TECHNICIAN_REGISTER_FARMER}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Cadastrar Agricultor
                    </Link>
                </Button>
                )}
            </div>
        </div>
        
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TractorIcon className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <span className="text-sm font-medium">Total de Agricultores</span>
                             <p className="text-xs text-muted-foreground">
                                {assignedMunicipalities.length > 0
                                    ? `Visíveis para suas unidades`
                                    : "Visíveis para todas as unidades"
                                }
                            </p>
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{totalFarmerCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <UserCheck className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium">Confirmados</span>
                    </div>
                    <div className="text-2xl font-bold">{statusCounts.confirmed}</div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-yellow-600" />
                    <span className="text-sm font-medium">Pendentes</span>
                    </div>
                    <div className="text-2xl font-bold">{statusCounts.pending}</div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <UserX className="h-6 w-6 text-red-600" />
                    <span className="text-sm font-medium">Inaptos</span>
                    </div>
                    <div className="text-2xl font-bold">{statusCounts.unfit}</div>
                </CardContent>
            </Card>
        </div>

        <div className="mb-6 bg-card p-4 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Buscar por nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10"
                    />
                </div>
                 <div className="w-full">
                    <Select value={organizationalUnitFilter} onValueChange={setOrganizationalUnitFilter}>
                        <SelectTrigger id="org-unit-filter" className="w-full">
                        <Building className="mr-2 h-4 w-4 text-primary" />
                        <SelectValue placeholder="Filtrar por unidade..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as Unidades ({farmers.length})</SelectItem>
                          {availableOrgUnits.map(unit => (
                            <SelectItem key={unit} value={unit}>{unit} ({orgUnitCounts[unit] || 0})</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="w-full">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RegistrationStatus | 'all')}>
                        <SelectTrigger id="status-filter" className="w-full">
                        <ListFilter className="mr-2 h-4 w-4 text-primary" />
                        <SelectValue placeholder="Filtrar por status..." />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="Confirmado">Confirmados ({statusCounts.confirmed})</SelectItem>
                        <SelectItem value="Pendente">Pendentes ({statusCounts.pending})</SelectItem>
                        <SelectItem value="Inapto">Inaptos ({statusCounts.unfit})</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>

        <FarmerList 
            farmers={paginatedFarmers} 
            onSelect={setSelectedFarmer}
            statusFilterDisplayName={getStatusFilterDisplayName(statusFilter)}
            hasSearchTerm={searchTerm.length > 0}
        />
        
        <PaginationControls />

        <DialogContent>
            <DialogHeader>
            <DialogTitle>{selectedFarmer?.name}</DialogTitle>
            <DialogDescription>Detalhes do cadastro do agricultor.</DialogDescription>
            </DialogHeader>
            {selectedFarmer && (
            <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className="text-right">CPF</Label>
                    <p>{selectedFarmer.cpf}</p>
                </div>
                 <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className="text-right">CAF</Label>
                    <p>{selectedFarmer.caf || 'Não informado'}</p>
                </div>
                 <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className="text-right">E-mail</Label>
                    <p>{selectedFarmer.email || 'Não informado'}</p>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className="text-right">Telefone</Label>
                    <p>{selectedFarmer.phone || 'Não informado'}</p>
                </div>
                 <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className="text-right">Endereço</Label>
                    <p>{selectedFarmer.address || 'Não informado'}</p>
                </div>
                 <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className="text-right">Município</Label>
                    <p>{selectedFarmer.municipality || 'Não informado'}</p>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className="text-right">Nº Familiares</Label>
                    <p>{selectedFarmer.familyMembers !== undefined ? selectedFarmer.familyMembers : 'Não informado'}</p>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className="text-right">Status</Label>
                    <p><Badge variant={selectedFarmer.registrationStatus === 'Confirmado' ? 'default' : selectedFarmer.registrationStatus === 'Inapto' ? 'destructive' : 'secondary'} className="text-xs font-medium">{selectedFarmer.registrationStatus || 'Pendente'}</Badge></p>
                </div>
                 {selectedFarmer.registeredByTechnicianName && (
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4 border-t pt-4 mt-2">
                        <Label className="text-right font-semibold">Registrado Por</Label>
                        <p>{selectedFarmer.registeredByTechnicianName}</p>
                    </div>
                )}
            </div>
            )}
        </DialogContent>
       </Dialog>
    </PageWrapper>
  );
}
