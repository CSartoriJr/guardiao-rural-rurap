
'use client';
import React, { useState, useEffect, useTransition } from 'react';
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
// import { addMockRequest } from '@/lib/mockData'; // To be replaced by Firestore service
import { addRequest } from '@/services/requestService'; // Import Firestore service
import { Loader2, Send, LandPlot, AlertTriangle, MapPin, LocateFixed, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';

const requestFormSchema = z.object({
  cassavaVariety: z.string().min(2, { message: 'A variedade deve ter pelo menos 2 caracteres.' }),
  isMandioca: z.boolean().optional(),
  isMacaxeira: z.boolean().optional(),
  photo1: z.string().url({ message: "A URL da foto Panorâmica é obrigatória e deve ser válida." }).nullable().refine(val => val !== null, { message: "A foto Panorâmica é obrigatória." }),
  photo2: z.string().url({ message: "A URL da foto de Envassoramento é obrigatória e deve ser válida." }).nullable().refine(val => val !== null, { message: "A foto de Envassoramento é obrigatória." }),
  photo3: z.string().url({ message: "A URL da foto do Corte do Ápice é obrigatória e deve ser válida." }).nullable().refine(val => val !== null, { message: "A foto do Corte do Ápice da Planta é obrigatória." }),
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
      photo1: null,
      photo2: null,
      photo3: null,
      plantedArea: '',
      infectedArea: '',
    },
  });

  useEffect(() => {
    if (navigator.geolocation) {
      setLocationStatus('fetching');
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
          if (error.code === error.PERMISSION_DENIED) {
            message = "Permissão para acessar a localização foi negada.";
            setLocationStatus('denied');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = "Informação de localização não está disponível.";
            setLocationStatus('unavailable');
          } else if (error.code === error.TIMEOUT) {
            message = "Tempo esgotado ao tentar obter a localização.";
            setLocationStatus('timeout');
          } else {
            setLocationStatus('error');
          }
          toast({ title: "Erro de Localização", description: message, variant: "destructive" });
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 } 
      );
    } else {
      setLocationStatus('unsupported');
      toast({ title: "Geolocalização Não Suportada", description: "Seu navegador não suporta geolocalização.", variant: "destructive" });
    }
  }, [toast]);


  const onSubmit: SubmitHandler<RequestFormValues> = async (data) => {
    if (!user) {
      toast({ title: "Erro", description: "Você deve estar logado para enviar um pedido.", variant: "destructive" });
      return;
    }
    if (!data.photo1 || !data.photo2 || !data.photo3) {
      toast({ title: "Fotos Faltando", description: "Por favor, envie todas as três fotos.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Data for Firestore (excluding id, submissionDate, status as they are set by the service)
      const requestDataForService = {
        farmerId: user.id,
        farmerName: user.name, // Add farmerName
        cassavaType: data.cassavaVariety,
        isMandioca: data.isMandioca,
        isMacaxeira: data.isMacaxeira,
        photoDataUris: [data.photo1, data.photo2, data.photo3] as [string, string, string],
        plantedArea: typeof data.plantedArea === 'number' ? data.plantedArea : undefined,
        infectedArea: typeof data.infectedArea === 'number' ? data.infectedArea : undefined,
        latitude: latitude ?? undefined, 
        longitude: longitude ?? undefined, 
        deviceLocationStatus: locationStatus,
        municipality: user.municipality, 
      };
      
      const newRequest = await addRequest(requestDataForService); 
      
      const plantTypes = [];
      if (data.isMandioca) plantTypes.push('Mandioca');
      if (data.isMacaxeira) plantTypes.push('Macaxeira');
      const plantTypeDisplay = plantTypes.join(' e ');

      toast({
        title: 'Pedido Enviado!',
        description: `Seu pedido para ${plantTypeDisplay} (Variedade: ${data.cassavaVariety}) foi enviado com sucesso para o Firestore. ID: ${newRequest.id}.`,
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
    switch (locationStatus) {
      case 'fetching':
        return <p className="text-sm flex items-center text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Obtendo sua localização GPS...</p>;
      case 'success':
        return <p className="text-sm text-green-600 flex items-center"><LocateFixed className="h-4 w-4 mr-2" /> Localização GPS obtida: Lat {latitude?.toFixed(4)}, Long {longitude?.toFixed(4)}</p>;
      case 'denied':
        return <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Permissão de GPS negada. A localização não será anexada.</p>;
      case 'unavailable':
      case 'timeout':
      case 'error':
        return <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Falha ao obter GPS. A IA tentará extrair das fotos, se visível.</p>;
      case 'unsupported':
         return <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Geolocalização não suportada pelo seu navegador.</p>;
      default:
        return <p className="text-sm text-muted-foreground">A localização GPS será capturada se disponível. A IA também tentará extrair das fotos.</p>;
    }
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
              <Label htmlFor="photo1">Panorâmica</Label>
              <ImageUploadInput id="photo1" userId={user?.id} onUploadComplete={(url) => setValue('photo1', url, { shouldValidate: true })} />
              {errors.photo1 && <p className="text-sm text-destructive mt-1">{errors.photo1.message}</p>}
            </div>
            <div>
              <Label htmlFor="photo2">Envassoramento</Label>
              <ImageUploadInput id="photo2" userId={user?.id} onUploadComplete={(url) => setValue('photo2', url, { shouldValidate: true })} />
              {errors.photo2 && <p className="text-sm text-destructive mt-1">{errors.photo2.message}</p>}
            </div>
            <div>
              <Label htmlFor="photo3">Corte do Ápice da Planta</Label>
              <ImageUploadInput id="photo3" userId={user?.id} onUploadComplete={(url) => setValue('photo3', url, { shouldValidate: true })} />
              {errors.photo3 && <p className="text-sm text-destructive mt-1">{errors.photo3.message}</p>}
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
