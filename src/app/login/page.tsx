'use client'; 

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';
import { APP_ROUTES } from '@/config/routes'; 
import { CacaBruxaLogo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { UserPlus, Info } from 'lucide-react';

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6"
      style={{
        backgroundImage: "url('/login-background.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Card className="w-full max-w-md shadow-xl bg-card">
        <CardHeader className="text-center items-center">
          <Image
            src="/icon-512x512.png"
            alt="Logo do Guardião Rural"
            width={179}
            height={179}
            className="mb-4"
          />
          <CardDescription className="text-card-foreground font-semibold">Faça login para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <div className="mt-6 text-center w-full max-w-md space-y-4">
        <div>
          <p className="text-sm text-white mb-2 font-bold">Não tem uma conta de agricultor?</p>
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

        <div className="my-8 bg-black/50 p-2 rounded-md">
          <CacaBruxaLogo />
        </div>

        <div>
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-bold"
            asChild
          >
            <Link href="https://folder-vassoura-de-bruxa-rurap-1.my.canva.site/" target="_blank" rel="noopener noreferrer">
              <Info className="mr-2 h-4 w-4" />
              Saiba Mais Sobre a Vassoura de Bruxa!
            </Link>
          </Button>
        </div>
      </div>
       <p className="mt-8 text-center text-sm text-white font-bold bg-black/50 p-1 rounded">
        Desenvolvido por Claudemir Sartori Junior
      </p>
    </div>
  );
}
