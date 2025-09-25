'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import FarmerList from '@/components/technician/farmers/FarmerList';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, Home, MapPin, Phone, Mail, TractorIcon, UserPlus, Info, UserCheck, Clock, UserX, ListFilter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFarmersList } from '@/app/actions/farmerActions';
import type { User, RegistrationStatus } from '@/types';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { Badge } from '@/components/ui/badge';


export default function TechnicianFarmersPage() {
  const { user, initializing } = useAuth();
  const { toast } = useToast();
  const [farmers, setFarmers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');
  
  const assignedMunicipalities = useMemo(() => user?.assignedMunicipalities || [], [user]);

  useEffect(() => {
    if (initializing) return;
    if (user && user.role === 'technician') {
      setIsLoading(true);
      getFarmersList(user.assignedMunicipalities)
        .then(data => {
          setFarmers(data);
        })
        .catch(error => {
          console.error("Falha ao buscar agricultores:", error);
          toast({ title: "Erro ao Carregar", description: "Não foi possível buscar a lista de agricultores.", variant: "destructive" });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!initializing) {
        setIsLoading(false);
    }
  }, [user, initializing, toast]);

  const filteredFarmers = useMemo(() => {
    return farmers.filter(farmer => {
      const matchesSearch = farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (farmer.cpf && farmer.cpf.includes(searchTerm));
      const matchesStatus = statusFilter === 'all' || farmer.registrationStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [farmers, searchTerm, statusFilter]);
  
  const statusCounts = useMemo(() => {
    return {
      confirmed: farmers.filter(f => f.registrationStatus === 'Confirmado').length,
      pending: farmers.filter(f => f.registrationStatus === 'Pendente').length,
      unfit: farmers.filter(f => f.registrationStatus === 'Inapto').length,
    };
  }, [farmers]);

  const totalFarmerCount = useMemo(() => farmers.length, [farmers]);

  const getStatusFilterDisplayName = (status: RegistrationStatus | 'all') => {
    switch (status) {
        case 'Confirmado': return 'Confirmados';
        case 'Pendente': return 'Pendentes';
        case 'Inapto': return 'Inaptos';
        default: return 'Todos os Status';
    }
  }

  if (isLoading || initializing) {
    return (
      <PageWrapper allowedRoles={['technician']}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-8 w-2/5" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
                <CardContent className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent>
                <div className="p-4 pt-0"><Skeleton className="h-10 w-full" /></div>
              </Card>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper allowedRoles={['technician']}>
       <Dialog open={!!selectedFarmer} onOpenChange={(open) => !open && setSelectedFarmer(null)}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-headline text-gray-800">Meus Agricultores</h1>
                <p className="text-muted-foreground">Visualize e cadastre os agricultores sob sua responsabilidade.</p>
            </div>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href={APP_ROUTES.TECHNICIAN_REGISTER_FARMER}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Cadastrar Agricultor
                </Link>
            </Button>
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
                                    ? `Visíveis para seus municípios`
                                    : "Visíveis para todos os municípios"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            farmers={filteredFarmers} 
            assignedMunicipalities={assignedMunicipalities} 
            onSelect={setSelectedFarmer}
            statusFilterDisplayName={getStatusFilterDisplayName(statusFilter)}
            hasSearchTerm={searchTerm.length > 0}
        />

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
