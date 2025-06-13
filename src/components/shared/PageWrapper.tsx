'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import AppHeader from './AppHeader';
import { APP_ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';

interface PageWrapperProps {
  children: React.ReactNode;
  allowedRoles: Array<'farmer' | 'technician'>;
}

export default function PageWrapper({ children, allowedRoles }: PageWrapperProps) {
  const { user, loading, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initializing && !loading) {
      if (!user) {
        router.replace(APP_ROUTES.LOGIN);
      } else if (!allowedRoles.includes(user.role)) {
        if (user.role === 'farmer') router.replace(APP_ROUTES.FARMER_DASHBOARD);
        else if (user.role === 'technician') router.replace(APP_ROUTES.TECHNICIAN_DASHBOARD);
        else router.replace(APP_ROUTES.LOGIN);
      }
    }
  }, [user, loading, initializing, router, allowedRoles]);

  if (loading || initializing || !user || (user && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Skeleton className="h-16 w-full" /> {/* Header placeholder */}
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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8 transition-opacity duration-300 ease-in-out opacity-100 animate-fadeIn">
        {children}
      </main>
    </div>
  );
}

// Add a simple fadeIn animation to globals.css if needed or use tailwind's animate features
// For example, in globals.css:
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// .animate-fadeIn { animation: fadeIn 0.5s ease-in-out; }
// Or use tailwind.config.js keyframes and animation properties.
// For simplicity, direct style for transition is used here.
