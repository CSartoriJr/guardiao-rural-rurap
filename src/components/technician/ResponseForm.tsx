
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
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';
import { updateRequest as updateRequestInFirestore } from '@/services/requestService'; // Use Firestore service

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
  const { toast } = useToast();
  const { user: tecnicoUser } = useAuth(); 
  const router = useRouter();

  const { control, handleSubmit, formState: { errors } } = useForm<ResponseFormValues>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      recommendation: request.recommendation || '', 
      status: request.status !== 'Pending' ? request.status : undefined,
    },
  });

  const onSubmit: SubmitHandler<ResponseFormValues> = async (data) => {
    if (!tecnicoUser || !tecnicoUser.id || !tecnicoUser.name) {
      toast({ title: "Erro", description: "Técnico não está logado ou nome não definido.", variant: "destructive" });
      return;
    }
    if (!request.id) {
      toast({ title: "Erro", description: "ID do Levantamento não encontrado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const updatesForFirestore: Partial<AgriRequest> = {
        tecnicoId: tecnicoUser.id,
        tecnicoName: tecnicoUser.name,
        recommendation: data.recommendation,
        status: data.status,
        responseDate: new Date().toISOString(), // Will be converted to Timestamp by service
      };

      await updateRequestInFirestore(request.id, updatesForFirestore); 
      
      toast({
        title: 'Resposta Enviada!',
        description: `Sua resposta para o Levantamento ID ${request.id} foi salva no Firestore.`,
      });
      router.push(APP_ROUTES.TECNICO_DASHBOARD);
    } catch (error: any) {
      console.error("Falha ao enviar resposta:", error);
      toast({ title: "Falha no Envio", description: error.message || "Não foi possível enviar a resposta. Por favor, tente novamente.", variant: "destructive" });
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
          <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
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
