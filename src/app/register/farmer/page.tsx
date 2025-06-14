
import { CacaBruxaLogo } from '@/components/shared/Logo';
import FarmerRegistrationForm from '@/components/auth/FarmerRegistrationForm';
import Link from 'next/link';
import { APP_ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function FarmerRegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
      <div className="mb-8">
        <CacaBruxaLogo />
      </div>
      <FarmerRegistrationForm />
      <div className="mt-6 text-center w-full max-w-md">
        <Link href={APP_ROUTES.LOGIN} passHref>
          <Button variant="link" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o Login
          </Button>
        </Link>
      </div>
    </div>
  );
}
