
'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import PageWrapper from '@/components/shared/PageWrapper';
import type { AgriRequest } from '@/types';
import { getRequestById } from '@/services/requestService'; // Use Firestore service
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge }   from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, Clock, CalendarDays, User, Microscope, Image as ImageIcon, Sprout, LandPlot, AlertTriangle, MapPin, WifiOff, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { APP_ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast'; // Import useToast

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
          <p className="text-muted-foreground">Seu Levantamento está atualmente em revisão por um técnico. Você será notificado assim que uma resposta estiver disponível.</p>
        </CardContent>
      )}
    </Card>
  );
};


export default function FarmerViewRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { user, initializing } = useAuth();
  const { toast } = useToast(); // Initialize useToast
  const [request, setRequest] = useState<AgriRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedImageUri, setExpandedImageUri] = useState<string | null>(null);

  const requestId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (initializing) return; 

    if (!requestId) {
        setError("ID do Levantamento inválido.");
        setIsLoading(false);
        return;
    }
    
    if (!user) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    getRequestById(requestId)
      .then(data => {
        if (data && (data.farmerCpf === user.cpf || user.role === 'admin')) { 
          setRequest(data);
        } else if (data) {
          setError("Você não tem autorização para ver este Levantamento.");
          toast({ title: "Acesso Negado", description: "Você não tem permissão para ver este Levantamento.", variant: "destructive"});
        } else {
          setError("Levantamento não encontrado.");
          toast({ title: "Erro", description: "Levantamento não encontrado.", variant: "destructive"});
        }
      })
      .catch(err => {
        console.error("[FarmerViewRequestPage] Falha ao buscar Levantamento:", err);
        setError("Falha ao carregar detalhes do Levantamento.");
        toast({ title: "Erro ao Carregar", description: "Falha ao carregar detalhes do Levantamento. Tente novamente.", variant: "destructive"});
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [requestId, user, initializing, router, toast]);

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

  const VarietyDisplay = ({ request }: { request: AgriRequest | null }) => {
    if (!request) return null;
    const hasMandioca = request.isMandioca && request.mandiocaVariety;
    const hasMacaxeira = request.isMacaxeira && request.macaxeiraVariety;

    if (!hasMandioca && !hasMacaxeira) {
        return (
             <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Microscope className="h-4 w-4 mr-2 text-primary" />Variedade da Planta</h3>
              <p className="text-lg text-foreground">Não especificada</p>
            </div>
        )
    }

    return (
        <>
            {hasMandioca && (
                 <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Microscope className="h-4 w-4 mr-2 text-primary" />Variedade da Mandioca</h3>
                    <p className="text-lg text-foreground">{request.mandiocaVariety}</p>
                </div>
            )}
             {hasMacaxeira && (
                 <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Microscope className="h-4 w-4 mr-2 text-primary" />Variedade da Macaxeira</h3>
                    <p className="text-lg text-foreground">{request.macaxeiraVariety}</p>
                </div>
            )}
        </>
    )
  }

  const AreaDisplay = ({ request }: { request: AgriRequest | null }) => {
    if (!request) return null;
    
    const showMandiocaArea = request.isMandioca && (typeof request.mandiocaPlantedArea === 'number' || typeof request.mandiocaInfectedArea === 'number' || request.mandiocaPlantingDate || request.mandiocaSymptomsDate);
    const showMacaxeiraArea = request.isMacaxeira && (typeof request.macaxeiraPlantedArea === 'number' || typeof request.macaxeiraInfectedArea === 'number' || request.macaxeiraPlantingDate || request.macaxeiraSymptomsDate);

    return (
      <>
        {showMandiocaArea && (
          <div className='mt-4 space-y-4'>
            <h4 className='font-semibold text-primary'>Detalhes da Mandioca</h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {typeof request.mandiocaPlantedArea === 'number' && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center"><LandPlot className="h-4 w-4 mr-2 text-primary" />Área Plantada</h3>
                    <p className="text-lg text-foreground">{request.mandiocaPlantedArea} ha</p>
                </div>
                )}
                {typeof request.mandiocaInfectedArea === 'number' && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center"><AlertTriangle className="h-4 w-4 mr-2 text-destructive" />Área Infectada</h3>
                    <p className="text-lg text-foreground">{request.mandiocaInfectedArea} ha</p>
                </div>
                )}
                {request.mandiocaPlantingDate && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarIcon className="h-4 w-4 mr-2 text-primary" />Início do Plantio</h3>
                    <p className="text-lg text-foreground">{format(new Date(request.mandiocaPlantingDate), "d 'de' MMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                )}
                 {request.mandiocaSymptomsDate && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarIcon className="h-4 w-4 mr-2 text-destructive" />Início dos Sintomas</h3>
                    <p className="text-lg text-foreground">{format(new Date(request.mandiocaSymptomsDate), "d 'de' MMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                )}
            </div>
          </div>
        )}
        {showMacaxeiraArea && (
          <div className='mt-4 space-y-4'>
            <h4 className='font-semibold text-primary'>Detalhes da Macaxeira</h4>
             <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {typeof request.macaxeiraPlantedArea === 'number' && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center"><LandPlot className="h-4 w-4 mr-2 text-primary" />Área Plantada</h3>
                    <p className="text-lg text-foreground">{request.macaxeiraPlantedArea} ha</p>
                </div>
                )}
                {typeof request.macaxeiraInfectedArea === 'number' && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center"><AlertTriangle className="h-4 w-4 mr-2 text-destructive" />Área Infectada</h3>
                    <p className="text-lg text-foreground">{request.macaxeiraInfectedArea} ha</p>
                </div>
                )}
                {request.macaxeiraPlantingDate && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarIcon className="h-4 w-4 mr-2 text-primary" />Início do Plantio</h3>
                    <p className="text-lg text-foreground">{format(new Date(request.macaxeiraPlantingDate), "d 'de' MMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                )}
                 {request.macaxeiraSymptomsDate && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarIcon className="h-4 w-4 mr-2 text-destructive" />Início dos Sintomas</h3>
                    <p className="text-lg text-foreground">{format(new Date(request.macaxeiraSymptomsDate), "d 'de' MMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                )}
            </div>
          </div>
        )}
      </>
    );
  };

 const LocationDisplay = () => {
    if (!request) return null;

    let locationString = "";
    let municipalityDisplayString = request.municipality ? `${request.municipality}` : "Aguardando processamento da IA";

    if (typeof request.latitude === 'number' && typeof request.longitude === 'number') {
      locationString = `Lat: ${request.latitude.toFixed(6)}, Long: ${request.longitude.toFixed(6)}`;
    } else {
      locationString = "Coordenadas não disponíveis.";
    }

    return (
      <>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />Localização
          </h3>
          <p className={`text-lg ${locationString.startsWith("Lat:") ? 'text-foreground' : 'text-muted-foreground'}`}>
            {locationString.startsWith("Lat:") ? locationString : <span className="flex items-center"><WifiOff className="h-4 w-4 mr-2 text-destructive" /> {locationString}</span>}
          </p>
           <p className="text-xs text-muted-foreground mt-1">
              A localização final é confirmada pela IA, priorizando a extração da foto sobre o GPS do dispositivo.
              (Status do GPS do dispositivo no envio: {request.deviceLocationStatus || 'não registrado'})
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


  if (isLoading || initializing) { 
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
              <Skeleton className="h-5 w-1/3" /> 
              <Skeleton className="h-5 w-1/3" /> 
              <div>
                <Skeleton className="h-4 w-1/3 mb-1" /> 
                <Skeleton className="h-5 w-3/4 mb-1" /> 
                <Skeleton className="h-3 w-1/2" />      
              </div>
              <div>
                <Skeleton className="h-4 w-1/4 mb-1" /> 
                <Skeleton className="h-5 w-1/2" />    
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
    return (
      <PageWrapper allowedRoles={['farmer', 'admin']}>
        <div className="text-center py-10">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-destructive">{error}</h2>
          <Button onClick={() => router.push(user?.role === 'admin' ? APP_ROUTES.ADMIN_DASHBOARD : APP_ROUTES.FARMER_DASHBOARD)} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Ir para o Painel
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!request) {
    return (
      <PageWrapper allowedRoles={['farmer', 'admin']}>
        <div className="text-center py-10">
          <XCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Levantamento Não Encontrado</h2>
          <p className="text-muted-foreground">Não foi possível carregar os detalhes do Levantamento. Verifique se o ID do Levantamento é válido ou tente novamente mais tarde.</p>
           <Button onClick={() => router.push(user?.role === 'admin' ? APP_ROUTES.ADMIN_DASHBOARD : APP_ROUTES.FARMER_DASHBOARD)} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Ir para o Painel
          </Button>
        </div>
      </PageWrapper>
    );
  }
  
  return (
    <PageWrapper allowedRoles={['farmer', 'admin']}>
      <div className="max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => router.back()} className="mb-6 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Detalhes do Levantamento</CardTitle>
            <CardDescription>ID: {request.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Sprout className="h-4 w-4 mr-2 text-primary" />Tipo de Planta</h3>
              <p className="text-lg text-foreground">{getPlantTypeDisplay(request)}</p>
            </div>
            
            <VarietyDisplay request={request} />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" />Enviado Em</h3>
              <p className="text-lg text-foreground">{request.submissionDate ? format(new Date(request.submissionDate), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível'}</p>
            </div>
             
            <AreaDisplay request={request} />
            <LocationDisplay />
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center"><ImageIcon className="h-4 w-4 mr-2 text-primary" />Fotos Enviadas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {request.photoUrls.map((url, index) => (
                  <div
                    key={index}
                    className="rounded-lg overflow-hidden border border-border aspect-square bg-muted cursor-pointer"
                    onClick={() => handleImageClick(url)}
                    data-ai-hint="cassava plant"
                  >
                    <Image
                      src={url} // Use Firebase Storage URL
                      alt={`Foto enviada ${index + 1}`}
                      width={300}
                      height={300}
                      className="object-cover h-full w-full hover:scale-105 transition-transform duration-300"
                      unoptimized={url.startsWith('https://placehold.co')}
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
                    alt="Imagem expandida do Levantamento"
                    fill
                    style={{objectFit: "contain"}}
                    unoptimized={expandedImageUri.startsWith('https://placehold.co')}
                />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageWrapper>
  );
}
