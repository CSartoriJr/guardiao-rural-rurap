'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/config/routes';
import { AgriAssistLogo } from '@/components/shared/Logo';
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
      <AgriAssistLogo />
      <Loader2 className="animate-spin h-8 w-8 text-primary mt-6" />
      <p className="text-muted-foreground mt-2">Loading AgriAssist...</p>
    </div>
  );
}
