
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AgriRequest } from '@/types';
import { getAllRequestsForAdmin as getAllRequestsSystemWide } from '@/services/requestService'; // Updated import
import { amapaMunicipalities } from '@/lib/mockData'; // Kept for municipality list
import { Loader2, MapPin, ListChecks, PieChartIcon, BarChart3Icon as BarChart3IconLucide, AlertTriangle } from 'lucide-react'; // Renamed to avoid conflict
import { Skeleton } from '@/components/ui/skeleton';
import { AmapaInteractiveMap } from '@/components/shared/AmapaInteractiveMap';
import { useToast } from '@/hooks/use-toast';


// Fetch all requests from Firestore
const fetchAllTechnicianRequests = async (): Promise<AgriRequest[]> => {
  console.log("[TechnicianAnalyticsPage] Fetching all requests from Firestore for analytics.");
  try {
    const requests = await getAllRequestsSystemWide();
    console.log(`[TechnicianAnalyticsPage] Fetched ${requests.length} requests from Firestore.`);
    return requests;
  } catch (error) {
    console.error("[TechnicianAnalyticsPage] Error fetching requests from Firestore for analytics:", error);
    // Error will be handled in the useEffect hook that calls this function.
    throw error; // Re-throw to be caught by the caller
  }
};

interface ChartDataItem {
  name: string;
  count: number;
}

export default function TechnicianAnalyticsPage() {
  const [requests, setRequests] = useState<AgriRequest[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    fetchAllTechnicianRequests()
      .then(data => {
        setRequests(data);
        if (data.length === 0) {
          toast({
            title: "Nenhum Dado de Pedido",
            description: "Não foram encontrados pedidos no sistema para exibir nas análises.",
            variant: "default"
          });
        }
      })
      .catch(error => {
        console.error("Falha ao buscar pedidos para análise:", error);
        toast({
          title: "Erro ao Carregar Dados",
          description: "Não foi possível buscar os dados dos pedidos para análise. Tente novamente mais tarde.",
          variant: "destructive",
        });
        setRequests([]); // Define como vazio em caso de erro
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

  const stats = useMemo(() => {
    const total = filteredRequests.length;
    const pending = filteredRequests.filter(r => r.status === 'Pending').length;
    const positive = filteredRequests.filter(r => r.status === 'Positive').length;
    const negative = filteredRequests.filter(r => r.status === 'Negative').length;
    const inconclusive = filteredRequests.filter(r => r.status === 'Inconclusive').length;
    
    const cassavaTypes: { [key: string]: number } = {};
    filteredRequests.forEach(req => {
      cassavaTypes[req.cassavaType] = (cassavaTypes[req.cassavaType] || 0) + 1;
    });
    const cassavaTypesArray = Object.entries(cassavaTypes)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const requestsByMunGeneral: { [key: string]: number } = {};
    // Use 'requests' (all data) for the municipality chart unless a municipality is already selected for filtering the whole page
    const sourceForMunChart = selectedMunicipality ? filteredRequests : requests;
    sourceForMunChart.forEach(req => {
      if (req.municipality) {
        requestsByMunGeneral[req.municipality] = (requestsByMunGeneral[req.municipality] || 0) + 1;
      }
    });
    const requestsByMunicipalityArray = Object.entries(requestsByMunGeneral)
      .map(([name, count]) => ({ name, count }))
      .sort((a,b) => b.count - a.count);


    return { total, pending, positive, negative, inconclusive, cassavaTypesArray, requestsByMunicipalityArray };
  }, [filteredRequests, requests, selectedMunicipality]);

  const statusChartData: ChartDataItem[] = [
    { name: 'Pendente', count: stats.pending },
    { name: 'Positivo', count: stats.positive },
    { name: 'Negativo', count: stats.negative },
    { name: 'Inconclusivo', count: stats.inconclusive },
  ].filter(item => item.count > 0);

  const cassavaTypeChartData: ChartDataItem[] = stats.cassavaTypesArray.slice(0, 5); // Top 5
  
  const municipalityChartData: ChartDataItem[] = stats.requestsByMunicipalityArray;


  const handleMapMunicipalitySelect = (name: string | null) => {
    setSelectedMunicipality(name);
  };

  if (isLoading) {
    return (
      <PageWrapper allowedRoles={['technician', 'admin']}>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-1/4" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-9">
              <Card>
                <CardHeader><Skeleton className="h-6 w-3/5" /></CardHeader>
                <CardContent className="pt-2">
                  <Skeleton className="h-64 sm:h-80 md:h-96 w-full rounded-lg" />
                  <Skeleton className="h-3 w-4/5 mt-3 mx-auto" />
                  <Skeleton className="h-3 w-3/5 mt-1 mx-auto" />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1 flex flex-col justify-between h-full gap-4">
              <Skeleton className="w-full aspect-square rounded-lg" />
              <Skeleton className="w-full aspect-square rounded-lg" />
              <Skeleton className="w-full aspect-square rounded-lg" />
              <Skeleton className="w-full aspect-square rounded-lg" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-80 rounded-lg" />
              <Skeleton className="h-80 rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-80 rounded-lg" /> 
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper allowedRoles={['technician', 'admin']}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-headline text-gray-800">Painel de Análise</h1>
          <div className="w-full sm:w-auto">
            <Select
              value={selectedMunicipality || 'all'}
              onValueChange={(value) => setSelectedMunicipality(value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-full sm:w-[280px] bg-card">
                <MapPin className="mr-2 h-4 w-4 text-primary" />
                <SelectValue placeholder="Selecionar Município" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Municípios</SelectItem>
                {amapaMunicipalities.map(muni => (
                  <SelectItem key={muni} value={muni}>{muni}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <Card className="lg:col-span-9"> 
                <CardHeader><CardTitle className="font-headline text-xl">Mapa Interativo do Amapá</CardTitle></CardHeader>
                <CardContent className="pt-2">
                    <AmapaInteractiveMap
                        selectedMunicipality={selectedMunicipality}
                        onMunicipalitySelect={handleMapMunicipalitySelect}
                        requests={filteredRequests} 
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Clique em um município para filtrar os dados ou selecione no menu acima.
                        {selectedMunicipality && ` Município selecionado: ${selectedMunicipality}`}
                        <br />
                        <span className="inline-flex items-center mr-2"><svg width="10" height="10" className="mr-1"><circle cx="5" cy="5" r="5" fill="hsl(var(--muted-foreground))"/></svg>Pendente</span>
                        <span className="inline-flex items-center mr-2"><svg width="10" height="10" className="mr-1"><circle cx="5" cy="5" r="5" fill="hsl(var(--destructive))"/></svg>Positivo</span>
                        <span className="inline-flex items-center mr-2"><svg width="10" height="10" className="mr-1"><circle cx="5" cy="5" r="5" fill="hsl(var(--chart-2))"/></svg>Negativo</span>
                        <span className="inline-flex items-center"><svg width="10" height="10" className="mr-1"><circle cx="5" cy="5" r="5" fill="hsl(var(--chart-4))"/></svg>Inconclusivo</span>
                    </p>
                </CardContent>
            </Card>
            <div className="lg:col-span-1 flex flex-col justify-between h-full gap-4 lg:gap-0"> 
                <Card className="w-full aspect-square shadow-md flex flex-col justify-center items-center">
                    <CardHeader className="pb-2 text-center">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">
                        {selectedMunicipality ? `em ${selectedMunicipality}` : 'em todo o estado'}
                    </p>
                    </CardContent>
                </Card>
                <Card className="w-full aspect-square shadow-md flex flex-col justify-center items-center">
                    <CardHeader className="pb-2 text-center">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                    <div className="text-2xl font-bold">{stats.pending}</div>
                    <p className="text-xs text-muted-foreground">Aguardando revisão</p>
                    </CardContent>
                </Card>
                <Card className="w-full aspect-square shadow-md flex flex-col justify-center items-center">
                    <CardHeader className="pb-2 text-center">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Positivos</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
                    <p className="text-xs text-muted-foreground">Diagnósticos positivos</p>
                    </CardContent>
                </Card>
                <Card className="w-full aspect-square shadow-md flex flex-col justify-center items-center">
                    <CardHeader className="pb-2 text-center">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Negativos/ Inconclusivos</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.negative + stats.inconclusive}</div>
                    <p className="text-xs text-muted-foreground">Necessitam atenção</p>
                    </CardContent>
                </Card>
            </div>
        </div>


        {filteredRequests.length > 0 || (selectedMunicipality === null && requests.length > 0) ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-headline text-xl flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-primary"/>Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statusChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false}/>
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="hsl(var(--primary))" name="Nº de Pedidos"/>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-10">Não há dados de status suficientes para exibir o gráfico {selectedMunicipality ? ` para ${selectedMunicipality}` : ''}.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-headline text-xl flex items-center"><BarChart3IconLucide className="mr-2 h-5 w-5 text-primary"/>Principais Tipos de Mandioca</CardTitle>
                </CardHeader>
                <CardContent>
                  {cassavaTypeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={cassavaTypeChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="hsl(var(--accent))" name="Nº de Pedidos"/>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                     <p className="text-muted-foreground text-center py-10">Não há dados de tipo de mandioca suficientes para exibir o gráfico {selectedMunicipality ? ` para ${selectedMunicipality}` : ''}.</p>
                  )}
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-headline text-xl flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/>Pedidos por Município</CardTitle>
                </CardHeader>
                <CardContent>
                  {municipalityChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}> {/* Reverted height */}
                      <BarChart data={municipalityChartData} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}> {/* Adjusted bottom margin for labels */}
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" type="category" interval={0} angle={-45} textAnchor="end" height={80} /> {/* Added angle, textAnchor, and height for XAxis labels */}
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="hsl(var(--chart-3))" name="Nº de Pedidos"/>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                     <p className="text-muted-foreground text-center py-10">Não há dados de pedidos por município para exibir o gráfico.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
           <Card className="shadow-md mt-6">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground">Nenhum Pedido Encontrado</p>
              <p className="text-muted-foreground">
                {isLoading ? "Carregando dados..." : 
                  selectedMunicipality 
                  ? `Não há pedidos registrados para ${selectedMunicipality}.` 
                  : requests.length === 0 ? "Não há pedidos registrados no sistema para exibir análises." : "Ajuste os filtros ou aguarde novos pedidos."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}

