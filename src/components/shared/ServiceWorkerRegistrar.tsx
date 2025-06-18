
'use client';

import React, { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('[ServiceWorkerRegistrar] ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch((error) => {
            console.log('[ServiceWorkerRegistrar] ServiceWorker registration failed: ', error);
          });
      });
    }
  }, []);

  return null; // Este componente não renderiza nada visualmente
}
