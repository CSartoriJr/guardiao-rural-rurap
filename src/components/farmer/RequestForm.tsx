'use client';
import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ImageUploadInput from '@/components/shared/ImageUploadInput';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { AgriRequest, DeviceLocationStatus, SoilTexture, VegetationType } from '@/types';
import { addRequest as addRequestToFirestore, updateRequest } from '@/services/requestService'; // Use Firestore service
import { Loader2, Send, LandPlot, AlertTriangle, MapPin, LocateFixed, WifiOff, RefreshCw, XCircle, CalendarIcon, WholeWord, Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';
import { Separator } from '../ui/separator';
import { generateRecommendation } from '@/ai/flows/generate-recommendation-from-image';
import { parse, isValid, isFuture, format, parseISO } from 'date-fns';

const dateSchema = z.string().refine((val) => {
  const parsedDate = parse(val, 'dd/MM/yyyy', new Date());
  return isValid(parsedDate) && !isFuture(parsedDate);
}, { message: "Data inválida ou no futuro. Use dd/mm/aaaa." });

const requestFormSchema = z.object({
  mandiocaVariety: z.string().optional(),
  macaxeiraVariety: z.string().optional(),
  isMandioca: z.boolean().optional(),
  isMacaxeira: z.boolean().optional(),
  photoUrl1: z.string().url({ message: "A URL da foto Panorâmica é inválida."}).nullable(),
  photoUrl2: z.string().url({ message: "A URL da foto de Envassoramento é inválida."}).nullable(),
  photoUrl3: z.string().url({ message: "A URL da foto do Corte do Ápice é inválida."}).nullable(),
  mandiocaPlantedArea: z.coerce.number().min(0, {message: "A área plantada deve ser um número positivo."}).optional().or(z.literal('')),
  mandiocaInfectedArea: z.coerce.number().min(0, {message: "A área infectada deve ser um número positivo."}).optional().or(z.literal('')),
  macaxeiraPlantedArea: z.coerce.number().min(0, {message: "A área plantada deve ser um número positivo."}).optional().or(z.literal('')),
  macaxeiraInfectedArea: z.coerce.number().min(0, {message: "A área infectada deve ser um número positivo."}).optional().or(z.literal('')),
  mandiocaPlantingDate: z.string().optional(),
  mandiocaSymptomsDate: z.string().optional(),
  macaxeiraPlantingDate: z.string().optional(),
  macaxeiraSymptomsDate: z.string().optional(),
  soilTexture: z.enum(["Arenoso", "Argiloso", "Textura Média"], { required_error: "A textura do solo é obrigatória." }),
  vegetationType: z.enum(["Mata (Floresta)", "Cerrado"], { required_error: "O tipo de vegetação é obrigatório."}),
})
.refine(data => data.isMandioca || data.isMacaxeira, {
  message: "Selecione pelo menos Mandioca ou Macaxeira.",
  path: ["isMandioca"], 
})
.refine(data => data.photoUrl1 && data.photoUrl2 && data.photoUrl3, {
    message: "Todas as três fotos são obrigatórias.",
    path: ["photoUrl1"],
})
.superRefine((data, ctx) => {
    if (data.isMandioca) {
        if (!data.mandiocaVariety || data.mandiocaVariety.trim().length < 2) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A variedade da Mandioca deve ter pelo menos 2 caracteres.", path: ['mandiocaVariety'] });
        }
        if (!data.mandiocaPlantingDate) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A data de início do plantio é obrigatória.", path: ['mandiocaPlantingDate'] });
        } else {
            const parsedPlantingDate = parse(data.mandiocaPlantingDate, 'dd/MM/yyyy', new Date());
            if (!isValid(parsedPlantingDate) || isFuture(parsedPlantingDate)) {
                 ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de plantio inválida. Use dd/mm/aaaa.", path: ['mandiocaPlantingDate'] });
            }
        }
        if (data.mandiocaSymptomsDate) {
            const parsedSymptomsDate = parse(data.mandiocaSymptomsDate, 'dd/MM/yyyy', new Date());
             if (!isValid(parsedSymptomsDate) || isFuture(parsedSymptomsDate)) {
                 ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de sintomas inválida. Use dd/mm/aaaa.", path: ['mandiocaSymptomsDate'] });
            }
        }
    }
    if (data.isMacaxeira) {
        if (!data.macaxeiraVariety || data.macaxeiraVariety.trim().length < 2) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A variedade da Macaxeira deve ter pelo menos 2 caracteres.", path: ['macaxeiraVariety'] });
        }
        if (!data.macaxeiraPlantingDate) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A data de início do plantio é obrigatória.", path: ['macaxeiraPlantingDate'] });
        } else {
             const parsedPlantingDate = parse(data.macaxeiraPlantingDate, 'dd/MM/yyyy', new Date());
            if (!isValid(parsedPlantingDate) || isFuture(parsedPlantingDate)) {
                 ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de plantio inválida. Use dd/mm/aaaa.", path: ['macaxeiraPlantingDate'] });
            }
        }
         if (data.macaxeiraSymptomsDate) {
            const parsedSymptomsDate = parse(data.macaxeiraSymptomsDate, 'dd/MM/yyyy', new Date());
             if (!isValid(parsedSymptomsDate) || isFuture(parsedSymptomsDate)) {
                 ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de sintomas inválida. Use dd/mm/aaaa.", path: ['macaxeiraSymptomsDate'] });
            }
        }
    }

    const mpa = typeof data.mandiocaPlantedArea === 'number' ? data.mandiocaPlantedArea : undefined;
    const mia = typeof data.mandiocaInfectedArea === 'number' ? data.mandiocaInfectedArea : undefined;
    if (mpa !== undefined && mia !== undefined && mia > mpa) {
       ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A área infectada não pode ser maior que a área plantada.", path: ['mandiocaInfectedArea'] });
    }

    const xpa = typeof data.macaxeiraPlantedArea === 'number' ? data.macaxeiraPlantedArea : undefined;
    const xia = typeof data.macaxeiraInfectedArea === 'number' ? data.macaxeiraInfectedArea : undefined;
    if (xpa !== undefined && xia !== undefined && xia > xpa) {
       ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A área infectada não pode ser maior que a área plantada.", path: ['macaxeiraInfectedArea'] });
    }
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

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      isMandioca: false,
      isMacaxeira: false,
      photoUrl1: null,
      photoUrl2: null,
      photoUrl3: null,
      mandiocaVariety: '',
      macaxeiraVariety: '',
      mandiocaPlantedArea: '',
      mandiocaInfectedArea: '',
      macaxeiraPlantedArea: '',
      macaxeiraInfectedArea: '',
      mandiocaPlantingDate: '',
      mandiocaSymptomsDate: '',
      macaxeiraPlantingDate: '',
      macaxeiraSymptomsDate: '',
    },
  });

  const photoUrl1 = watch('photoUrl1');
  const photoUrl2 = watch('photoUrl2');
  const photoUrl3 = watch('photoUrl3');
  const isMandiocaChecked = watch('isMandioca');
  const isMacaxeiraChecked = watch('isMacaxeira');

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
          console.warn("Erro ao obter geolocalização:", error.message, "Code:", error.code);
          let message = "Não foi possível obter sua localização GPS.";
          let status: DeviceLocationStatus = 'error';
          if (error.code === error.PERMISSION_DENIED) {
            message = "Permissão de GPS negada. Verifique as configurações do seu navegador/celular. A localização da sua cidade será anexada automaticamente.";
            status = 'denied';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = "Informação de localização indisponível. Tente em um local aberto ou verifique se o GPS do seu celular está ativo.";
            status = 'unavailable';
          } else if (error.code === error.TIMEOUT) {
            message = "Tempo esgotado ao tentar obter GPS. Verifique sua conexão e tente em um local com melhor visibilidade do céu.";
            status = 'timeout';
          }
          setLocationStatus(status);
          toast({ title: "Erro de Localização", description: message, variant: "destructive" });
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 } 
      );
    } else {
      setLocationStatus('unsupported');
      toast({ title: "Geolocalização Não Suportada", description: "Seu navegador não suporta geolocalização. A IA tentará extrair das fotos.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    fetchDeviceLocation();
  }, [fetchDeviceLocation]);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (...event: any[]) => void) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.substring(0, 8);
    let formattedValue = value;
    if (value.length > 4) {
      formattedValue = `${value.substring(0, 2)}/${value.substring(2, 4)}/${value.substring(4)}`;
    } else if (value.length > 2) {
      formattedValue = `${value.substring(0, 2)}/${value.substring(2)}`;
    }
    fieldOnChange(formattedValue);
  };

  const onSubmit: SubmitHandler<RequestFormValues> = async (data) => {
    if (!user || !user.id || !user.name || !user.cpf) {
      toast({ title: "Erro", description: "Você deve estar logado para enviar uma Solicitação.", variant: "destructive" });
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
        farmerCpf: user.cpf,
        farmerName: user.name,
        organizationalUnit: user.organizationalUnit,
        mandiocaVariety: data.mandiocaVariety,
        macaxeiraVariety: data.macaxeiraVariety,
        isMandioca: data.isMandioca,
        isMacaxeira: data.isMacaxeira,
        photoUrls: [data.photoUrl1, data.photoUrl2, data.photoUrl3],
        
        mandiocaPlantedArea: typeof data.mandiocaPlantedArea === 'number' ? data.mandiocaPlantedArea : undefined,
        mandiocaInfectedArea: typeof data.mandiocaInfectedArea === 'number' ? data.mandiocaInfectedArea : undefined,
        macaxeiraPlantedArea: typeof data.macaxeiraPlantedArea === 'number' ? data.macaxeiraPlantedArea : undefined,
        macaxeiraInfectedArea: typeof data.macaxeiraInfectedArea === 'number' ? data.macaxeiraInfectedArea : undefined,
        mandiocaPlantingDate: data.mandiocaPlantingDate ? parse(data.mandiocaPlantingDate, 'dd/MM/yyyy', new Date()).toISOString() : undefined,
        mandiocaSymptomsDate: data.mandiocaSymptomsDate ? parse(data.mandiocaSymptomsDate, 'dd/MM/yyyy', new Date()).toISOString() : undefined,
        macaxeiraPlantingDate: data.macaxeiraPlantingDate ? parse(data.macaxeiraPlantingDate, 'dd/MM/yyyy', new Date()).toISOString() : undefined,
        macaxeiraSymptomsDate: data.macaxeiraSymptomsDate ? parse(data.macaxeiraSymptomsDate, 'dd/MM/yyyy', new Date()).toISOString() : undefined,

        latitude: latitude ?? undefined, 
        longitude: longitude ?? undefined, 
        deviceLocationStatus: locationStatus,
        municipality: user.municipality || undefined,
        soilTexture: data.soilTexture,
        vegetationType: data.vegetationType,
      };
      
      const newRequest = await addRequestToFirestore(requestDataForFirestore); 
      
      const plantTypes = [];
      if (data.isMandioca) plantTypes.push('Mandioca');
      if (data.isMacaxeira) plantTypes.push('Macaxeira');
      const plantTypeDisplay = plantTypes.join(' e ');

      toast({
        title: 'Solicitação Enviada!',
        description: `Sua Solicitação para ${plantTypeDisplay} foi enviado com sucesso. A IA está processando a localização. ID: ${newRequest.id}.`,
      });
      router.push(APP_ROUTES.FARMER_DASHBOARD);
      
      if (newRequest.id) {
          console.log(`[RequestForm] Starting background AI processing for request ${newRequest.id}`);
          const aiInput = {
              mandiocaVariety: newRequest.mandiocaVariety,
              macaxeiraVariety: newRequest.macaxeiraVariety,
              isMandioca: newRequest.isMandioca,
              isMacaxeira: newRequest.isMacaxeira,
              photoDataUri1: newRequest.photoUrls[0],
              photoDataUri2: newRequest.photoUrls[1],
              photoDataUri3: newRequest.photoUrls[2],
              mandiocaPlantedArea: newRequest.mandiocaPlantedArea,
              mandiocaInfectedArea: newRequest.mandiocaInfectedArea,
              macaxeiraPlantedArea: newRequest.macaxeiraPlantedArea,
              macaxeiraInfectedArea: newRequest.macaxeiraInfectedArea,
              deviceLatitude: newRequest.latitude,
              deviceLongitude: newRequest.longitude,
              soilTexture: newRequest.soilTexture,
              vegetationType: newRequest.vegetationType,
          };

          generateRecommendation(aiInput).then(async aiOutput => {
              const updatedFields: Partial<AgriRequest> = {};
              let needsDBUpdate = false;

              if (aiOutput.extractedLatitude !== undefined && aiOutput.extractedLatitude !== newRequest.latitude) {
                  updatedFields.latitude = aiOutput.extractedLatitude;
                  needsDBUpdate = true;
              }
              if (aiOutput.extractedLongitude !== undefined && aiOutput.extractedLongitude !== newRequest.longitude) {
                  updatedFields.longitude = aiOutput.extractedLongitude;
                  needsDBUpdate = true;
              }
              if (aiOutput.determinedMunicipality && aiOutput.determinedMunicipality !== newRequest.municipality) {
                  updatedFields.municipality = aiOutput.determinedMunicipality;
                  needsDBUpdate = true;
              }
              
              if (needsDBUpdate) {
                  await updateRequest(newRequest.id, updatedFields);
                  console.log(`[RequestForm] AI processing complete, request ${newRequest.id} updated with:`, updatedFields);
              } else {
                  console.log(`[RequestForm] AI processing complete for ${newRequest.id}, no updates needed.`);
              }
          }).catch(aiError => {
              console.error(`[RequestForm] Background AI processing failed for request ${newRequest.id}:`, aiError);
          });
      }

    } catch (error: any) {
      console.error("Falha ao enviar Solicitação:", error);
      toast({ title: "Falha no Envio", description: error.message || "Não foi possível enviar sua Solicitação. Por favor, tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const LocationInfo = () => {
    let message: React.ReactNode;
    let showRetryButton = false;

    switch (locationStatus) {
      case 'fetching':
        message = <p className="text-sm flex items-center text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Obtendo sua localização GPS. Isso pode levar alguns segundos...</p>;
        break;
      case 'success':
        message = <p className="text-sm text-green-600 flex items-center"><LocateFixed className="h-4 w-4 mr-2" /> Localização GPS obtida: Lat {latitude?.toFixed(4)}, Long {longitude?.toFixed(4)}</p>;
        break;
      case 'denied':
        message = <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Permissão de GPS negada. Verifique as configurações do seu navegador/celular. A localização da sua cidade será anexada automaticamente.</p>;
        showRetryButton = true;
        break;
      case 'unavailable':
        message = <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Localização indisponível. Tente em um local aberto ou verifique se o GPS do seu celular está ativo.</p>;
        showRetryButton = true;
        break;
      case 'timeout':
        message = <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Tempo esgotado ao tentar obter GPS. Verifique sua conexão e tente em um local com melhor visibilidade do céu.</p>;
        showRetryButton = true;
        break;
      case 'error':
        message = <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Falha ao obter GPS. Verifique as configurações do seu celular e tente novamente.</p>;
        showRetryButton = true;
        break;
      case 'unsupported':
         message = <p className="text-sm text-destructive flex items-center"><WifiOff className="h-4 w-4 mr-2" /> Geolocalização não suportada pelo seu navegador. A IA tentará obter das fotos.</p>;
         break;
      default: // idle
        message = <p className="text-sm text-muted-foreground">Aguardando captura da localização GPS. Se falhar, a IA tentará obter das fotos.</p>;
        showRetryButton = true;
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
            Tentar Capturar GPS Novamente
          </Button>
        )}
      </div>
    );
  };


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Enviar Nova Solicitação</CardTitle>
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
          
          <div className="space-y-4">
            {isMandiocaChecked && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                <h3 className="font-semibold text-lg text-primary">Detalhes da Mandioca</h3>
                <div className="space-y-2">
                  <Label htmlFor="mandiocaVariety">Variedade da Mandioca (ex: BRS Formosa, BRS 399...)</Label>
                  <Controller
                    name="mandiocaVariety"
                    control={control}
                    render={({ field }) => <Input id="mandiocaVariety" placeholder="ex: BRS Formosa" {...field} />}
                  />
                  {errors.mandiocaVariety && <p className="text-sm text-destructive">{errors.mandiocaVariety.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="mandiocaPlantedArea" className="flex items-center"><LandPlot className="h-4 w-4 mr-2" />Área Plantada (ha)</Label>
                    <Controller name="mandiocaPlantedArea" control={control} render={({ field }) => <Input id="mandiocaPlantedArea" type="number" step="any" min="0" placeholder="Ex: 5.5" {...field} />} />
                    {errors.mandiocaPlantedArea && <p className="text-sm text-destructive">{errors.mandiocaPlantedArea.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mandiocaInfectedArea" className="flex items-center"><AlertTriangle className="h-4 w-4 mr-2 text-destructive" />Área Infectada (ha)</Label>
                    <Controller name="mandiocaInfectedArea" control={control} render={({ field }) => <Input id="mandiocaInfectedArea" type="number" step="any" min="0" placeholder="Ex: 1.2" {...field} />} />
                    {errors.mandiocaInfectedArea && <p className="text-sm text-destructive">{errors.mandiocaInfectedArea.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mandiocaPlantingDate">Início do Plantio (Obrigatório)</Label>
                    <Controller name="mandiocaPlantingDate" control={control} render={({ field }) => <Input id="mandiocaPlantingDate" placeholder="dd/mm/aaaa" {...field} onChange={(e) => handleDateInputChange(e, field.onChange)} maxLength={10} />} />
                    {errors.mandiocaPlantingDate && <p className="text-sm text-destructive">{errors.mandiocaPlantingDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mandiocaSymptomsDate">Início dos Sintomas (Opcional)</Label>
                    <Controller name="mandiocaSymptomsDate" control={control} render={({ field }) => <Input id="mandiocaSymptomsDate" placeholder="dd/mm/aaaa" {...field} onChange={(e) => handleDateInputChange(e, field.onChange)} maxLength={10} />} />
                    {errors.mandiocaSymptomsDate && <p className="text-sm text-destructive">{errors.mandiocaSymptomsDate.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {isMacaxeiraChecked && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                <h3 className="font-semibold text-lg text-primary">Detalhes da Macaxeira</h3>
                <div className="space-y-2">
                  <Label htmlFor="macaxeiraVariety">Variedade da Macaxeira (ex: Vassourinha, Pão...)</Label>
                  <Controller name="macaxeiraVariety" control={control} render={({ field }) => <Input id="macaxeiraVariety" placeholder="ex: Vassourinha" {...field} />} />
                  {errors.macaxeiraVariety && <p className="text-sm text-destructive">{errors.macaxeiraVariety.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="macaxeiraPlantedArea" className="flex items-center"><LandPlot className="h-4 w-4 mr-2" />Área Plantada (ha)</Label>
                    <Controller name="macaxeiraPlantedArea" control={control} render={({ field }) => <Input id="macaxeiraPlantedArea" type="number" step="any" min="0" placeholder="Ex: 2.0" {...field} />} />
                    {errors.macaxeiraPlantedArea && <p className="text-sm text-destructive">{errors.macaxeiraPlantedArea.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="macaxeiraInfectedArea" className="flex items-center"><AlertTriangle className="h-4 w-4 mr-2 text-destructive" />Área Infectada (ha)</Label>
                    <Controller name="macaxeiraInfectedArea" control={control} render={({ field }) => <Input id="macaxeiraInfectedArea" type="number" step="any" min="0" placeholder="Ex: 0.5" {...field} />} />
                    {errors.macaxeiraInfectedArea && <p className="text-sm text-destructive">{errors.macaxeiraInfectedArea.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="macaxeiraPlantingDate">Início do Plantio (Obrigatório)</Label>
                    <Controller name="macaxeiraPlantingDate" control={control} render={({ field }) => <Input id="macaxeiraPlantingDate" placeholder="dd/mm/aaaa" {...field} onChange={(e) => handleDateInputChange(e, field.onChange)} maxLength={10} />} />
                    {errors.macaxeiraPlantingDate && <p className="text-sm text-destructive">{errors.macaxeiraPlantingDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="macaxeiraSymptomsDate">Início dos Sintomas (Opcional)</Label>
                    <Controller name="macaxeiraSymptomsDate" control={control} render={({ field }) => <Input id="macaxeiraSymptomsDate" placeholder="dd/mm/aaaa" {...field} onChange={(e) => handleDateInputChange(e, field.onChange)} maxLength={10} />} />
                    {errors.macaxeiraSymptomsDate && <p className="text-sm text-destructive">{errors.macaxeiraSymptomsDate.message}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="photoUrl1">Panorâmica</Label>
              <ImageUploadInput
                id="photoUrl1"
                onUploadComplete={(url) => setValue('photoUrl1', url, { shouldValidate: true })}
                currentImageUrl={photoUrl1}
                uploadPath={user?.id ? `requests/${user.id}` : ''}
              />
            </div>
            <div>
              <Label htmlFor="photoUrl2">Envassoramento</Label>
              <ImageUploadInput
                id="photoUrl2"
                onUploadComplete={(url) => setValue('photoUrl2', url, { shouldValidate: true })}
                currentImageUrl={photoUrl2}
                uploadPath={user?.id ? `requests/${user.id}` : ''}
              />
            </div>
            <div>
              <Label htmlFor="photoUrl3">Corte do Ápice da Planta</Label>
              <ImageUploadInput
                id="photoUrl3"
                onUploadComplete={(url) => setValue('photoUrl3', url, { shouldValidate: true })}
                currentImageUrl={photoUrl3}
                uploadPath={user?.id ? `requests/${user.id}` : ''}
              />
            </div>
          </div>
           {errors.photoUrl1 && <p className="text-sm text-destructive mt-1 text-center">{errors.photoUrl1.message}</p>}
          
          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center"><WholeWord className="h-4 w-4 mr-2 text-primary" />Textura do Solo</Label>
            <Controller
              name="soilTexture"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0"
                >
                  {(["Arenoso", "Argiloso", "Textura Média"] as const).map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={`soil-${value}`} />
                      <Label htmlFor={`soil-${value}`} className="font-normal">{value}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
            {errors.soilTexture && <p className="text-sm text-destructive">{errors.soilTexture.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center"><Leaf className="h-4 w-4 mr-2 text-primary" />Tipo de Vegetação</Label>
            <Controller
              name="vegetationType"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0"
                >
                  {(["Mata (Floresta)", "Cerrado"] as const).map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={`veg-${value}`} />
                      <Label htmlFor={`veg-${value}`} className="font-normal">{value}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
            {errors.vegetationType && <p className="text-sm text-destructive">{errors.vegetationType.message}</p>}
          </div>

          <Separator />

          <div className="space-y-2 pt-2">
            <Label className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />Localização GPS do Dispositivo</Label>
            <div className="text-sm p-3 border border-dashed rounded-md bg-muted/30">
                <LocationInfo />
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex justify-start gap-4">
          <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar Solicitação
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.push(APP_ROUTES.FARMER_DASHBOARD)}
            disabled={isSubmitting}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
