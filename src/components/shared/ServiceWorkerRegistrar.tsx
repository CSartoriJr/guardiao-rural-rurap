"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function ServiceWorkerRegistrar() {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      console.log('[SW Registrar] Verificando service workers existentes...');
      
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          if (registrations.length > 0) {
            console.log(`[SW Registrar] Encontrado(s) ${registrations.length} service worker(s). Prosseguindo com a desinstalação.`);
            toast({
              title: "Atualizando Aplicativo",
              description: "Removendo versões antigas em cache. A página será recarregada.",
            });

            let unregisterPromises = registrations.map((registration) => {
              return registration.unregister().then((unregistered) => {
                if (unregistered) {
                  console.log(`[SW Registrar] Service Worker desinstalado com sucesso:`, registration.scope);
                } else {
                  console.error(`[SW Registrar] Falha ao desinstalar o Service Worker:`, registration.scope);
                }
                return unregistered;
              });
            });

            return Promise.all(unregisterPromises);
          } else {
            console.log('[SW Registrar] Nenhum service worker ativo encontrado. Nenhuma ação necessária.');
            return []; // Retorna um array vazio para manter o tipo consistente na cadeia de promessas
          }
        })
        .then((unregisteredResults) => {
          // Verifica se houve alguma desinstalação bem-sucedida antes de limpar o cache.
          if (unregisteredResults.some(res => res)) {
            console.log('[SW Registrar] Limpando todos os caches do navegador...');
            return caches.keys().then((keys) => {
              if (keys.length > 0) {
                console.log('[SW Registrar] Caches encontrados:', keys);
                return Promise.all(keys.map(key => {
                  console.log(`[SW Registrar] Deletando cache: ${key}`);
                  return caches.delete(key);
                }));
              }
              return [];
            });
          }
           return []; // Se nenhum SW foi desregistrado, não limpa o cache.
        })
        .then((cacheDeletionResults) => {
            // Se houve exclusão de cache, cacheDeletionResults será um array de booleans.
            if (cacheDeletionResults && cacheDeletionResults.length > 0) {
                 console.log('[SW Registrar] Caches limpos. Recarregando a página para aplicar as mudanças.');
                 window.location.reload();
            }
        })
        .catch((error) => {
          console.error('[SW Registrar] Erro durante a limpeza do service worker:', error);
           toast({
              title: "Falha na Atualização",
              description: "Não foi possível remover arquivos antigos. Tente limpar o cache do navegador manualmente.",
              variant: "destructive"
            });
        });
    }
  }, [toast]);

  return null; // Este componente não renderiza nada
}

export default ServiceWorkerRegistrar;
