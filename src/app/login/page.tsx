'use client'; 

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';
import { APP_ROUTES } from '@/config/routes'; 
import { CacaBruxaLogo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
      
      <Card className="w-full max-w-md shadow-xl mt-8">
        <CardHeader className="text-center items-center">
          <Image
            src="/icon-512x512.png"
            alt="Logo do Guardião Rural"
            width={112}
            height={112}
            className="mb-4"
          />
          <CardDescription>Faça login para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <div className="mt-6 text-center w-full max-w-md">
        <p className="text-sm text-muted-foreground mb-2">Não tem uma conta de agricultor?</p>
        <Button
          className="w-full bg-success text-success-foreground hover:bg-success/90 text-lg font-bold"
          asChild
        >
          <Link href={APP_ROUTES.FARMER_REGISTER}>
            <UserPlus className="mr-2 h-4 w-4" />
            Cadastrar como Agricultor
          </Link>
        </Button>
      </div>
      <div className="my-8">
        <CacaBruxaLogo />
      </div>
       <p className="text-center text-sm text-muted-foreground">
        Desenvolvido por Claudemir Sartori Junior
      </p>
    </div>
  );
}
