"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function ServiceWorkerRegistrar() {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      console.log('[SW Registrar] Checking for existing service workers...');
      
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          if (registrations.length > 0) {
            console.log(`[SW Registrar] Found ${registrations.length} service worker(s). Proceeding with unregistration.`);
            toast({
              title: "Atualizando Aplicativo",
              description: "Removendo versões antigas em cache. A página será recarregada.",
            });

            let unregisterPromises = registrations.map((registration) => {
              return registration.unregister().then((unregistered) => {
                if (unregistered) {
                  console.log(`[SW Registrar] Service Worker unregistered successfully:`, registration.scope);
                } else {
                  console.error(`[SW Registrar] Failed to unregister Service Worker:`, registration.scope);
                }
                return unregistered;
              });
            });

            return Promise.all(unregisterPromises);
          } else {
            console.log('[SW Registrar] No active service workers found. No action needed.');
            return [];
          }
        })
        .then((unregisteredResults) => {
          if (unregisteredResults.length > 0 && unregisteredResults.some(res => res)) {
            // Also clear all caches associated with the origin
            return caches.keys().then((keys) => {
              console.log('[SW Registrar] Found cache keys:', keys);
              return Promise.all(keys.map(key => {
                console.log(`[SW Registrar] Deleting cache: ${key}`);
                return caches.delete(key);
              }));
            });
          }
        })
        .then((cacheDeletionResults) => {
            if (cacheDeletionResults && cacheDeletionResults.length > 0) {
                 console.log('[SW Registrar] Caches cleared. Reloading page to apply changes.');
                 window.location.reload();
            }
        })
        .catch((error) => {
          console.error('[SW Registrar] Error during service worker cleanup:', error);
           toast({
              title: "Falha na Atualização",
              description: "Não foi possível remover arquivos antigos. Tente limpar o cache do navegador manualmente.",
              variant: "destructive"
            });
        });
    }
  }, [toast]);

  return null; // This component does not render anything
}

export default ServiceWorkerRegistrar;
