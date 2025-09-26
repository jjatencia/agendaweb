/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Global variables injected by Vite
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

declare module 'virtual:pwa-register/react' {
  export interface UpdateSWOptions {
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegisterError?: (error: any) => void;
  }

  export function useRegisterSW(options?: UpdateSWOptions): {
    needRefresh: [boolean, (value: boolean) => void];
    offlineReady: [boolean, (value: boolean) => void];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}
