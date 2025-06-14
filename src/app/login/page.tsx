
import { CacaBruxaLogo } from '@/components/shared/Logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

// Define props interface to accept searchParams
interface LoginPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  // Example of defensive access if this page were to use Object.keys on searchParams.
  // This is based on the error message suggesting direct key access is problematic.
  if (searchParams) {
    try {
      // Convert searchParams to a plain object before using Object.keys()
      // This handles cases where searchParams might not be a simple object.
      // The 'as any' is used because the standard type for searchParams prop is already an object,
      // but URLSearchParams constructor expects string or iterable.
      const plainSearchParams = Object.fromEntries(new URLSearchParams(searchParams as any).entries());
      const keys = Object.keys(plainSearchParams);
      // console.log("Login page searchParams keys (defensively accessed):", keys); 
      // This console.log is for debugging and can be removed.
    } catch (e) {
      // console.error("Error processing searchParams in LoginPage:", e);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
      <div className="mb-8">
        <CacaBruxaLogo />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Bem-vindo(a) de volta!</CardTitle>
          <CardDescription>Por favor, faça login para continuar no Caça Bruxa.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <div className="mt-6 text-center w-full max-w-md">
        <p className="text-sm text-muted-foreground mb-2">Não tem uma conta de agricultor?</p>
        <Link href={APP_ROUTES.FARMER_REGISTER} passHref>
          <Button variant="outline" className="w-full">
            <UserPlus className="mr-2 h-4 w-4" />
            Cadastrar como Agricultor
          </Button>
        </Link>
      </div>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        Descubra os segredos e desvende os mistérios.
      </p>
    </div>
  );
}
