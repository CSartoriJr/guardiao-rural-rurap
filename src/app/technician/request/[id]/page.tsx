'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import PageWrapper from '@/components/shared/PageWrapper';
import ResponseForm from '@/components/technician/ResponseForm';
import type { AgriRequest, DeviceLocationStatus, User as AppUser, RegistrationStatus } from '@/types';
import { getRequestById, updateRequest as updateRequestInFirestore, deleteRequestFromFirestore } from '@/services/requestService'; // Use Firestore
import { getUserDocument } from '@/services/userService'; // Import service to get user data
import { updateUserAsAdmin } from '@/ai/flows/update-user-by-admin'; // Import server action to update user
import { amapaMunicipalities } from '@/lib/mockData'; // For municipality list, not for request data itself
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, CalendarDays, Microscope, Image as ImageIcon, XCircle, Loader2, Sprout, LandPlot, AlertTriangle, MapPin, Trash2, EyeOff, Eye as EyeIcon, Sparkles, LocateFixed, WifiOff, Calendar as CalendarIcon, WholeWord, Leaf, Download, UserCheck, UserX, AlertCircle, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { APP_ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle as UIDialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateRecommendation } from '@/ai/flows/generate-recommendation-from-image';
import Link from 'next/link';

// New component for managing registration status
const RegistrationStatusCard = ({
  farmer,
  onStatusChange,
}: {
  farmer: AppUser;
  onStatusChange: (newStatus: RegistrationStatus) => void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (farmer.registrationStatus !== 'Pendente') {
    return null;
  }

  const handleStatusUpdate = async (newStatus: RegistrationStatus) => {
    setIsUpdating(true);
    await onStatusChange(newStatus);
    setIsUpdating(false);
  };

  return (
    <Card className="mb-6 border-yellow-400 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center text-lg text-yellow-800">
          <AlertCircle className="h-5 w-5 mr-2" />
          Cadastro do Agricultor Pendente
        </CardTitle>
        <CardDescription className="text-yellow-700">
          O cadastro de <strong>{farmer.name}</strong> precisa de validação.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex gap-4">
        <Button
          onClick={() => handleStatusUpdate('Confirmado')}
          disabled={isUpdating}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
          Confirmar Cadastro
        </Button>
        <Button
          onClick={() => handleStatusUpdate('Inapto')}
          disabled={isUpdating}
          variant="destructive"
        >
          {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
          Marcar como Inapto
        </Button>
      </CardFooter>
    </Card>
  );
};


export default function TechnicianViewRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { user, initializing: authInitializing } = useAuth();
  const { toast } = useToast();

  const [request, setRequest] = useState<AgriRequest | null>(null);
  const [farmer, setFarmer] = useState<AppUser | null>(null); // State for farmer data
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [expandedImageUri, setExpandedImageUri] = useState<string | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const requestId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => { // Effect for initial data loading
    if (authInitializing || !user) {
      if(!authInitializing && !user) setIsLoading(false);
      return;
    }

    if (!requestId) {
      setError("ID da Solicitação inválido.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    getRequestById(requestId)
        .then(async (data) => {
            if (data) {
                setRequest(data);
                // After getting the request, fetch the farmer's full document
                if (data.farmerId) {
                  const farmerDoc = await getUserDocument(data.farmerId);
                  if (farmerDoc) {
                    setFarmer(farmerDoc);
                  } else {
                    toast({ title: "Erro", description: "Não foi possível encontrar os dados do agricultor.", variant: "destructive" });
                  }
                }
            } else {
                setError("Solicitação não encontrada.");
                toast({title: "Erro", description: "Solicitação não encontrada no Firestore.", variant: "destructive"});
            }
        })
        .catch(err => {
            console.error("[TechnicianViewRequestPage] Falha ao buscar dados:", err);
            setError("Falha ao carregar detalhes da Solicitação.");
            toast({title: "Erro ao Carregar", description: "Falha ao carregar detalhes. Tente novamente.", variant: "destructive"});
        })
        .finally(() => {
            setIsLoading(false);
        });
    
  }, [requestId, user, authInitializing, router, toast]);

  const handleFarmerStatusChange = async (newStatus: RegistrationStatus) => {
    if (!farmer) return;
    
    try {
      const result = await updateUserAsAdmin({
        userId: farmer.id,
        updatedData: { registrationStatus: newStatus },
      });

      if (!result.success) {
        throw new Error(result.message || 'Falha ao atualizar o status do agricultor.');
      }
      
      // Update local state to reflect the change immediately
      setFarmer(prevFarmer => prevFarmer ? { ...prevFarmer, registrationStatus: newStatus } : null);
      
      toast({
        title: 'Status do Agricultor Atualizado',
        description: `O cadastro de ${farmer.name} foi atualizado para "${newStatus}".`,
      });
    } catch (error: any) {
      console.error("Falha ao atualizar status do agricultor:", error);
      toast({ title: "Falha na Atualização", description: error.message, variant: "destructive" });
    }
  };


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
    if (!user || user.role !== 'admin' || !request || !requestId) return;

    setIsDeleting(true);
    // Placeholder for admin password check
    if (adminPassword === "23jr02cs") {
      try {
        await deleteRequestFromFirestore(requestId); 
        toast({ title: 'Solicitação Removida', description: `A Solicitação ID ${requestId} foi removido.` });
        router.push(APP_ROUTES.ADMIN_DASHBOARD);
      } catch (e: any) {
        toast({ title: 'Erro na Remoção', description: e.message || 'Ocorreu um erro ao tentar remover a Solicitação.', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Senha Incorreta', description: 'A senha de administrador está incorreta.', variant: 'destructive' });
    }
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    setAdminPassword('');
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

    let locationString = "Coordenadas GPS não disponíveis.";
    let municipalityDisplayString = request.municipality ? `${request.municipality}` : "Não determinado pela IA";

    if (typeof request.latitude === 'number' && typeof request.longitude === 'number') {
      locationString = `Lat: ${request.latitude.toFixed(6)}, Long: ${request.longitude.toFixed(6)}`;
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
              A localização final é confirmada pela IA, que prioriza a extração da foto sobre o GPS do dispositivo.
              (Status do GPS do dispositivo no envio: {request.deviceLocationStatus || 'não registrado'})
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />Município (Determinado pela IA)
          </h3>
          <p className={`text-lg ${request.municipality ? 'text-foreground' : 'text-muted-foreground'}`}>
            {municipalityDisplayString}
          </p>
        </div>
      </>
    );
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
          <XCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Solicitação Não Encontrada</h2>
          <p className="text-muted-foreground">Não foi possível carregar os detalhes da Solicitação. Verifique se o ID é válido.</p>
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
                        <Trash2 className="mr-2 h-4 w-4" /> Remover Solicitação
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Remoção da Solicitação</AlertDialogTitle>
                    <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Para confirmar a remoção da Solicitação ID <span className="font-semibold">{request.id}</span>, por favor, digite sua senha de administrador. (Senha de demonstração: 23jr02cs)
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
                        disabled={isDeleting || adminPassword.length === 0}
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
        
        {user?.role === 'technician' && farmer && farmer.registrationStatus === 'Pendente' && (
            <RegistrationStatusCard farmer={farmer} onStatusChange={handleFarmerStatusChange} />
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Detalhes da Solicitação do Agricultor</CardTitle>
            <CardDescription>ID: {request.id}</CardDescription>
            {request.technicianName && (
              <CardDescription className="flex items-center pt-1">
                <UserPlus className="h-4 w-4 mr-2 text-muted-foreground" />
                Registrado por: {request.technicianName}
              </CardDescription>
            )}
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
            
            <VarietyDisplay request={request} />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" />Enviado Em</h3>
              <p className="text-lg text-foreground">{request.submissionDate ? format(new Date(request.submissionDate), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : 'Data Indisponível'}</p>
            </div>
            
            <AreaDisplay request={request} />
            <LocationDisplay />

             {request.soilTexture && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center"><WholeWord className="h-4 w-4 mr-2 text-primary" />Textura do Solo</h3>
                <p className="text-lg text-foreground">{request.soilTexture}</p>
              </div>
            )}

            {request.vegetationType && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Leaf className="h-4 w-4 mr-2 text-primary" />Tipo de Vegetação</h3>
                <p className="text-lg text-foreground">{request.vegetationType}</p>
              </div>
            )}

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
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {request.status === 'Pending' && user?.role === 'technician' ? (
          <ResponseForm request={request} />
        ) : request.status !== 'Pending' ? (
          <Card className="mt-6 bg-card/80">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Resposta Enviada</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Status:</strong> {request.status === 'Positive' ? 'Positivo' : request.status === 'Negative' ? 'Possivelmente Negativo' : request.status === 'Inconclusive' ? 'Inconclusivo' : request.status === 'Suspeita de Infecção' ? 'Suspeita de Infecção' : 'Pendente'}</p>
              <p className="mt-2"><strong>Recomendação:</strong></p>
              <p className="whitespace-pre-wrap bg-muted p-3 rounded-md mt-1">{request.recommendation}</p>
              {request.technicianName && request.responseDate && (
                <p className="text-xs text-muted-foreground mt-3">
                   {request.technicianId === user?.id ? `Por Você (${request.technicianName})` : `Por ${request.technicianName}`} em {format(new Date(request.responseDate), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
               {request.laudoPdfUrl && (
                <Button asChild className="mt-4">
                    <Link href={request.laudoPdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4"/>
                        Baixar Laudo (PDF)
                    </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null }
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
                    alt="Imagem expandida da Solicitação"
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
