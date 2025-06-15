
'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import PageWrapper from '@/components/shared/PageWrapper';
import ResponseForm from '@/components/technician/ResponseForm';
import type { AgriRequest } from '@/types';
import { mockRequests, deleteMockRequest, updateMockRequest } from '@/lib/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, CalendarDays, Microscope, Image as ImageIcon, XCircle, Loader2, Sprout, LandPlot, AlertTriangleIcon, MapPin, Trash2, EyeOff, Eye as EyeIcon, Sparkles, LocateFixed, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { APP_ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateRecommendation } from '@/ai/flows/generate-recommendation-from-image';


const fetchRequestByIdForTechnician = async (requestId: string): Promise<AgriRequest | undefined> => {
  console.log('[TechnicianViewRequestPage] Fetching request for ID:', requestId);
  await new Promise(resolve => setTimeout(resolve, 300)); 
  const request = mockRequests.find(req => req.id === requestId);
  console.log('[TechnicianViewRequestPage] Found request:', request);
  return request;
};


export default function TechnicianViewRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { user, initializing: authInitializing } = useAuth(); 
  const { toast } = useToast();
  const [request, setRequest] = useState<AgriRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedImageUri, setExpandedImageUri] = useState<string | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const requestId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (authInitializing) {
      return; 
    }

    if (!user && !authInitializing) {
        router.replace(APP_ROUTES.LOGIN);
        return;
    }
    
    if (requestId && user) {
      setIsLoading(true);
      setError(null);
      fetchRequestByIdForTechnician(requestId)
        .then(async (data) => {
          if (data) {
            // If request is pending and AI suggestion is not present, run AI flow
            // Also check if latitude/longitude from AI are missing, even if a suggestion exists (e.g., from manual entry before AI)
            if (data.status === 'Pending' && (!data.aiSuggestedRecommendation || data.latitude === undefined || data.longitude === undefined) ) {
              setIsAiProcessing(true);
              try {
                const aiInput = {
                  cassavaType: data.cassavaType,
                  isMandioca: data.isMandioca,
                  isMacaxeira: data.isMacaxeira,
                  photoDataUri1: data.photoDataUris[0],
                  photoDataUri2: data.photoDataUris[1],
                  photoDataUri3: data.photoDataUris[2],
                  plantedArea: data.plantedArea,
                  infectedArea: data.infectedArea,
                  deviceLatitude: data.latitude, // Pass device-captured lat if available
                  deviceLongitude: data.longitude, // Pass device-captured lon if available
                };
                const aiOutput = await generateRecommendation(aiInput);
                
                const updatedRequestWithAIData: AgriRequest = {
                  ...data,
                  aiSuggestedRecommendation: aiOutput.recommendation,
                  // AI output (extractedLatitude/Longitude) now becomes the primary source for these fields after AI processing
                  latitude: aiOutput.extractedLatitude, 
                  longitude: aiOutput.extractedLongitude,
                };
                
                const savedUpdatedRequest = await updateMockRequest(updatedRequestWithAIData);
                if (savedUpdatedRequest) {
                  setRequest(savedUpdatedRequest);
                  toast({ title: "Sugestão e Localização da IA Carregadas", description: "Recomendação e localização (se aplicável) foram processadas pela IA." });
                } else {
                  setRequest(data); // Fallback to original data if update fails
                  toast({ title: "Erro ao Salvar Dados da IA", description: "Não foi possível salvar as sugestões da IA.", variant: "destructive" });
                }
              } catch (aiError) {
                console.error("[TechnicianViewRequestPage] Falha ao gerar recomendação da IA:", aiError);
                toast({ title: "Falha na IA", description: "Não foi possível obter a sugestão da IA.", variant: "destructive" });
                setRequest(data); // Set original data if AI fails
              } finally {
                setIsAiProcessing(false);
              }
            } else {
              setRequest(data); // AI already processed or not applicable
            }
          } else {
            setError("Pedido não encontrado.");
          }
        })
        .catch(err => {
          console.error("[TechnicianViewRequestPage] Falha ao buscar pedido:", err);
          setError("Falha ao carregar detalhes do pedido.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!requestId && !authInitializing) {
      setError("ID do pedido inválido.");
      setIsLoading(false);
    }
  }, [requestId, user, authInitializing, router, toast]);

  const getPlantTypeDisplay = (req: AgriRequest | null): string => {
    if (!req) return 'Não especificado';
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

  const handleOpenDeleteDialog = () => {
    setAdminPassword('');
    setShowPassword(false);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!user || user.role !== 'admin' || !request) return;

    setIsDeleting(true);
    if (adminPassword === user.password) { // Ensure user.password is available and correct
      try {
        const success = await deleteMockRequest(request.id);
        if (success) {
          toast({ title: 'Pedido Removido', description: `O pedido ID ${request.id} foi removido com sucesso.` });
          router.push(APP_ROUTES.ADMIN_DASHBOARD);
        } else {
          toast({ title: 'Erro na Remoção', description: 'Não foi possível encontrar o pedido para remover.', variant: 'destructive' });
        }
      } catch (e) {
        toast({ title: 'Erro na Remoção', description: 'Ocorreu um erro ao tentar remover o pedido.', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Senha Incorreta', description: 'A senha de administrador está incorreta.', variant: 'destructive' });
    }
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    setAdminPassword('');
  };

  const LocationDisplay = () => {
    if (typeof request?.latitude === 'number' && typeof request?.longitude === 'number') {
      let source = "Extraída/Confirmada pela IA";
      if (request.deviceLocationStatus === 'success') {
        source = "Fornecida pelo Dispositivo do Agricultor";
      } else if (request.deviceLocationStatus && request.deviceLocationStatus !== 'idle' && request.deviceLocationStatus !== 'fetching') {
        source = `Tentativa do Dispositivo: ${request.deviceLocationStatus}, Localização da IA`;
      }
      return (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />Localização
          </h3>
          <p className="text-lg text-foreground">Lat: {request.latitude.toFixed(6)}, Long: {request.longitude.toFixed(6)}</p>
          <p className="text-xs text-muted-foreground">Fonte: {source}</p>
        </div>
      );
    } else if (request?.deviceLocationStatus && request.deviceLocationStatus !== 'success' && request.deviceLocationStatus !== 'idle' && request.deviceLocationStatus !== 'fetching') {
       return (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />Localização
          </h3>
          <p className="text-lg text-muted-foreground flex items-center">
            <WifiOff className="h-4 w-4 mr-2 text-destructive" /> Nenhuma localização GPS finalizada.
          </p>
          <p className="text-xs text-muted-foreground">Status do GPS do agricultor: {request.deviceLocationStatus}. A IA não extraiu das imagens.</p>
        </div>
      );
    }
    return null; // No location data to display
  };


  if (isLoading || authInitializing) {
    return (
       <PageWrapper allowedRoles={['technician', 'admin']}>
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
      <PageWrapper allowedRoles={['technician', 'admin']}>
        <div className="text-center py-10">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-destructive">{error}</h2>
          <Button onClick={() => router.push(user?.role === 'admin' ? APP_ROUTES.ADMIN_DASHBOARD : APP_ROUTES.TECHNICIAN_DASHBOARD)} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Ir para o Painel
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!request) {
    return (
      <PageWrapper allowedRoles={['technician', 'admin']}>
         <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-foreground">Carregando pedido...</h2>
           <p className="text-muted-foreground">Se esta mensagem persistir, o pedido pode não ter sido encontrado.</p>
          <Button onClick={() => router.push(user?.role === 'admin' ? APP_ROUTES.ADMIN_DASHBOARD : APP_ROUTES.TECHNICIAN_DASHBOARD)} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Ir para o Painel
          </Button>
        </div>
      </PageWrapper>
    );
  }
  
  return (
    <PageWrapper allowedRoles={['technician', 'admin']}>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => router.back()} className="group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar
            </Button>
            {user?.role === 'admin' && (
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" onClick={handleOpenDeleteDialog}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remover Pedido
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Remoção do Pedido</AlertDialogTitle>
                    <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Para confirmar a remoção do pedido ID <span className="font-semibold">{request.id}</span>, por favor, digite sua senha de administrador.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 my-4">
                    <Label htmlFor="admin-password">Senha do Administrador</Label>
                    <div className="relative">
                        <Input 
                            id="admin-password" 
                            type={showPassword ? "text" : "password"} 
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Digite sua senha"
                        />
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" 
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            <span className="sr-only">{showPassword ? "Esconder senha" : "Mostrar senha"}</span>
                        </Button>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setAdminPassword('')}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleConfirmDelete} 
                        disabled={isDeleting || adminPassword.length === 0 || !user?.password}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Confirmar Remoção
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            )}
        </div>

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
        
        {isAiProcessing && (
            <Card className="mt-6">
                <CardContent className="pt-6 text-center">
                    <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin mb-3" />
                    <p className="text-muted-foreground">Aguarde, a Inteligência Artificial está analisando as imagens e preparando uma sugestão...</p>
                </CardContent>
            </Card>
        )}

        {!isAiProcessing && request.status === 'Pending' && user?.role === 'technician' ? ( 
          <ResponseForm request={request} />
        ) : !isAiProcessing && request.status !== 'Pending' ? (
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
                   {request.technicianId === user?.id ? `Por Você (${request.technicianName})` : `Por ${request.technicianName}`} em {format(new Date(request.responseDate), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
            </CardContent>
          </Card>
        ) : null }
      </div>

      {expandedImageUri && (
         <Dialog open={!!expandedImageUri} onOpenChange={(open) => { if (!open) closeImageModal(); }}>
          <DialogContent className="max-w-screen-md max-h-[90vh] p-2 bg-background overflow-hidden">
            <div className="relative w-full h-[85vh]">
                <Image 
                    src={expandedImageUri} 
                    alt="Imagem expandida" 
                    fill 
                    style={{ objectFit: 'contain' }}
                />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageWrapper>
  );
}
    
