
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import React from 'react'; // useEffect foi movido para ServiceWorkerRegistrar
import ServiceWorkerRegistrar from '@/components/shared/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'Caça Bruxa',
  description: 'Um aplicativo misterioso para caçar bruxas.',
  manifest: '/manifest.json', // Adiciona referência ao manifest
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
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet"></link>
        <meta name="theme-color" content="#3a8f6d" /> {/* Cor do tema para a barra de status do navegador */}
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
