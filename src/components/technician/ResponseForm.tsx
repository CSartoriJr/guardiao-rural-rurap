
'use client';
import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { AgriRequest, RequestStatus } from '@/types'; 
import { generateRecommendation } from '@/ai/flows/generate-recommendation-from-image';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';
import { updateMockRequest } from '@/lib/mockData'; 

const submitTechnicianResponse = async (
  requestId: string,
  technicianId: string,
  technicianName: string,
  recommendation: string,
  status: RequestStatus,
  originalRequest: AgriRequest 
): Promise<AgriRequest | null> => {
  console.log("Atualizando pedido:", { requestId, technicianId, recommendation, status });
  await new Promise(resolve => setTimeout(resolve, 100)); 
  
  const updatedRequest: AgriRequest = {
    ...originalRequest, 
    id: requestId, 
    technicianId,
    technicianName,
    recommendation,
    status,
    responseDate: new Date().toISOString(),
  };
  
  return updateMockRequest(updatedRequest); 
};

const responseFormSchema = z.object({
  recommendation: z.string().min(10, { message: 'A recomendação deve ter pelo menos 10 caracteres.' }),
  status: z.enum(['Positive', 'Negative', 'Inconclusive'], { required_error: "O status é obrigatório." }),
});

type ResponseFormValues = z.infer<typeof responseFormSchema>;

interface ResponseFormProps {
  request: AgriRequest;
}

interface StatusOption {
  value: RequestStatus;
  label: string;
}

const statusOptions: StatusOption[] = [
  { value: 'Positive', label: 'Positivo' },
  { value: 'Negative', label: 'Negativo' },
  { value: 'Inconclusive', label: 'Inconclusivo' },
];


export default function ResponseForm({ request }: ResponseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { toast } = useToast();
  const { user: technicianUser } = useAuth(); 
  const router = useRouter();

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ResponseFormValues>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      recommendation: request.aiSuggestedRecommendation || '',
      status: request.status !== 'Pending' ? request.status : undefined,
    },
  });

  const currentRecommendation = watch('recommendation');

  const handleGetAiSuggestion = async () => {
    setIsAiLoading(true);
    try {
      const aiInput = {
        cassavaType: request.cassavaType,
        isMandioca: request.isMandioca,
        isMacaxeira: request.isMacaxeira,
        photoDataUri1: request.photoDataUris[0],
        photoDataUri2: request.photoDataUris[1],
        photoDataUri3: request.photoDataUris[2],
        plantedArea: request.plantedArea,
        infectedArea: request.infectedArea,
      };
      const result = await generateRecommendation(aiInput);
      setValue('recommendation', result.recommendation, { shouldValidate: true });
      toast({ title: 'Sugestão da IA Gerada!', description: 'A recomendação foi atualizada.' });
    } catch (error) {
      console.error("Erro na sugestão da IA:", error);
      toast({ title: "Erro da IA", description: "Não foi possível gerar a sugestão da IA.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const onSubmit: SubmitHandler<ResponseFormValues> = async (data) => {
    if (!technicianUser) {
      toast({ title: "Erro", description: "Técnico não está logado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await submitTechnicianResponse(request.id, technicianUser.id, technicianUser.name, data.recommendation, data.status, request);
      toast({
        title: 'Resposta Enviada!',
        description: `Sua resposta para o pedido ID ${request.id} foi salva.`,
      });
      router.push(APP_ROUTES.TECHNICIAN_DASHBOARD);
    } catch (error) {
      console.error("Falha ao enviar resposta:", error);
      toast({ title: "Falha no Envio", description: "Não foi possível enviar a resposta. Por favor, tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Envie Sua Recomendação</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div>
            <Button type="button" variant="outline" onClick={handleGetAiSuggestion} disabled={isAiLoading || isSubmitting} className="mb-2 w-full sm:w-auto">
              {isAiLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
              )}
              Obter Sugestão da IA
            </Button>
            <Label htmlFor="recommendation">Texto da Recomendação</Label>
            <Controller
              name="recommendation"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="recommendation"
                  rows={8}
                  placeholder="Forneça recomendações detalhadas com base nas imagens e no tipo de mandioca..."
                  {...field}
                  className="mt-1"
                />
              )}
            />
            {errors.recommendation && <p className="text-sm text-destructive mt-1">{errors.recommendation.message}</p>}
          </div>

          <div>
            <Label>Status do Diagnóstico</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mt-1"
                >
                  {statusOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`status-${option.value.toLowerCase()}`} />
                      <Label htmlFor={`status-${option.value.toLowerCase()}`} className="font-normal">{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
            {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting || isAiLoading}>
             {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar Resposta
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
