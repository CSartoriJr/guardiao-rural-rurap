'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import React, { useEffect } from 'react';
import AppHeader from './AppHeader';
import { APP_ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/types';


interface PageWrapperProps {
  children: React.ReactNode;
  allowedRoles: Array<User['role']>;
}

export default function PageWrapper({ children, allowedRoles }: PageWrapperProps) {
  const { user, loading, initializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  useEffect(() => {
    console.log('[PageWrapper] Effect triggered. Pathname:', pathname, 'Initializing:', initializing, 'Loading:', loading, 'User:', user ? user.role : 'null');

    if (!initializing && !loading) {
      if (!user) {
        console.log('[PageWrapper] No user, redirecting to LOGIN');
        router.replace(APP_ROUTES.LOGIN);
      } else if (!allowedRoles.includes(user.role)) {
        console.log(`[PageWrapper] User role '${user.role}' not in allowed roles [${allowedRoles.join(', ')}]. Redirecting.`);
        if (user.role === 'farmer') router.replace(APP_ROUTES.FARMER_DASHBOARD);
        else if (user.role === 'tecnico') router.replace(APP_ROUTES.TECNICO_DASHBOARD);
        else if (user.role === 'admin') router.replace(APP_ROUTES.ADMIN_DASHBOARD);
        else router.replace(APP_ROUTES.LOGIN); // Fallback
      } else {
        console.log(`[PageWrapper] User role '${user.role}' is allowed. No redirect.`);
      }
    } else {
      console.log('[PageWrapper] Still initializing or loading auth state.');
    }
  }, [user, loading, initializing, router, allowedRoles, pathname]);

  if (loading || initializing || !user || (user && !allowedRoles.includes(user.role))) {
     console.log('[PageWrapper] Rendering loading/skeleton state. Initializing:', initializing, 'Loading:', loading, 'User:', user ? user.role : 'null', 'Allowed:', allowedRoles);
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="bg-card shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center h-16">
                <Skeleton className="h-8 w-32" />
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                </div>
            </div>
        </div>
        <div className="flex flex-1 items-center justify-center container mx-auto px-4 py-8">
           <div className="space-y-4 w-full max-w-md">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        </div>
      </div>
    );
  }
  
  console.log('[PageWrapper] Rendering children.');
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8 transition-opacity duration-300 ease-in-out opacity-100 animate-fadeIn">
        {children}
      </main>
    </div>
  );
}
