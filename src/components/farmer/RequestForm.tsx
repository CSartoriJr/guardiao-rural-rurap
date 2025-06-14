
'use client';
import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea'; No longer used
import ImageUploadInput from '@/components/shared/ImageUploadInput';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { AgriRequest } from '@/types'; 
import { addMockRequest } from '@/lib/mockData'; // Import addMockRequest
import { Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';


// This function now uses addMockRequest from mockData.ts
const saveRequest = async (requestData: Omit<AgriRequest, 'id' | 'submissionDate' | 'status' | 'farmerName'>): Promise<AgriRequest> => {
  console.log("Salvando pedido:", requestData);
  await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay
  
  const newRequest: AgriRequest = {
    ...requestData,
    id: `req${Date.now()}`,
    submissionDate: new Date().toISOString(),
    status: 'Pending',
    farmerName: requestData.farmerId, // This might need adjustment if user.name is preferred
                                    // For now, assumes farmerId is sufficient or user.name is fetched/passed differently
  };
  // mockRequests.push(newRequest); // Old way
  return addMockRequest(newRequest); // Use new function to add and persist
};


const requestFormSchema = z.object({
  cassavaType: z.string().min(3, { message: 'O tipo de mandioca deve ter pelo menos 3 caracteres.' }),
  photo1: z.string().nullable().refine(val => val !== null, { message: "A foto 1 é obrigatória." }),
  photo2: z.string().nullable().refine(val => val !== null, { message: "A foto 2 é obrigatória." }),
  photo3: z.string().nullable().refine(val => val !== null, { message: "A foto 3 é obrigatória." }),
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
      cassavaType: '',
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
      const requestData = {
        farmerId: user.id, 
        farmerName: user.name, // Add farmer's name
        cassavaType: data.cassavaType,
        photoDataUris: [data.photo1!, data.photo2!, data.photo3!] as [string, string, string], 
        // Municipality could be added here if collected. For now, it's not in the form.
      };
      const newRequest = await saveRequest(requestData as any); // Cast if farmerName makes it not strictly Omit<>
      toast({
        title: 'Pedido Enviado!',
        description: `Seu pedido para ${data.cassavaType} foi enviado. ID: ${newRequest.id}`,
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
        <CardDescription>Forneça detalhes sobre sua planta de mandioca e envie três fotos nítidas.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cassavaType">Tipo de Mandioca</Label>
            <Controller
              name="cassavaType"
              control={control}
              render={({ field }) => <Input id="cassavaType" placeholder="ex: TMS 30572, TME 419" {...field} />}
            />
            {errors.cassavaType && <p className="text-sm text-destructive">{errors.cassavaType.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="photo1">Foto 1</Label>
              <ImageUploadInput id="photo1" onImageUpload={(uri) => setValue('photo1', uri, { shouldValidate: true })} />
              {errors.photo1 && <p className="text-sm text-destructive mt-1">{errors.photo1.message}</p>}
            </div>
            <div>
              <Label htmlFor="photo2">Foto 2</Label>
              <ImageUploadInput id="photo2" onImageUpload={(uri) => setValue('photo2', uri, { shouldValidate: true })} />
              {errors.photo2 && <p className="text-sm text-destructive mt-1">{errors.photo2.message}</p>}
            </div>
            <div>
              <Label htmlFor="photo3">Foto 3</Label>
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
