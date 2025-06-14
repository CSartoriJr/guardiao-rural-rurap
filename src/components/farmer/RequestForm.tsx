
'use client';
import React, { useState } from 'react';
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
import type { AgriRequest } from '@/types';
import { addMockRequest } from '@/lib/mockData';
import { Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';

const requestFormSchema = z.object({
  cassavaVariety: z.string().min(2, { message: 'A variedade deve ter pelo menos 2 caracteres.' }),
  isMandioca: z.boolean().optional(),
  isMacaxeira: z.boolean().optional(),
  photo1: z.string().nullable().refine(val => val !== null, { message: "A foto Panorâmica é obrigatória." }),
  photo2: z.string().nullable().refine(val => val !== null, { message: "A foto de Envassoramento é obrigatória." }),
  photo3: z.string().nullable().refine(val => val !== null, { message: "A foto do Corte do Ápice da Planta é obrigatória." }),
}).refine(data => data.isMandioca || data.isMacaxeira, {
  message: "Selecione pelo menos Mandioca ou Macaxeira.",
  path: ["isMandioca"], // You can attach this error to one of the checkboxes or a general form error
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function RequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      cassavaVariety: '',
      isMandioca: false,
      isMacaxeira: false,
      photo1: null,
      photo2: null,
      photo3: null,
    },
  });

  const onSubmit: SubmitHandler<RequestFormValues> = async (data) => {
    if (!user) {
      toast({ title: "Erro", description: "Você deve estar logado para enviar um pedido.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const requestData: Omit<AgriRequest, 'id' | 'submissionDate' | 'status'> = {
        farmerId: user.id,
        farmerName: user.name,
        cassavaType: data.cassavaVariety, // Renamed from cassavaType to cassavaVariety in form
        isMandioca: data.isMandioca,
        isMacaxeira: data.isMacaxeira,
        photoDataUris: [data.photo1!, data.photo2!, data.photo3!],
        // Municipality could be added here if collected. For now, it's not in the form.
      };
      const newRequest = await addMockRequest(requestData as AgriRequest); // Cast as AgriRequest
      
      const plantTypes = [];
      if (data.isMandioca) plantTypes.push('Mandioca');
      if (data.isMacaxeira) plantTypes.push('Macaxeira');
      const plantTypeDisplay = plantTypes.join(' e ');

      toast({
        title: 'Pedido Enviado!',
        description: `Seu pedido para ${plantTypeDisplay} (Variedade: ${data.cassavaVariety}) foi enviado. ID: ${newRequest.id}`,
      });
      router.push(APP_ROUTES.FARMER_DASHBOARD);
    } catch (error) {
      console.error("Falha ao enviar pedido:", error);
      toast({ title: "Falha no Envio", description: "Não foi possível enviar seu pedido. Por favor, tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Enviar Novo Pedido</CardTitle>
        <CardDescription>Forneça detalhes sobre sua planta e envie três fotos nítidas.</CardDescription>
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
                      onCheckedChange={field.onChange}
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
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="isMacaxeira" className="font-normal">Macaxeira</Label>
                  </div>
                )}
              />
            </div>
            {errors.isMandioca && <p className="text-sm text-destructive">{errors.isMandioca.message}</p>}
             {/* Display general form error for refine if not attached to a specific field */}
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
              <ImageUploadInput id="photo1" onImageUpload={(uri) => setValue('photo1', uri, { shouldValidate: true })} />
              {errors.photo1 && <p className="text-sm text-destructive mt-1">{errors.photo1.message}</p>}
            </div>
            <div>
              <Label htmlFor="photo2">Envassoramento</Label>
              <ImageUploadInput id="photo2" onImageUpload={(uri) => setValue('photo2', uri, { shouldValidate: true })} />
              {errors.photo2 && <p className="text-sm text-destructive mt-1">{errors.photo2.message}</p>}
            </div>
            <div>
              <Label htmlFor="photo3">Corte do Ápice da Planta</Label>
              <ImageUploadInput id="photo3" onImageUpload={(uri) => setValue('photo3', uri, { shouldValidate: true })} />
              {errors.photo3 && <p className="text-sm text-destructive mt-1">{errors.photo3.message}</p>}
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
