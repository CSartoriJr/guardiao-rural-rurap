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
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function RequestDeletionPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não encontrado.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      // Mark the user's document for deletion
      await updateUserDocument(user.id, { registrationStatus: 'Excluir' });

      // Log the user out
      await logout();

      // Show toast and redirect
      toast({
        title: 'Solicitação Enviada',
        description: 'Sua solicitação de exclusão foi enviada. Sua conta será removida em breve.',
      });
      router.replace(APP_ROUTES.LOGIN);

    } catch (error: any) {
      console.error('Failed to request account deletion:', error);
      toast({
        title: 'Falha na Solicitação',
        description: error.message || 'Não foi possível enviar sua solicitação. Tente novamente.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

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
              Esta ação não pode ser desfeita. Todos os seus dados, incluindo seu histórico de solicitações, serão permanentemente removidos.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="destructive"
              size="lg"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Exclusão
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleCancel}
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
