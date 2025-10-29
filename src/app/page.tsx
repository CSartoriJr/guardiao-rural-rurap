'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/config/routes';
import { CacaBruxaLogo } from '@/components/shared/Logo';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initializing && !loading) {
      if (user) {
        if (user.role === 'farmer') {
          router.replace(APP_ROUTES.FARMER_DASHBOARD);
        } else if (user.role === 'technician') {
          router.replace(APP_ROUTES.TECHNICIAN_DASHBOARD);
        } else if (user.role === 'admin' || user.role === 'Gestão') {
          router.replace(APP_ROUTES.ADMIN_DASHBOARD);
        } else if (['GabineteGov', 'Diagro', 'SDR'].includes(user.role)) {
          router.replace(APP_ROUTES.TECHNICIAN_ANALYTICS_PANEL); // Redireciona usuários externos para a análise
        } else {
          router.replace(APP_ROUTES.LOGIN); 
        }
      } else {
        router.replace(APP_ROUTES.LOGIN);
      }
    }
  }, [user, loading, initializing, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <CacaBruxaLogo />
      <Loader2 className="animate-spin h-8 w-8 text-primary mt-6" />
      <p className="text-muted-foreground mt-2">Carregando Guardião Rural...</p>
    </div>
  );
}
