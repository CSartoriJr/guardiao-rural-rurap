
import { CacaBruxaLogo } from '@/components/shared/Logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';

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
       <p className="mt-8 text-center text-sm text-muted-foreground">
        Descubra os segredos e desvende os mistérios.
      </p>
    </div>
  );
}
