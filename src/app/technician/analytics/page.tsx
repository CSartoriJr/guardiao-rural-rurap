'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AgriRequest, User as AppUser, RegistrationStatus } from '@/types';
import { getAllRequestsForAdmin as getAllRequestsSystemWide } from '@/services/requestService';
import { amapaMunicipalities } from '@/lib/mockData';
import { Loader2, MapPin, ListChecks, PieChartIcon, BarChart3 as BarChart3IconLucide, AlertTriangle, AlertCircleIcon, CheckCircle2, XCircle, Users, UserCheck, Clock, MessagesSquare, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AmapaInteractiveMap } from '@/components/shared/AmapaInteractiveMap';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query } from 'firebase/firestore';
import { db, firebaseInitializedCorrectly } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DescriptiveReport from '@/components/technician/DescriptiveReport';


// Fetch all requests from Firestore
const fetchAllTechnicianRequests = async (): Promise<AgriRequest[]> => {
  console.log("[TechnicianAnalyticsPage] Fetching all requests from Firestore for analytics.");
  try {
    const requests = await getAllRequestsSystemWide();
    console.log(`[TechnicianAnalyticsPage] Fetched ${requests.length} requests from Firestore.`);
    return requests;
  } catch (error) {
    console.error("[TechnicianAnalyticsPage] Error fetching requests from Firestore for analytics:", error);
    throw error;
  }
};

const fetchAllUsers = async (): Promise<AppUser[]> => {
  if (!firebaseInitializedCorrectly || !db) return [];
  const usersCollectionRef = collection(db, 'users');
  const userSnapshot = await getDocs(query(usersCollectionRef));
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
};

interface ChartDataItem {
  name: string;
  count: number;
}

export default function TechnicianAnalyticsPage() {
  const [requests, setRequests] = useState<AgriRequest[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
        fetchAllTechnicianRequests(),
        fetchAllUsers(),
    ]).then(([requestData, userData]) => {
        setRequests(requestData);
        setUsers(userData);
        if (requestData.length === 0) {
          toast({
            title: "Nenhum Dado de Solicitação",
            description: "Não foram encontradas Solicitações no sistema para exibir nas análises.",
            variant: "default"
          });
        }
      })
      .catch(error => {
        console.error("Falha ao buscar dados para análise:", error);
        toast({
          title: "Erro ao Carregar Dados",
          description: "Não foi possível buscar os dados para análise. Tente novamente mais tarde.",
          variant: "destructive",
        });
        setRequests([]);
        setUsers([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [toast]);

  const filteredRequests = useMemo(() => {
    if (!selectedMunicipality) {
      return requests;
    }
    return requests.filter(req => req.municipality === selectedMunicipality);
  }, [requests, selectedMunicipality]);

  // Filter farmers based on the selected municipality
  const filteredFarmers = useMemo(() => {
    const allFarmers = users.filter(u => u.role === 'farmer');
    if (!selectedMunicipality) {
        return allFarmers;
    }
    return allFarmers.filter(farmer => farmer.municipality === selectedMunicipality);
  }, [users, selectedMunicipality]);


  const stats = useMemo(() => {
    // Request stats based on filtered requests
    const total = filteredRequests.length;
    const pending = filteredRequests.filter(r => r.status === 'Pending').length;
    const responded = total - pending;
    const positive = filteredRequests.filter(r => r.status === 'Positive').length;
    const negative = filteredRequests.filter(r => r.status === 'Negative').length;
    const inconclusive = filteredRequests.filter(r => r.status === 'Inconclusive').length;
    const suspected = filteredRequests.filter(r => r.status === 'Suspeita de Infecção').length;
    
    // Farmer stats based on filtered farmers
    const totalFarmers = filteredFarmers.length;
    const confirmedFarmers = filteredFarmers.filter(f => f.registrationStatus === 'Confirmado').length;
    const pendingFarmers = filteredFarmers.filter(f => f.registrationStatus === 'Pendente').length;
    
    // Chart data based on filtered requests
    const cassavaVarieties: { [key: string]: number } = {};
    filteredRequests.forEach(req => {
      if (req.mandiocaVariety) {
        cassavaVarieties[req.mandiocaVariety] = (cassavaVarieties[req.mandiocaVariety] || 0) + 1;
      }
      if (req.macaxeiraVariety) {
        cassavaVarieties[req.macaxeiraVariety] = (cassavaVarieties[req.macaxeiraVariety] || 0) + 1;
      }
    });
    const cassavaVarietiesArray = Object.entries(cassavaVarieties)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const requestsByMunGeneral: { [key: string]: number } = {};
    const sourceForMunChart = selectedMunicipality ? filteredRequests : requests;
    sourceForMunChart.forEach(req => {
      if (req.municipality) {
        requestsByMunGeneral[req.municipality] = (requestsByMunGeneral[req.municipality] || 0) + 1;
      }
    });
    const requestsByMunicipalityArray = Object.entries(requestsByMunGeneral)
      .map(([name, count]) => ({ name, count }))
      .sort((a,b) => b.count - a.count);


    return { 
        total, pending, responded, positive, negative, inconclusive, suspected, 
        cassavaVarietiesArray, requestsByMunicipalityArray,
        totalFarmers, confirmedFarmers, pendingFarmers
    };
  }, [filteredRequests, requests, selectedMunicipality, filteredFarmers]);

  const statusChartData: ChartDataItem[] = [
    { name: 'Pendente', count: stats.pending },
    { name: 'Positivo', count: stats.positive },
    { name: 'Possivelmente Negativo', count: stats.negative },
    { name: 'Inconclusivo', count: stats.inconclusive },
    { name: 'Suspeita de Infecção', count: stats.suspected },
  ].filter(item => item.count > 0);

  const cassavaVarietyChartData: ChartDataItem[] = stats.cassavaVarietiesArray.slice(0, 5); // Top 5
  
  const municipalityChartData: ChartDataItem[] = stats.requestsByMunicipalityArray;


  const handleMapMunicipalitySelect = (name: string | null) => {
    setSelectedMunicipality(name);
  };
  
  const filteredDisplayMunicipalities = amapaMunicipalities.filter(
    muni => !["Água Branca do Cajarí", "Bailique", "Maruanum", "Pacuí"].includes(muni)
  );


  if (isLoading) {
    return (
      <PageWrapper allowedRoles={['technician', 'admin', 'GabineteGov', 'Diagro', 'SDR']}>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-1/3" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-7">
              <Card>
                <CardHeader><Skeleton className="h-6 w-3/5" /></CardHeader>
                <CardContent className="pt-2">
                  <div className="w-[70%] mx-auto">
                    <Skeleton className="h-64 sm:h-80 md:h-96 w-full rounded-lg" />
                  </div>
                  <Skeleton className="h-3 w-4/5 mt-3 mx-auto" />
                  <Skeleton className="h-3 w-3/5 mt-1 mx-auto" />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-3 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="w-32 h-32 rounded-lg" /> 
                    <Skeleton className="w-32 h-32 rounded-lg" />
                    <Skeleton className="w-32 h-32 rounded-lg" />
                    <Skeleton className="w-32 h-32 rounded-lg" />
                </div>
                 <div className="grid grid-cols-1 gap-4">
                    <Skeleton className="w-full h-24 rounded-lg" />
                    <Skeleton className="w-full h-24 rounded-lg" />
                    <Skeleton className="w-full h-24 rounded-lg" />
                </div>
                <Skeleton className="h-80 rounded-lg" /> {/* For Status Chart */}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Skeleton className="h-80 rounded-lg" /> {/* For Cassava Types Chart */}
            <Skeleton className="h-80 rounded-lg" /> {/* For Municipality Chart */}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper allowedRoles={['technician', 'admin', 'GabineteGov', 'Diagro', 'SDR']}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-headline text-gray-800">Painel de Análise</h1>
           <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Relatório Descritivo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Relatório Descritivo do Guardião Rural</DialogTitle>
              </DialogHeader>
              <DescriptiveReport
                stats={stats}
                users={users}
                requests={requests}
                selectedMunicipality={selectedMunicipality}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <Card className="lg:col-span-7"> 
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-headline text-xl">Mapa Interativo do Amapá</CardTitle>
                    <div className="w-full sm:w-auto max-w-[280px]">
                        <Select
                        value={selectedMunicipality || 'all'}
                        onValueChange={(value) => setSelectedMunicipality(value === 'all' ? null : value)}
                        >
                        <SelectTrigger className="w-full bg-card">
                            <MapPin className="mr-2 h-4 w-4 text-primary" />
                            <SelectValue placeholder="Selecionar Unidade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Unidades</SelectItem>
                            {filteredDisplayMunicipalities.sort((a,b) => a.localeCompare(b)).map(muni => (
                            <SelectItem key={muni} value={muni}>{muni}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="w-[70%] mx-auto">
                    <AmapaInteractiveMap
                        selectedMunicipality={selectedMunicipality}
                        onMunicipalitySelect={handleMapMunicipalitySelect}
                    />
                  </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Clique em uma unidade para filtrar os dados ou selecione no menu acima.
                        {selectedMunicipality && ` Unidade selecionada: ${selectedMunicipality}`}
                    </p>
                </CardContent>
            </Card>
            <div className="lg:col-span-3 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="w-32 h-32 shadow-md flex flex-col justify-center items-center">
                        <CardHeader className="pb-2 text-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Solicitações</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            {selectedMunicipality ? `em ${selectedMunicipality}` : 'em todas as unidades'}
                        </p>
                        </CardContent>
                    </Card>
                    <Card className="w-32 h-32 shadow-md flex flex-col justify-center items-center">
                        <CardHeader className="pb-2 text-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                        <div className="text-2xl font-bold">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">Aguardando revisão</p>
                        </CardContent>
                    </Card>
                    <Card className="w-32 h-32 shadow-md flex flex-col justify-center items-center">
                        <CardHeader className="pb-2 text-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600"/>Positivos</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
                        <p className="text-xs text-muted-foreground">Diagnósticos Positivos</p>
                        </CardContent>
                    </Card>
                    <Card className="w-32 h-32 shadow-md flex flex-col justify-center items-center">
                        <CardHeader className="pb-2 text-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><AlertCircleIcon className="h-4 w-4 text-orange-600"/>Suspeitas</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{stats.suspected}</div>
                        <p className="text-xs text-muted-foreground">Suspeitas de Infecção</p>
                        </CardContent>
                    </Card>
                </div>
                 <div className="grid grid-cols-1 gap-4">
                    <Card>
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm font-medium">Total de Agricultores</span>
                            </div>
                            <div className="text-xl font-bold">{stats.totalFarmers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <UserCheck className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium">Agricultores Confirmados</span>
                            </div>
                            <div className="text-xl font-bold">{stats.confirmedFarmers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-yellow-600" />
                                <span className="text-sm font-medium">Agricultores Pendentes</span>
                            </div>
                            <div className="text-xl font-bold">{stats.pendingFarmers}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-2 border-[#000080] bg-primary/10">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MessagesSquare className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">Agricultores Atendidos</span>
                            </div>
                            <div className="text-xl font-bold">{stats.responded}</div>
                        </CardContent>
                    </Card>
                 </div>

                <Card className="shadow-md">
                    <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-primary"/>Distribuição por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                    {statusChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={statusChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis allowDecimals={false} fontSize={12}/>
                            <Tooltip wrapperStyle={{ fontSize: '12px' }}/>
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="count" fill="hsl(var(--primary))" name="Nº de Solicitações"/>
                        </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-muted-foreground text-center py-10">Não há dados de status suficientes para exibir o gráfico {selectedMunicipality ? ` para ${selectedMunicipality}` : ''}.</p>
                    )}
                    </CardContent>
                </Card>
            </div>
        </div>


        {filteredRequests.length > 0 || (selectedMunicipality === null && requests.length > 0) ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-headline text-xl flex items-center"><BarChart3IconLucide className="mr-2 h-5 w-5 text-primary"/>Principais Variedades</CardTitle>
                </CardHeader>
                <CardContent>
                  {cassavaVarietyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={cassavaVarietyChartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} fontSize={12} />
                        <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                        <Tooltip wrapperStyle={{ fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="count" fill="hsl(var(--accent))" name="Nº de Solicitações"/>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                     <p className="text-muted-foreground text-center py-10">Não há dados de variedades suficientes para exibir o gráfico {selectedMunicipality ? ` para ${selectedMunicipality}` : ''}.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-headline text-xl flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/>Solicitaçõs por Unidade</CardTitle>
                </CardHeader>
                <CardContent>
                  {municipalityChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}> {/* Reverted height */}
                      <BarChart data={municipalityChartData} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}> {/* Adjusted bottom margin for labels */}
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" type="category" interval={0} angle={-45} textAnchor="end" height={80} fontSize={10} /> {/* Added angle, textAnchor, and height for XAxis labels */}
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip wrapperStyle={{ fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="count" fill="hsl(var(--chart-3))" name="Nº de Solicitações"/>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                     <p className="text-muted-foreground text-center py-10">Não há dados de Solicitações por unidade para exibir o gráfico.</p>
                  )}
                </CardContent>
              </Card>
          </div>
        ) : (
           <Card className="shadow-md mt-6">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground">Nenhuma Solicitação Encontrada</p>
              <p className="text-muted-foreground">
                {isLoading ? "Carregando dados..." : 
                  selectedMunicipality 
                  ? `Não há Solicitações registradas para ${selectedMunicipality}.` 
                  : requests.length === 0 ? "Não há Solicitações registradas no sistema para exibir análises." : "Ajuste os filtros ou aguarde novas Solicitações."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
