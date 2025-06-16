
'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import PageWrapper from '@/components/shared/PageWrapper';
import type { AgriRequest } from '@/types';
import { mockRequests } from '@/lib/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge }   from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, Clock, CalendarDays, User, Microscope, Image as ImageIcon, Sprout, LandPlot, AlertTriangleIcon, MapPin, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { APP_ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog'; // Renamed DialogTitle to UIDialogTitle

// Mock function to fetch a single request
const fetchRequestById = async (requestId: string): Promise<AgriRequest | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRequests.find(req => req.id === requestId);
};

const StatusDisplay = ({ status, recommendation, technicianName, responseDate }: Pick<AgriRequest, 'status' | 'recommendation' | 'technicianName' | 'responseDate'>) => {
  let IconComponent;
  let badgeClass = '';
  let title = '';
  let statusText = status;

  switch (status) {
    case 'Positive':
      IconComponent = CheckCircle2;
      badgeClass = 'bg-green-100 text-green-700 border-green-300';
      title = 'Diagnóstico Positivo';
      statusText = 'Positivo';
      break;
    case 'Negative':
      IconComponent = XCircle;
      badgeClass = 'bg-red-100 text-red-700 border-red-300';
      title = 'Diagnóstico Negativo';
      statusText = 'Negativo';
      break;
    case 'Inconclusive':
      IconComponent = HelpCircle;
      badgeClass = 'bg-yellow-100 text-yellow-700 border-yellow-300';
      title = 'Diagnóstico Inconclusivo';
      statusText = 'Inconclusivo';
      break;
    default: // Pending
      IconComponent = Clock;
      badgeClass = 'bg-gray-100 text-gray-700 border-gray-300';
      title = 'Aguardando Revisão';
      statusText = 'Pendente';
      break;
  }

  return (
    <Card className="mt-6 bg-background/50">
      <CardHeader>
        <div className="flex items-center">
          <IconComponent className={`h-8 w-8 mr-3 ${badgeClass.split(' ')[1]}`} />
          <CardTitle className="font-headline text-xl">{title}</CardTitle>
        </div>
        <Badge variant="outline" className={`mt-1 ${badgeClass}`}>{statusText}</Badge>
      </CardHeader>
      {recommendation && (
        <CardContent>
          <h3 className="font-semibold text-lg mb-2 text-foreground">Recomendação do Técnico:</h3>
          <p className="text-foreground whitespace-pre-wrap">{recommendation}</p>
          {technicianName && responseDate && (
            <p className="text-xs text-muted-foreground mt-3">
              Por {technicianName} em {format(new Date(responseDate), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </CardContent>
      )}
      {status === 'Pending' && (
        <CardContent>
          <p className="text-muted-foreground">Seu pedido está atualmente em revisão por um técnico. Você será notificado assim que uma resposta estiver disponível.</p>
        </CardContent>
      )}
    </Card>
  );
};


export default function FarmerViewRequestPage() {
  console.log('[FarmerViewRequestPage] Component rendering started.');
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<AgriRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedImageUri, setExpandedImageUri] = useState<string | null>(null);

  const requestId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    console.log('[FarmerViewRequestPage] useEffect triggered. RequestId:', requestId, 'User:', user ? user.id : 'null');
    if (requestId && user) {
      setIsLoading(true);
      fetchRequestById(requestId)
        .then(data => {
          if (data && (data.farmerId === user.id || user.role === 'admin')) { // Admin can also view
            setRequest(data);
             console.log('[FarmerViewRequestPage] Request data set:', data);
          } else if (data) {
            setError("Você não tem autorização para ver este pedido.");
            console.warn('[FarmerViewRequestPage] User not authorized for request:', requestId, 'User role:', user.role);
          } else {
            setError("Pedido não encontrado.");
            console.warn('[FarmerViewRequestPage] Request not found:', requestId);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error("[FarmerViewRequestPage] Falha ao buscar pedido:", err);
          setError("Falha ao carregar detalhes do pedido.");
          setIsLoading(false);
        });
    } else if (!requestId) {
        console.warn('[FarmerViewRequestPage] Invalid or missing requestId.');
        setError("ID do pedido inválido.");
        setIsLoading(false);
    } else if (!user && !isLoading) { // Only set error if not already loading initial user auth
      console.warn('[FarmerViewRequestPage] User not available.');
      // This case should ideally be handled by PageWrapper redirecting.
      // Adding a specific error here might be redundant if PageWrapper handles it.
    }
  }, [requestId, user, isLoading]); // Added isLoading to dependencies to re-evaluate if user loads after initial mount

  const getPlantTypeDisplay = (req: AgriRequest): string => {
    const types = [];
    if (req.isMandioca) types.push('Mandioca');
    if (req.isMacaxeira) types.push('Macaxeira');
    return types.length > 0 ? types.join(' e ') : 'Não especificado';
  };

  const handleImageClick = (uri: string) => {
    setExpandedImageUri(uri);
  };

  const closeImageModal = () => {
    setExpandedImageUri(null);
  };

 const LocationDisplay = () => {
    if (!request) return null;

    let locationString = "";
    let sourceHint = "";
    let municipalityDisplayString = request.municipality ? `${request.municipality}` : "Não determinado";

    if (typeof request.latitude === 'number' && typeof request.longitude === 'number') {
      locationString = `Lat: ${request.latitude.toFixed(6)}, Long: ${request.longitude.toFixed(6)}`;
      if (request.deviceLocationStatus === 'success') {
        sourceHint = " (GPS do dispositivo)";
      } else if (request.deviceLocationStatus && request.deviceLocationStatus !== 'idle' && request.deviceLocationStatus !== 'fetching') {
         sourceHint = " (GPS do dispositivo: falha, localização da IA)";
      } else {
         sourceHint = " (Localização da IA)";
      }
    } else if (request.deviceLocationStatus && request.deviceLocationStatus !== 'success' && request.deviceLocationStatus !== 'idle' && request.deviceLocationStatus !== 'fetching') {
      locationString = "Nenhuma localização GPS disponível.";
      sourceHint = ` (Status GPS do dispositivo: ${request.deviceLocationStatus})`;
    } else {
      locationString = "Localização não disponível para este pedido.";
    }

    return (
      <>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />Localização
          </h3>
          <p className={`text-lg ${locationString.startsWith("Lat:") ? 'text-foreground' : 'text-muted-foreground'}`}>
            {locationString.startsWith("Lat:") ? locationString : <span className="flex items-center"><WifiOff className="h-4 w-4 mr-2 text-destructive" /> {locationString}</span>}
            {sourceHint && <span className="text-xs text-muted-foreground ml-1">{sourceHint}</span>}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />Município
          </h3>
          <p className={`text-lg ${request.municipality ? 'text-foreground' : 'text-muted-foreground'}`}>
            {municipalityDisplayString}
          </p>
        </div>
      </>
    );
  };


  if (isLoading) {
    console.log('[FarmerViewRequestPage] Rendering Skeleton (isLoading true).');
    return (
      <PageWrapper allowedRoles={['farmer', 'admin']}>
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
              <Skeleton className="h-5 w-1/3" /> {/* Planted Area */}
              <Skeleton className="h-5 w-1/3" /> {/* Infected Area */}
              <div>
                <Skeleton className="h-4 w-1/3 mb-1" /> {/* "Localização" label */}
                <Skeleton className="h-5 w-3/4 mb-1" /> {/* Coordinates placeholder */}
                <Skeleton className="h-3 w-1/2" />      {/* Source hint placeholder */}
              </div>
              <div>
                <Skeleton className="h-4 w-1/4 mb-1" /> {/* "Município" label */}
                <Skeleton className="h-5 w-1/2" />    {/* Municipality name placeholder */}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent><Skeleton className="h-20 w-full" /></CardContent>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    console.log('[FarmerViewRequestPage] Rendering Error:', error);
    return (
      <PageWrapper allowedRoles={['farmer', 'admin']}>
        <div className="text-center py-10">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-destructive">{error}</h2>
          <Button onClick={() => router.push(APP_ROUTES.FARMER_DASHBOARD)} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Ir para o Painel
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!request) {
    console.log('[FarmerViewRequestPage] Rendering "Não foi possível carregar..." (request is null/undefined).');
    return (
      <PageWrapper allowedRoles={['farmer', 'admin']}>
        <p>Não foi possível carregar os detalhes do pedido. Verifique se o ID do pedido é válido ou tente novamente mais tarde.</p>
         <Button onClick={() => router.push(APP_ROUTES.FARMER_DASHBOARD)} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Ir para o Painel
          </Button>
      </PageWrapper>
    );
  }
  
  console.log('[FarmerViewRequestPage] Rendering main content for request:', request.id);
  return (
    <PageWrapper allowedRoles={['farmer', 'admin']}>
      <div className="max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => router.back()} className="mb-6 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Detalhes do Pedido</CardTitle>
            <CardDescription>ID: {request.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <LocationDisplay />
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center"><ImageIcon className="h-4 w-4 mr-2 text-primary" />Fotos Enviadas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {request.photoDataUris.map((uri, index) => (
                  <div
                    key={index}
                    className="rounded-lg overflow-hidden border border-border aspect-square bg-muted cursor-pointer"
                    onClick={() => handleImageClick(uri)}
                    data-ai-hint="cassava plant"
                  >
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

        <StatusDisplay
          status={request.status}
          recommendation={request.recommendation}
          technicianName={request.technicianName}
          responseDate={request.responseDate}
        />
      </div>

      {expandedImageUri && (
        <Dialog open={!!expandedImageUri} onOpenChange={(open) => { if (!open) closeImageModal(); }}>
          <DialogContent className="max-w-screen-md max-h-[90vh] p-2 bg-background overflow-hidden">
            <DialogHeader>
              <UIDialogTitle>Imagem Expandida</UIDialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[85vh]">
                <Image
                    src={expandedImageUri}
                    alt="Imagem expandida do pedido"
                    fill
                    style={{objectFit: "contain"}}
                />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageWrapper>
  );
}
