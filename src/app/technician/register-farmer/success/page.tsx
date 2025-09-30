'use client';
import React from 'react';
import PageWrapper from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_ROUTES } from '@/config/routes';
import { CheckCircle2, LayoutDashboard, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegistrationSuccessPage() {
  return (
    <PageWrapper allowedRoles={['technician']}>
      <div className="flex justify-center items-center h-full">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="items-center text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-2xl font-headline">Agricultor Cadastrado!</CardTitle>
            <CardDescription>
              O agricultor foi criado com sucesso. O que você gostaria de fazer agora?
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <Button asChild size="lg">
              <Link href={APP_ROUTES.TECHNICIAN_SUBMIT_REQUEST}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Criar Nova Solicitação
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={APP_ROUTES.TECHNICIAN_DASHBOARD}>
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Voltar para o Painel
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
