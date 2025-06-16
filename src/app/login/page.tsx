
'use client'; 

import Link from 'next/link';
import { CacaBruxaLogo } from '@/components/shared/Logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';
import { APP_ROUTES } from '@/config/routes'; // Import APP_ROUTES
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
      <div className="mb-8">
        <CacaBruxaLogo />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline text-accent">Caça Bruxa</CardTitle>
          <CardDescription>Por favor, faça login para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <div className="mt-6 text-center w-full max-w-md">
        <p className="text-sm text-muted-foreground mb-2">Não tem uma conta de agricultor?</p>
        <Link
          href={APP_ROUTES.FARMER_REGISTER} 
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Cadastrar como Agricultor
        </Link>
      </div>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        Desenvolvido por Claudemir Sartori Junior
      </p>
    </div>
  );
}

