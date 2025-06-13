import LoginForm from '@/components/auth/LoginForm';
import { AgriAssistLogo } from '@/components/shared/Logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
      <div className="mb-8">
        <AgriAssistLogo />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Bem-vindo(a) de volta!</CardTitle>
          <CardDescription>Por favor, faça login para continuar no AgriAssist.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        Ajudando agricultores a cultivar melhor, juntos.
      </p>
    </div>
  );
}
