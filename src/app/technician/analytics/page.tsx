
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AgriRequest } from '@/types';
import { getAllRequestsForAdmin as getAllRequestsSystemWide } from '@/services/requestService';
import { amapaMunicipalities } from '@/lib/mockData';
import { Loader2, MapPin, ListChecks, PieChartIcon, BarChart3 as BarChart3IconLucide, AlertTriangle } from 'lucide-react';
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
            title: "Nenhum Dado de Levantamento",
            description: "Não foram encontrados Levantamentos no sistema para exibir nas análises.",
            variant: "default"
          });
        }
      })
      .catch(error => {
        console.error("Falha ao buscar Levantamentos para análise:", error);
        toast({
          title: "Erro ao Carregar Dados",
          description: "Não foi possível buscar os dados dos Levantamentos para análise. Tente novamente mais tarde.",
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


    return { total, pending, positive, negative, inconclusive, cassavaVarietiesArray, requestsByMunicipalityArray };
  }, [filteredRequests, requests, selectedMunicipality]);

  const statusChartData: ChartDataItem[] = [
    { name: 'Pendente', count: stats.pending },
    { name: 'Suspeita de Contaminação', count: stats.positive },
    { name: 'Negativo', count: stats.negative },
    { name: 'Inconclusivo', count: stats.inconclusive },
  ].filter(item => item.count > 0);

  const cassavaVarietyChartData: ChartDataItem[] = stats.cassavaVarietiesArray.slice(0, 5); // Top 5
  
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
                <SelectValue placeholder="Selecionar Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Unidades</SelectItem>
                {amapaMunicipalities.sort((a,b) => a.localeCompare(b)).map(muni => (
                  <SelectItem key={muni} value={muni}>{muni}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <Card className="lg:col-span-7"> 
                <CardHeader><CardTitle className="font-headline text-xl">Mapa Interativo do Amapá</CardTitle></CardHeader>
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
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Levantamentos</CardTitle>
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
                        <CardTitle className="text-sm font-medium text-muted-foreground">Suspeitos de Contaminação</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
                        <p className="text-xs text-muted-foreground">Diagnósticos Suspeitos de Contaminação</p>
                        </CardContent>
                    </Card>
                    <Card className="w-32 h-32 shadow-md flex flex-col justify-center items-center">
                        <CardHeader className="pb-2 text-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Negativos/ Inconclusivos</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.negative + stats.inconclusive}</div>
                        <p className="text-xs text-muted-foreground">Necessitam atenção</p>
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
                            <Bar dataKey="count" fill="hsl(var(--primary))" name="Nº de Levantamentos"/>
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
                        <Bar dataKey="count" fill="hsl(var(--accent))" name="Nº de Levantamentos"/>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                     <p className="text-muted-foreground text-center py-10">Não há dados de variedades suficientes para exibir o gráfico {selectedMunicipality ? ` para ${selectedMunicipality}` : ''}.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="font-headline text-xl flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/>Levantamentos por Unidade</CardTitle>
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
                        <Bar dataKey="count" fill="hsl(var(--chart-3))" name="Nº de Levantamentos"/>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                     <p className="text-muted-foreground text-center py-10">Não há dados de Levantamentos por unidade para exibir o gráfico.</p>
                  )}
                </CardContent>
              </Card>
          </div>
        ) : (
           <Card className="shadow-md mt-6">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground">Nenhum Levantamento Encontrado</p>
              <p className="text-muted-foreground">
                {isLoading ? "Carregando dados..." : 
                  selectedMunicipality 
                  ? `Não há Levantamentos registrados para ${selectedMunicipality}.` 
                  : requests.length === 0 ? "Não há Levantamentos registrados no sistema para exibir análises." : "Ajuste os filtros ou aguarde novos Levantamentos."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
