
'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import PageWrapper from '@/components/shared/PageWrapper';
import ResponseForm from '@/components/technician/ResponseForm';
import type { AgriRequest } from '@/types';
import { mockRequests } from '@/lib/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, CalendarDays, Microscope, Image as ImageIcon, XCircle, Loader2, Sprout, LandPlot, AlertTriangleIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { APP_ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';

// Mock function to fetch a single request for technician
const fetchRequestByIdForTechnician = async (requestId: string): Promise<AgriRequest | undefined> => {
  console.log('[TechnicianViewRequestPage] Fetching request for ID:', requestId);
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate short delay
  const request = mockRequests.find(req => req.id === requestId);
  console.log('[TechnicianViewRequestPage] Found request:', request);
  return request;
};


export default function TechnicianViewRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { user, initializing: authInitializing } = useAuth(); 
  const [request, setRequest] = useState<AgriRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = typeof params.id === 'string' ? params.id : undefined;
  console.log('[TechnicianViewRequestPage] Page loaded. Request ID from params:', requestId, "Auth Initializing:", authInitializing, "User:", user);


  useEffect(() => {
    if (authInitializing) {
      console.log('[TechnicianViewRequestPage] Auth still initializing, waiting...');
      return; 
    }

    if (!user) {
      console.log('[TechnicianViewRequestPage] No user found, redirecting to login.');
      // router.replace(APP_ROUTES.LOGIN); // This was commented out, keeping it as is.
      return;
    }
    
    if (requestId) {
      console.log('[TechnicianViewRequestPage] Request ID and user available. Fetching request data.');
      setIsLoading(true);
      setError(null);
      fetchRequestByIdForTechnician(requestId)
        .then(data => {
          if (data) {
            setRequest(data);
            console.log('[TechnicianViewRequestPage] Request data fetched successfully:', data);
          } else {
            setError("Pedido não encontrado.");
            console.warn('[TechnicianViewRequestPage] Request not found for ID:', requestId);
          }
        })
        .catch(err => {
          console.error("[TechnicianViewRequestPage] Falha ao buscar pedido:", err);
          setError("Falha ao carregar detalhes do pedido.");
        })
        .finally(() => {
          setIsLoading(false);
          console.log('[TechnicianViewRequestPage] Fetching finished. Loading state:', false);
        });
    } else if (!requestId && !authInitializing) {
      setError("ID do pedido inválido.");
      setIsLoading(false);
      console.warn('[TechnicianViewRequestPage] Invalid request ID.');
    }
  }, [requestId, user, authInitializing, router]);

  const getPlantTypeDisplay = (req: AgriRequest | null): string => {
    if (!req) return 'Não especificado';
    const types = [];
    if (req.isMandioca) types.push('Mandioca');
    if (req.isMacaxeira) types.push('Macaxeira');
    return types.length > 0 ? types.join(' e ') : 'Não especificado';
  };

  if (isLoading || authInitializing) {
    return (
       <PageWrapper allowedRoles={['technician']}>
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-8 w-1/4 mb-6" /> 
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-3/4 mb-2" /> 
              <Skeleton className="h-4 w-1/2" /> 
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-5 w-1/3" /> 
              <Skeleton className="h-5 w-1/3" /> 
              <Skeleton className="h-5 w-1/3" /> 
              <Skeleton className="h-5 w-1/3" /> 
              <Skeleton className="h-5 w-1/3" /> {/* Planted Area */}
              <Skeleton className="h-5 w-1/3" /> {/* Infected Area */}
              <Skeleton className="h-5 w-1/3" /> {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent><Skeleton className="h-40 w-full" /></CardContent> 
          </Card>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
     return (
      <PageWrapper allowedRoles={['technician']}>
        <div className="text-center py-10">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-destructive">{error}</h2>
          <Button onClick={() => router.push(APP_ROUTES.TECHNICIAN_DASHBOARD)} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Ir para o Painel
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!request) {
    return (
      <PageWrapper allowedRoles={['technician']}>
         <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-foreground">Carregando pedido...</h2>
           <p className="text-muted-foreground">Se esta mensagem persistir, o pedido pode não ter sido encontrado.</p>
          <Button onClick={() => router.push(APP_ROUTES.TECHNICIAN_DASHBOARD)} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Ir para o Painel
          </Button>
        </div>
      </PageWrapper>
    );
  }
  
  return (
    <PageWrapper allowedRoles={['technician']}>
      <div className="max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => router.back()} className="mb-6 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Detalhes do Pedido do Agricultor</CardTitle>
            <CardDescription>ID: {request.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center"><User className="h-4 w-4 mr-2 text-primary" />Agricultor</h3>
              <p className="text-lg text-foreground">{request.farmerName || request.farmerId}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Sprout className="h-4 w-4 mr-2 text-primary" />Tipo de Planta</h3>
              <p className="text-lg text-foreground">{getPlantTypeDisplay(request)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Microscope className="h-4 w-4 mr-2 text-primary" />Variedade da Planta</h3>
              <p className="text-lg text-foreground">{request.cassavaType}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" />Enviado Em</h3>
              <p className="text-lg text-foreground">{format(new Date(request.submissionDate), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
            {typeof request.plantedArea === 'number' && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center"><LandPlot className="h-4 w-4 mr-2 text-primary" />Área Plantada</h3>
                <p className="text-lg text-foreground">{request.plantedArea} ha</p>
              </div>
            )}
            {typeof request.infectedArea === 'number' && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center"><AlertTriangleIcon className="h-4 w-4 mr-2 text-destructive" />Área Infectada</h3>
                <p className="text-lg text-foreground">{request.infectedArea} ha</p>
              </div>
            )}
             {(typeof request.latitude === 'number' && typeof request.longitude === 'number') && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />Localização (Simulada)</h3>
                <p className="text-lg text-foreground">Lat: {request.latitude}, Long: {request.longitude}</p>
              </div>
            )}
             <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center"><ImageIcon className="h-4 w-4 mr-2 text-primary" />Fotos Enviadas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {request.photoDataUris.map((uri, index) => (
                  <div key={index} className="rounded-lg overflow-hidden border border-border aspect-square bg-muted" data-ai-hint="cassava plant">
                    <Image
                      src={uri}
                      alt={`Foto enviada ${index + 1}`}
                      width={300}
                      height={300}
                      className="object-cover h-full w-full hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {request.status === 'Pending' ? (
          <ResponseForm request={request} />
        ) : (
          <Card className="mt-6 bg-card/80">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Resposta Enviada</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Status:</strong> {request.status === 'Positive' ? 'Positivo' : request.status === 'Negative' ? 'Negativo' : request.status === 'Inconclusive' ? 'Inconclusivo' : 'Pendente'}</p>
              <p className="mt-2"><strong>Recomendação:</strong></p>
              <p className="whitespace-pre-wrap bg-muted p-3 rounded-md mt-1">{request.recommendation}</p>
              {request.technicianName && request.responseDate && (
                <p className="text-xs text-muted-foreground mt-3">
                  Por Você ({request.technicianName}) em {format(new Date(request.responseDate), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
