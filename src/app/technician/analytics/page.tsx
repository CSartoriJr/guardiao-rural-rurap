
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AgriRequest } from '@/types';
import { mockRequests, amapaMunicipalities } from '@/lib/mockData'; 
import { APP_ROUTES } from '@/config/routes';
import { Loader2, MapPin, ListChecks, PieChartIcon, BarChart3Icon, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Mock function to fetch all requests (in a real app, this would be an API call)
const fetchAllTechnicianRequests = async (): Promise<AgriRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay
  return mockRequests; // Using all mock requests for analytics
};

// SVG for Amapá - updated for a more realistic outline
const AmapaMap = () => (
  <svg 
    viewBox="0 0 400 450" // Adjusted viewBox for a more representative shape
    className="w-full h-auto max-w-md mx-auto" 
    aria-label="Mapa do Estado do Amapá"
  >
    <title>Mapa do Estado do Amapá</title>
    <desc>Uma representação estilizada do contorno do estado do Amapá.</desc>
    <path 
      d="M212.89,11.27C211.52,9.62 209.72,8.28 208.12,7.07C195.4,0.65 177.73,0.38 164.13,0.05C147.92,-0.35 131.67,0.43 115.82,1.16C95.88,2.09 75.93,3.01 56.33,4.62C47.41,5.36 38.82,6.37 30.3,7.37C20.14,8.59 13.72,14.63 10.24,23.82C4.91,37.93 2.54,52.53 1.38,67.21C0.25,81.6 -0.17,96.17 0.04,110.68C0.19,120.57 0.53,130.44 1.19,140.25C2.28,156.23 4.51,172.04 7.64,187.49C10.62,202.14 15.72,216.62 20.65,230.64C25.66,244.9 30.78,258.98 36.46,272.65C40.61,282.52 45.33,292.25 49.13,302.21C54.74,316.95 59.27,332.02 63.94,346.95C66.45,354.93 69.08,362.88 71.73,370.79C73.14,374.97 74.86,379.09 76.18,383.28C77.59,387.78 79.07,392.23 80.93,396.49C82.35,399.85 84.03,403.17 86.18,406.16C88.37,409.28 91.13,411.89 94.17,413.95C100.34,418.08 107.53,420.14 114.73,421.6C124.44,423.59 134.1,425.15 143.93,425.98C156.37,427.08 169.03,427.45 181.43,427.93C195.74,428.5 209.93,429.63 223.99,430.03C234.68,430.32 245.38,430.39 256.03,430.28C266.18,430.18 276.3,429.75 286.37,429.25C299.13,428.59 311.88,427.62 324.34,425.79C337.64,423.82 350.64,420.65 362.59,415.3C367.81,412.98 372.73,410.02 377.03,406.67C381.08,403.54 384.35,399.94 386.91,396.04C389.28,392.44 391.03,388.63 392.54,384.75C393.83,381.49 395.23,378.19 396.26,374.9C397.95,369.36 399.03,363.75 399.84,358.11C400.8,351.44 401.13,344.71 401.15,337.97C401.17,328.11 400.52,318.27 399.03,308.63C397.93,301.57 396.48,294.58 394.84,287.69C393.21,280.83 391.42,274.03 389.8,267.25C387.21,256.36 384.83,245.56 382.03,234.92C378.71,222.36 374.82,210.04 370.58,198.1C366.6,186.89 362.24,175.94 358.21,165.23C354.33,154.89 350.68,144.71 347.09,134.61C342.86,122.98 338.47,111.56 334.38,100.28C332.14,94.05 330.04,87.89 327.94,81.73C326.09,76.23 324.04,70.79 321.75,65.52C320.33,62.29 318.8,59.12 316.99,56.12C314.03,51.33 310.35,47.12 305.73,44.02C301.24,40.99 296.04,39.02 290.56,37.63C280.81,35.14 270.76,33.65 260.64,32.46C249.92,31.19 239.15,30.24 228.36,29.58C223.73,29.29 219.1,29.11 214.47,29.04C214.47,23.12 214.13,17.19 212.89,11.27Z"
      fill="hsl(var(--primary))" 
      stroke="hsl(var(--border))" 
      strokeWidth="1" 
    />
  </svg>
);


interface ChartDataItem {
  name: string;
  count: number;
}

export default function TechnicianAnalyticsPage() {
  const [requests, setRequests] = useState<AgriRequest[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchAllTechnicianRequests()
      .then(data => {
        setRequests(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Falha ao buscar pedidos para análise:", error);
        setIsLoading(false);
      });
  }, []);

  const filteredRequests = useMemo(() => {
    if (!selectedMunicipality) {
      return requests; // Show all requests if no municipality is selected
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

    return { total, pending, positive, negative, inconclusive, cassavaTypesArray };
  }, [filteredRequests]);

  const statusChartData: ChartDataItem[] = [
    { name: 'Pendente', count: stats.pending },
    { name: 'Positivo', count: stats.positive },
    { name: 'Negativo', count: stats.negative },
    { name: 'Inconclusivo', count: stats.inconclusive },
  ].filter(item => item.count > 0);

  const cassavaTypeChartData: ChartDataItem[] = stats.cassavaTypesArray.slice(0, 5); // Top 5

  if (isLoading) {
    return (
      <PageWrapper allowedRoles={['technician']}>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-1/4" />
          </div>
          <Skeleton className="h-64 w-full md:w-1/2 mx-auto" /> {/* Map Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper allowedRoles={['technician']}>
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
        
        <Card>
            <CardHeader><CardTitle className="font-headline text-xl">Mapa do Amapá</CardTitle></CardHeader>
            <CardContent>
                 <AmapaMap />
                 <p className="text-xs text-muted-foreground mt-2 text-center">
                    Este mapa é uma representação estilizada do estado.
                    {selectedMunicipality && ` Município selecionado: ${selectedMunicipality}`}
                </p>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {selectedMunicipality ? `em ${selectedMunicipality}` : 'em todo o estado'}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Aguardando revisão</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Positivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
              <p className="text-xs text-muted-foreground">Diagnósticos positivos</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Negativos/Inconclusivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.negative + stats.inconclusive}</div>
              <p className="text-xs text-muted-foreground">Necessitam atenção</p>
            </CardContent>
          </Card>
        </div>

        {filteredRequests.length > 0 ? (
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
                  <p className="text-muted-foreground">Não há dados de status suficientes para exibir o gráfico.</p>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center"><BarChart3Icon className="mr-2 h-5 w-5 text-primary"/>Principais Tipos de Mandioca</CardTitle>
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
                   <p className="text-muted-foreground">Não há dados de tipo de mandioca suficientes para exibir o gráfico.</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
           <Card className="shadow-md">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground">Nenhum Pedido Encontrado</p>
              <p className="text-muted-foreground">
                {selectedMunicipality 
                  ? `Não há pedidos registrados para ${selectedMunicipality}.` 
                  : "Não há pedidos registrados no sistema."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}

