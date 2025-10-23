'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { submitFeedback, type SubmitFeedbackInput } from '@/ai/flows/submit-feedback';
import { CacaBruxaLogo } from '@/components/shared/Logo';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const feedbackFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  comment: z.string().min(5, { message: 'O comentário deve ter pelo menos 5 caracteres.' }),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface Feedback {
  id: string;
  name: string;
  comment: string;
  createdAt: Date;
}

export default function FeedbackPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(true);
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      name: '',
      email: '',
      comment: '',
    },
  });

  useEffect(() => {
    const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const feedbacksData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          comment: data.comment,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        };
      });
      setFeedbacks(feedbacksData);
      setIsLoadingFeedbacks(false);
    }, (error) => {
      console.error("Erro ao buscar feedbacks:", error);
      toast({
        title: "Erro ao carregar comentários",
        description: "Não foi possível buscar os comentários anteriores.",
        variant: "destructive",
      });
      setIsLoadingFeedbacks(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const onSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await submitFeedback(data);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        reset();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Erro no Envio',
        description: error.message || 'Ocorreu um problema ao enviar seu comentário.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-8">
      <header className="w-full max-w-3xl mb-8 text-center">
        <CacaBruxaLogo className="mx-auto mb-4" />
        <h1 className="text-3xl font-headline text-primary">Feedback sobre o Guardião Rural</h1>
        <p className="text-muted-foreground mt-2">
          Sua opinião é muito importante para nós! Deixe seu comentário, crítica ou sugestão para melhorarmos o aplicativo.
        </p>
      </header>

      <main className="w-full max-w-3xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-lg lg:sticky lg:top-8 h-fit">
          <CardHeader>
            <CardTitle>Deixe seu Comentário</CardTitle>
            <CardDescription>O e-mail não será exibido publicamente.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Nome (Opcional)</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" placeholder="Seu nome" {...field} />}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">E-mail</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => <Input id="email" type="email" placeholder="seu-email@exemplo.com" {...field} />}
                />
                {errors.email && <p className="text-xs text-destructive pt-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="comment">Comentário</Label>
                <Controller
                  name="comment"
                  control={control}
                  render={({ field }) => <Textarea id="comment" placeholder="Digite sua mensagem aqui..." {...field} rows={5} />}
                />
                {errors.comment && <p className="text-xs text-destructive pt-1">{errors.comment.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar Comentário
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-headline text-primary">Comentários da Comunidade</h2>
          {isLoadingFeedbacks ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : feedbacks.length > 0 ? (
            feedbacks.map((feedback, index) => (
              <React.Fragment key={feedback.id}>
                <Card className="bg-card/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{feedback.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(feedback.createdAt, { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{feedback.comment}</p>
                  </CardContent>
                </Card>
                {index < feedbacks.length - 1 && <Separator />}
              </React.Fragment>
            ))
          ) : (
            <Card className="flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum comentário ainda. Seja o primeiro a compartilhar sua opinião!</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
