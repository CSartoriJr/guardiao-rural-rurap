
'use client';
import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import ImageUploadInput from '@/components/shared/ImageUploadInput';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { AgriRequest, DeviceLocationStatus } from '@/types';
import { addRequest as addRequestToFirestore } from '@/services/requestService'; // Use Firestore service
import { Loader2, Send, LandPlot, AlertTriangle, MapPin, LocateFixed, WifiOff, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';

const requestFormSchema = z.object({
  cassavaVariety: z.string().min(2, { message: 'A variedade deve ter pelo menos 2 caracteres.' }),
  isMandioca: z.boolean().optional(),
  isMacaxeira: z.boolean().optional(),
  photoUrl1: z.string().url({ message: "A URL da foto Panorâmica é inválida."}).nullable(), // Now expects URL
  photoUrl2: z.string().url({ message: "A URL da foto de Envassoramento é inválida."}).nullable(), // Now expects URL
  photoUrl3: z.string().url({ message: "A URL da foto do Corte do Ápice é inválida."}).nullable(), // Now expects URL
  plantedArea: z.coerce.number().min(0, {message: "A área plantada deve ser um número positivo."}).optional().or(z.literal('')),
  infectedArea: z.coerce.number().min(0, {message: "A área infectada deve ser um número positivo."}).optional().or(z.literal('')),
})
.refine(data => data.isMandioca || data.isMacaxeira, {
  message: "Selecione pelo menos Mandioca ou Macaxeira.",
  path: ["isMandioca"], 
})
.refine(data => {
  const planted = typeof data.plantedArea === 'number' ? data.plantedArea : undefined;
  const infected = typeof data.infectedArea === 'number' ? data.infectedArea : undefined;
  if (planted !== undefined && infected !== undefined) {
    return infected <= planted;
  }
  return true;
}, {
  message: "A área infectada não pode ser maior que a área plantada.",
  path: ["infectedArea"],
})
.refine(data => data.photoUrl1 && data.photoUrl2 && data.photoUrl3, {
    message: "Todas as três fotos são obrigatórias.",
    path: ["photoUrl1"], // Or any other common path
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function RequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<DeviceLocationStatus>('idle');

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      cassavaVariety: '',
      isMandioca: false,
      isMacaxeira: false,
      photoUrl1: null,
      photoUrl2: null,
      photoUrl3: null,
      plantedArea: '',
      infectedArea: '',
    },
  });

  const fetchDeviceLocation = useCallback(() => {
    if (navigator.geolocation) {
      setLocationStatus('fetching');
      setLatitude(null);
      setLongitude(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocationStatus('success');
          toast({ title: "Localização Obtida", description: "Sua localização GPS foi capturada com sucesso." });
        },
        (error) => {
          console.warn("Erro ao obter geolocalização:", error.message);
          let message = "Não foi possível obter sua localização GPS.";
          let status: DeviceLocationStatus = 'error';
          if (error.code === error.PERMISSION_DENIED) {
            message = "Permissão para acessar a localização foi negada.";
            status = 'denied';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = "Informação de localização não está disponível.";
            status = 'unavailable';
          } else if (error.code === error.TIMEOUT) {
            message = "Tempo esgotado ao tentar obter a localização.";
            status = 'timeout';
          }
          setLocationStatus(status);
          toast({ title: "Erro de Localização", description: message, variant: "destructive" });
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 } 
      );
    } else {
      setLocationStatus('unsupported');
      toast({ title: "Geolocalização Não Suportada", description: "Seu navegador não suporta geolocalização.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    fetchDeviceLocation();
  }, [fetchDeviceLocation]);


  const onSubmit: SubmitHandler<RequestFormValues> = async (data) => {
    if (!user || !user.id || !user.name) {
      toast({ title: "Erro", description: "Você deve estar logado para enviar um pedido.", variant: "destructive" });
      return;
    }
    if (!data.photoUrl1 || !data.photoUrl2 || !data.photoUrl3) {
      toast({ title: "Fotos Faltando", description: "Por favor, envie todas as três fotos.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const requestDataForFirestore: Omit<AgriRequest, 'id' | 'submissionDate' | 'status' | 'responseDate' | 'technicianId' | 'technicianName' | 'recommendation'> = {
        farmerId: user.id,
        farmerName: user.name,
        cassavaType: data.cassavaVariety,
        isMandioca: data.isMandioca,
        isMacaxeira: data.isMacaxeira,
        photoUrls: [data.photoUrl1, data.photoUrl2, data.photoUrl3],
        plantedArea: typeof data.plantedArea === 'number' ? data.plantedArea : undefined,
        infectedArea: typeof data.infectedArea === 'number' ? data.infectedArea : undefined,
        latitude: latitude ?? undefined, 
        longitude: longitude ?? undefined, 
        deviceLocationStatus: locationStatus,
        municipality: user.municipality || undefined,
      };
      
      const newRequest = await addRequestToFirestore(requestDataForFirestore); 
      
      const plantTypes = [];
      if (data.isMandioca) plantTypes.push('Mandioca');
      if (data.isMacaxeira) plantTypes.push('Macaxeira');
      const plantTypeDisplay = plantTypes.join(' e ');

      toast({
        title: 'Pedido Enviado!',
        description: `Seu pedido para ${plantTypeDisplay} (Variedade: ${data.cassavaVariety}) foi enviado com sucesso. ID: ${newRequest.id}.`,
      });
      router.push(APP_ROUTES.FARMER_DASHBOARD);
    } catch (error: any) {
      console.error("Falha ao enviar pedido:", error);
      toast({ title: "Falha no Envio", description: error.message || "Não foi possível enviar seu pedido. Por favor, tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const LocationInfo = () => {
    let message: React.ReactNode;
    let showRetryButton = false;

    switch (locationStatus) {
      case 'fetching':
        message = <p className="text-sm flex items-center text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Obtendo sua localização GPS...</p>;
        break;
      case 'success':
        message = <p className="text-sm text-green-600 flex items-center"><LocateFixed className="h-4 w-4 mr-2" /> Localização GPS obtida: Lat {latitude?.toFixed(4)}, Long {longitude?.toFixed(4)}</p>;
        break;
      case 'denied':
        message = <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Permissão de GPS negada. A localização não será anexada.</p>;
        showRetryButton = true;
        break;
      case 'unavailable':
        message = <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Informação de localização indisponível.</p>;
        showRetryButton = true;
        break;
      case 'timeout':
        message = <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Tempo esgotado ao tentar obter GPS.</p>;
        showRetryButton = true;
        break;
      case 'error':
        message = <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Falha ao obter GPS.</p>;
        showRetryButton = true;
        break;
      case 'unsupported':
         message = <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Geolocalização não suportada pelo seu navegador.</p>;
         break;
      default: // idle
        message = <p className="text-sm text-muted-foreground">A localização GPS será capturada se disponível. A IA também tentará extrair das fotos.</p>;
        showRetryButton = true; // Allow retry even from idle if initial fetch didn't occur or was too quick
        break;
    }

    return (
      <div className="space-y-2">
        {message}
        {showRetryButton && locationStatus !== 'fetching' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchDeviceLocation}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        )}
      </div>
    );
  };


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Enviar Novo Pedido</CardTitle>
        <CardDescription>Forneça detalhes sobre sua planta e envie três fotos nítidas. Sua localização GPS será capturada automaticamente, se permitida.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Tipo de Planta</Label>
            <div className="flex items-center space-x-4">
              <Controller
                name="isMandioca"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isMandioca"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        startTransition(() => {
                          field.onChange(checked);
                        });
                      }}
                    />
                    <Label htmlFor="isMandioca" className="font-normal">Mandioca</Label>
                  </div>
                )}
              />
              <Controller
                name="isMacaxeira"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isMacaxeira"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        startTransition(() => {
                          field.onChange(checked);
                        });
                      }}
                    />
                    <Label htmlFor="isMacaxeira" className="font-normal">Macaxeira</Label>
                  </div>
                )}
              />
            </div>
            {errors.isMandioca && <p className="text-sm text-destructive">{errors.isMandioca.message}</p>}
            {errors.root?.message && !errors.isMandioca && <p className="text-sm text-destructive">{errors.root.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cassavaVariety">Variedade (ex: Castelinha, Mandioca BRS 399, IAC 14-18 Verdinha, ...)</Label>
            <Controller
              name="cassavaVariety"
              control={control}
              render={({ field }) => <Input id="cassavaVariety" placeholder="ex: Castelinha, BRS 399, IAC 14-18 Verdinha" {...field} />}
            />
            {errors.cassavaVariety && <p className="text-sm text-destructive">{errors.cassavaVariety.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="photoUrl1">Panorâmica</Label>
              <ImageUploadInput id="photoUrl1" onUploadComplete={(url) => setValue('photoUrl1', url, { shouldValidate: true })} />
              {errors.photoUrl1 && <p className="text-sm text-destructive mt-1">{errors.photoUrl1.message}</p>}
            </div>
            <div>
              <Label htmlFor="photoUrl2">Envassoramento</Label>
              <ImageUploadInput id="photoUrl2" onUploadComplete={(url) => setValue('photoUrl2', url, { shouldValidate: true })} />
              {errors.photoUrl2 && <p className="text-sm text-destructive mt-1">{errors.photoUrl2.message}</p>}
            </div>
            <div>
              <Label htmlFor="photoUrl3">Corte do Ápice da Planta</Label>
              <ImageUploadInput id="photoUrl3" onUploadComplete={(url) => setValue('photoUrl3', url, { shouldValidate: true })} />
              {errors.photoUrl3 && <p className="text-sm text-destructive mt-1">{errors.photoUrl3.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
                <Label htmlFor="plantedArea" className="flex items-center">
                    <LandPlot className="h-4 w-4 mr-2 text-primary" />
                    Área Plantada (em hectares)
                </Label>
                <Controller
                name="plantedArea"
                control={control}
                render={({ field }) => (
                    <div className="flex items-center">
                    <Input id="plantedArea" type="number" step="any" min="0" placeholder="Ex: 5.5" {...field} className="rounded-r-none" />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-muted-foreground text-sm h-10">
                        ha
                    </span>
                    </div>
                )}
                />
                {errors.plantedArea && <p className="text-sm text-destructive">{errors.plantedArea.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="infectedArea" className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                    Área Infectada (em hectares)
                </Label>
                <Controller
                name="infectedArea"
                control={control}
                render={({ field }) => (
                    <div className="flex items-center">
                    <Input id="infectedArea" type="number" step="any" min="0" placeholder="Ex: 1.2" {...field} className="rounded-r-none" />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-muted-foreground text-sm h-10">
                        ha
                    </span>
                    </div>
                )}
                />
                {errors.infectedArea && <p className="text-sm text-destructive">{errors.infectedArea.message}</p>}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />Localização GPS do Dispositivo</Label>
            <div className="text-sm p-3 border border-dashed rounded-md bg-muted/30">
                <LocationInfo />
            </div>
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar Pedido
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
