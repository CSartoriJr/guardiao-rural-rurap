
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import React from 'react';
import ServiceWorkerRegistrar from '@/components/shared/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'Guardião Rural',
  description: 'Guardião Rural no combate a crise fitossanitária.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#3a8f6d" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ServiceWorkerRegistrar />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
