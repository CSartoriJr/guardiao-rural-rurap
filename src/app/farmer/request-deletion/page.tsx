'use client';
import React, { useState } from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/config/routes';
import { useToast } from '@/hooks/use-toast';
import { updateUserDocument } from '@/services/userService';
import { AlertTriangle, Loader2, Undo2, CheckCircle } from 'lucide-react';

export default function RequestDeletionPage() {
  const { user, logout, initializing } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestDeletion = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateUserDocument(user.id, { registrationStatus: 'Excluir' });
      await logout();
      toast({
        title: 'Solicitação Enviada',
        description: 'Sua solicitação de exclusão foi enviada. Sua conta será removida em breve por um administrador.',
      });
      router.replace(APP_ROUTES.LOGIN);
    } catch (error: any) {
      console.error('Failed to request account deletion:', error);
      toast({
        title: 'Falha na Solicitação',
        description: error.message || 'Não foi possível enviar sua solicitação.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateUserDocument(user.id, { registrationStatus: 'Pendente' });
      toast({
        title: 'Solicitação Cancelada',
        description: 'Sua solicitação de exclusão foi cancelada. Seu status foi revertido para "Pendente".',
        className: 'bg-green-100 text-green-800 border-green-300',
      });
      router.push(APP_ROUTES.FARMER_DASHBOARD);
    } catch (error: any) {
      console.error('Failed to cancel deletion request:', error);
      toast({
        title: 'Falha ao Cancelar',
        description: error.message || 'Não foi possível cancelar a solicitação.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAction = () => {
    router.back();
  };
  
  if (initializing) {
    return <PageWrapper allowedRoles={['farmer']}><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></PageWrapper>;
  }

  // Se o usuário solicitou a exclusão, mostre a tela de cancelamento.
  if (user && user.registrationStatus === 'Excluir') {
    return (
      <PageWrapper allowedRoles={['farmer']}>
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-lg shadow-lg border-yellow-400">
            <CardHeader className="items-center text-center">
              <CheckCircle className="h-16 w-16 text-yellow-500 mb-4" />
              <CardTitle className="text-2xl font-headline">Solicitação de Exclusão Pendente</CardTitle>
              <CardDescription className="text-foreground">
                Sua conta está agendada para ser removida por um administrador.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground space-y-4">
              <p>
                Se você mudou de ideia, pode cancelar a solicitação de exclusão a qualquer momento antes que um administrador a processe.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleCancelDeletion}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Undo2 className="mr-2 h-4 w-4" />}
                Cancelar Solicitação de Exclusão
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleCancelAction}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
            </CardFooter>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  // Caso contrário, mostre a tela original de confirmação para solicitar a exclusão.
  return (
    <PageWrapper allowedRoles={['farmer']}>
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-lg shadow-lg border-destructive">
          <CardHeader className="items-center text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-2xl font-headline">Confirmar Exclusão de Conta</CardTitle>
            <CardDescription className="text-foreground">
              Você tem certeza que deseja solicitar a exclusão da sua conta?
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground space-y-4">
            <p>
              Ao confirmar sua solicitação de exclusão, será enviada uma mensagem para os Administradores e sua conta será excluída por eles.
            </p>
            <p className="font-semibold text-destructive">
              Esta ação não pode ser desfeita após a confirmação do administrador. Todos os seus dados, incluindo seu histórico de solicitações, serão permanentemente removidos.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="destructive"
              size="lg"
              onClick={handleRequestDeletion}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Exclusão
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleCancelAction}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageWrapper>
  );
}
