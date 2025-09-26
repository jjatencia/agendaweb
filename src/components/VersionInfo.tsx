import React, { useState } from 'react';

const VersionInfo: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);

  // Obtener versión del package.json en build time
  const version = __APP_VERSION__;

  // Obtener fecha de build (se puede configurar en vite.config.ts)
  const buildDate = __BUILD_DATE__;

  // Formato de fecha legible
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full shadow-sm transition-colors"
      >
        v{version}
      </button>

      {showDetails && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border p-3 min-w-48">
          <div className="text-sm">
            <div className="font-semibold text-gray-900 mb-2">Información de Versión</div>

            <div className="space-y-1 text-xs text-gray-600">
              <div>
                <span className="font-medium">Versión:</span> {version}
              </div>
              <div>
                <span className="font-medium">Build:</span> {formatDate(buildDate)}
              </div>
              <div>
                <span className="font-medium">Entorno:</span> {import.meta.env.MODE}
              </div>
              {navigator.userAgent.includes('PWA') && (
                <div>
                  <span className="font-medium">Tipo:</span> PWA
                </div>
              )}
            </div>

            <div className="mt-2 pt-2 border-t">
              <button
                onClick={() => {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                      registrations.forEach((registration) => {
                        registration.update();
                      });
                    });
                  }
                  setShowDetails(false);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                🔄 Buscar actualizaciones
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionInfo;