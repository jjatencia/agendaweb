import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const useUpdateAvailable = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      console.log('🔄 Nueva versión disponible');
      setUpdateAvailable(true);
    },
    onOfflineReady() {
      console.log('📱 App lista para uso offline');
    },
    onRegisterError(error) {
      console.error('❌ Error registrando Service Worker:', error);
    },
  });

  const updateApp = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
      // La app se recargará automáticamente
    } catch (error) {
      console.error('Error actualizando la app:', error);
      setIsUpdating(false);
    }
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
    setNeedRefresh(false);
  };

  // Auto-check for updates every 30 minutes when app is active
  useEffect(() => {
    const checkForUpdates = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.update();
          });
        });
      }
    };

    // Check immediately
    checkForUpdates();

    // Set up periodic checks
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000); // 30 minutes

    // Check when app becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    updateAvailable,
    isUpdating,
    updateApp,
    dismissUpdate,
  };
};