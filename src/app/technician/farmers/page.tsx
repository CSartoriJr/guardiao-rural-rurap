
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, Home, MapPin, Phone, Mail, TractorIcon, UserPlus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getFarmersList } from '@/app/actions/farmerActions';
import type { User } from '@/types';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';

interface FarmerListProps {
  farmers: User[];
  assignedMunicipalities: string[];
  onSelect: (farmer: User) => void;
}

const FarmerList: React.FC<FarmerListProps> = ({ farmers, assignedMunicipalities, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.cpf.includes(searchTerm)
  );

  if (farmers.length === 0) {
    return (
      <div className="text-center py-10 bg-card rounded-lg shadow">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Nenhum Agricultor Encontrado</h2>
        <p className="text-muted-foreground mt-2">
          Não foram encontrados agricultores {assignedMunicipalities.length > 0 ? `para os seus municípios atribuídos: ${assignedMunicipalities.join(', ')}.` : 'no sistema.'}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">Você pode cadastrar um novo agricultor ou falar com um administrador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFarmers.map(farmer => (
          <Card key={farmer.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{farmer.name}</CardTitle>
              <CardDescription>CPF: {farmer.cpf}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-start"><Home className="h-4 w-4 mr-2 mt-0.5 text-primary" /> {farmer.address}</p>
                <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" /> {farmer.municipality}</p>
                <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary" /> {farmer.phone}</p>
                <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-primary" /> {farmer.email}</p>
              </div>
            </CardContent>
            <div className="p-4 pt-0">
              <Button onClick={() => onSelect(farmer)} className="w-full">Ver Detalhes</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};


export default function TechnicianFarmersPage() {
  const { user, initializing } = useAuth();
  const { toast } = useToast();
  const [farmers, setFarmers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState<User | null>(null);
  
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
  

  const totalFarmerCount = useMemo(() => farmers.length, [farmers]);

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
            <Button asChild>
                <Link href={APP_ROUTES.TECHNICIAN_REGISTER_FARMER}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Cadastrar Agricultor
                </Link>
            </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agricultores Visíveis</CardTitle>
            <TractorIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFarmerCount}</div>
            <p className="text-xs text-muted-foreground">
              {assignedMunicipalities.length > 0
                ? `Visíveis para seus municípios: ${assignedMunicipalities.join(', ')}`
                : "Visíveis para todos os municípios"
              }
            </p>
          </CardContent>
        </Card>

        <FarmerList farmers={farmers} assignedMunicipalities={assignedMunicipalities} onSelect={setSelectedFarmer} />

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
