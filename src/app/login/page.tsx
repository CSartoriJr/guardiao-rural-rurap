
import { CacaBruxaLogo } from '@/components/shared/Logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
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
        <Button asChild variant="outline" className="w-full">
          <Link href={APP_ROUTES.FARMER_REGISTER}>
            <UserPlus className="mr-2 h-4 w-4" />
            Cadastrar como Agricultor
          </Link>
        </Button>
      </div>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        Desenvolvido por Claudemir Sartori Junior
      </p>
    </div>
  );
}
