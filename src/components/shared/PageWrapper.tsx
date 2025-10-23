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
    // This effect handles redirection logic once authentication state is settled.
    if (!initializing && !loading) {
      if (!user) {
        // If auth is settled and there's no user, redirect to login.
        console.log('[PageWrapper] Auth settled. No user found. Redirecting to LOGIN.');
        router.replace(APP_ROUTES.LOGIN);
      } else if (!allowedRoles.includes(user.role)) {
        // If auth is settled and user role is not allowed, redirect to their default dashboard.
        console.log(`[PageWrapper] User role '${user.role}' not allowed for this page. Redirecting.`);
        if (user.role === 'farmer') router.replace(APP_ROUTES.FARMER_DASHBOARD);
        else if (user.role === 'technician') router.replace(APP_ROUTES.TECHNICIAN_DASHBOARD);
        else if (user.role === 'admin') router.replace(APP_ROUTES.ADMIN_DASHBOARD);
        else router.replace(APP_ROUTES.LOGIN); // Fallback for any other roles
      }
    }
  }, [user, loading, initializing, router, allowedRoles, pathname]);
  
  // This is the crucial part: Render a loading skeleton if auth is still initializing,
  // OR if it has finished initializing but we are still waiting for the user object to be populated.
  // This prevents the redirect logic from firing prematurely.
  if (initializing || loading || !user) {
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
  
  // If we reach here, it means:
  // 1. Auth is not initializing or loading.
  // 2. There IS a user object.
  // 3. The useEffect has confirmed the user's role is allowed for this page.
  // It is now safe to render the children.
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8 transition-opacity duration-300 ease-in-out opacity-100 animate-fadeIn">
        {children}
      </main>
    </div>
  );
}
