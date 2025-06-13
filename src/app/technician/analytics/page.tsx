
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AgriRequest } from '@/types';
import { mockRequests, amapaMunicipalities } from '@/lib/mockData'; // Assuming amapaMunicipalities is added to mockData
import { APP_ROUTES } from '@/config/routes';
import { Loader2, MapPin, ListChecks, PieChartIcon, BarChart3Icon, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Mock function to fetch all requests (in a real app, this would be an API call)
const fetchAllTechnicianRequests = async (): Promise<AgriRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay
  return mockRequests; // Using all mock requests for analytics
};

// SVG for Amapá (simplified) - In a real app, consider a more detailed/interactive map library
const AmapaMap = () => (
  <svg viewBox="0 0 200 200" className="w-full h-auto max-w-md mx-auto" aria-label="Mapa do Estado do Amapá">
    <title>Mapa do Estado do Amapá</title>
    <desc>Uma representação simplificada do estado do Amapá e seus municípios.</desc>
    <path d="M50,10 L150,10 L180,50 L160,150 L100,190 L40,150 L20,50 Z" fill="hsl(var(--primary))" stroke="hsl(var(--border))" strokeWidth="1" />
    {/* Simplified municipalities - these are just illustrative shapes */}
    <rect x="60" y="30" width="30" height="20" fill="hsl(var(--secondary))" data-municipality="Macapá"><title>Macapá</title></rect>
    <rect x="100" y="30" width="30" height="20" fill="hsl(var(--secondary))" data-municipality="Santana"><title>Santana</title></rect>
    <rect x="70" y="60" width="40" height="30" fill="hsl(var(--secondary))" data-municipality="Laranjal do Jari"><title>Laranjal do Jari</title></rect>
    <rect x="120" y="60" width="30" height="25" fill="hsl(var(--secondary))" data-municipality="Oiapoque"><title>Oiapoque</title></rect>
    <rect x="50" y="100" width="50" height="40" fill="hsl(var(--secondary))" data-municipality="Mazagão"><title>Mazagão</title></rect>
    <text x="75" y="45" fontSize="8" fill="hsl(var(--foreground))" textAnchor="middle">MCP</text>
    <text x="115" y="45" fontSize="8" fill="hsl(var(--foreground))" textAnchor="middle">STN</text>
    <text x="90" y="80" fontSize="8" fill="hsl(var(--foreground))" textAnchor="middle">LRJ</text>
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
            <CardHeader><CardTitle className="font-headline text-xl">Mapa do Amapá (Ilustrativo)</CardTitle></CardHeader>
            <CardContent>
                 <AmapaMap />
                 <p className="text-xs text-muted-foreground mt-2 text-center">
                    Este mapa é uma representação simplificada para fins de demonstração.
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
