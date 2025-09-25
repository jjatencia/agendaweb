import React, { useState, useEffect } from 'react';
import { CitasService } from '../services/citasService';
import { useAuthStore } from '../stores/authStore';
import { Appointment } from '../types';
import { formatDateForAPILocal } from '../utils/helpers';

interface AppointmentRecoveryProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppointmentRecovery: React.FC<AppointmentRecoveryProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [noPresentadoAppointments, setNoPresentadoAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [allSearchData, setAllSearchData] = useState<Appointment[]>([]);
  const { user } = useAuthStore();

  const searchForRecentNoShows = async () => {
    if (!user?.empresa) return;

    setLoading(true);
    setError(null);
    setDebugInfo([]);

    const addDebugInfo = (message: string) => {
      setDebugInfo(prev => [...prev, message]);
    };

    try {
      // Estrategia 1: Verificar localStorage/sessionStorage por datos en caché
      addDebugInfo('🔍 Revisando caché local...');
      const cachedAppointments = localStorage.getItem('exora_recent_appointments');
      let cachedData: Appointment[] = [];
      if (cachedAppointments) {
        try {
          cachedData = JSON.parse(cachedAppointments);
          addDebugInfo(`💾 Encontradas ${cachedData.length} citas en caché`);
        } catch (e) {
          addDebugInfo('⚠️ Error parseando datos en caché');
        }
      } else {
        addDebugInfo('❌ No hay datos en caché');
      }

      // Estrategia 2: Buscar citas de los últimos días
      addDebugInfo('📡 Consultando API de citas recientes...');
      let allRecentAppointments: Appointment[] = [];
      try {
        allRecentAppointments = await CitasService.buscarCitasRecientes(user.empresa, 3);
        addDebugInfo(`📊 API devolvió ${allRecentAppointments.length} citas de los últimos 3 días`);
      } catch (err: any) {
        addDebugInfo(`❌ Error al obtener citas recientes: ${err.message || 'Error desconocido'}`);
      }

      // Estrategia 3: Intentar endpoints de historial/eliminadas
      addDebugInfo('📋 Buscando en logs/historial...');
      let historialData: any[] = [];
      try {
        const today = formatDateForAPILocal(new Date());
        historialData = await CitasService.getHistorialCitas(user.empresa, today);
        addDebugInfo(`📝 Historial devolvió ${historialData.length} entradas`);
      } catch (err: any) {
        addDebugInfo(`❌ Sin historial disponible: ${err.message || 'Endpoints no encontrados'}`);
      }

      // Combinar todas las fuentes de datos
      const allData = [
        ...cachedData,
        ...allRecentAppointments,
        ...historialData
      ];

      addDebugInfo(`🔗 Total de datos combinados: ${allData.length} citas`);

      // Guardar todos los datos para uso posterior
      setAllSearchData(allData);

      // Filtrar y mostrar las más recientes (últimas 2 horas)
      const dosHorasAtras = new Date();
      dosHorasAtras.setHours(dosHorasAtras.getHours() - 2);
      addDebugInfo(`⏰ Buscando citas posteriores a: ${dosHorasAtras.toLocaleString('es-ES')}`);

      const citasRecientes = allData
        .filter(cita => cita && cita.usuario && cita.usuario.nombre)
        .filter(cita => {
          const fechaModificacion = new Date(cita.modificacion || cita.creacion || cita.fecha);
          return fechaModificacion > dosHorasAtras;
        })
        .sort((a, b) => {
          const fechaA = new Date(a.modificacion || a.creacion || a.fecha);
          const fechaB = new Date(b.modificacion || b.creacion || b.fecha);
          return fechaB.getTime() - fechaA.getTime();
        })
        // Eliminar duplicados por ID
        .filter((cita, index, arr) =>
          arr.findIndex(c => c._id === cita._id) === index
        );

      addDebugInfo(`🎯 Filtradas: ${citasRecientes.length} citas de las últimas 2 horas`);
      setNoPresentadoAppointments(citasRecientes);

      if (citasRecientes.length === 0) {
        addDebugInfo('⚠️ No se encontraron citas elegibles para recuperación');
      } else {
        addDebugInfo(`✅ Encontradas ${citasRecientes.length} citas candidatas`);
      }

    } catch (err: any) {
      console.error('Error en búsqueda de recuperación:', err);
      addDebugInfo(`❌ Error general: ${err.message || 'Error desconocido'}`);
      setError('Error al buscar citas recientes. Ver información de búsqueda para detalles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?.empresa) {
      searchForRecentNoShows();
    }
  }, [isOpen, user?.empresa]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-100">
            <div className="text-2xl font-bold text-blue-600">
              ?
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">
            Recuperar Cita Accidental
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Buscando citas recientes que podrían haber sido eliminadas accidentalmente
          </p>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Buscando citas...</p>
            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <div>🔍 Revisando caché local...</div>
              <div>📡 Consultando API de citas recientes...</div>
              <div>📋 Buscando en logs/historial...</div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={searchForRecentNoShows}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && noPresentadoAppointments.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-gray-900">Citas recientes encontradas (últimas 2 horas):</h4>
            <p className="text-xs text-gray-500 mb-3">
              Una de estas podría ser la cita que marcaste accidentalmente como "no presentado"
            </p>
            {noPresentadoAppointments.slice(0, 10).map((appointment) => (
              <div key={appointment._id} className="p-3 border border-gray-200 rounded-lg bg-yellow-50">
                <div className="font-semibold text-gray-900">
                  🔍 {appointment.usuario.nombre} {appointment.usuario.apellidos}
                </div>
                <div className="text-sm text-gray-600">
                  📅 {new Date(appointment.fecha).toLocaleString('es-ES')}
                </div>
                <div className="text-sm text-gray-600">
                  ✂️ {appointment.servicios[0]?.nombre || 'Servicio no especificado'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ⏱️ Última actividad: {new Date(appointment.modificacion || appointment.creacion || appointment.fecha).toLocaleString('es-ES')}
                </div>
                {appointment._cached_at && (
                  <div className="text-xs text-blue-500 mt-1">
                    💾 Guardado en caché: {new Date(appointment._cached_at).toLocaleString('es-ES')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Información de debug */}
        {debugInfo.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Información de búsqueda:</h5>
            <div className="space-y-1">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-xs text-gray-600">
                  {info}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && noPresentadoAppointments.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              ❌ No se encontraron citas de las últimas 2 horas.
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Esto puede significar que:
            </p>
            <ul className="text-xs text-gray-500 text-left space-y-1">
              <li>• La cita fue eliminada permanentemente del sistema</li>
              <li>• Han pasado más de 2 horas desde la eliminación</li>
              <li>• No había datos en caché antes de la eliminación</li>
            </ul>
            <button
              onClick={() => {
                // Extender búsqueda a todo el día de hoy
                const hoyCompleto = allSearchData.filter(cita =>
                  cita && cita.usuario && cita.usuario.nombre &&
                  new Date(cita.fecha).toDateString() === new Date().toDateString()
                );
                setNoPresentadoAppointments(hoyCompleto);
                setDebugInfo(prev => [...prev, `🔍 Ampliando búsqueda: ${hoyCompleto.length} citas de hoy completo`]);
              }}
              className="mt-3 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
            >
              🔍 Mostrar todas las citas de hoy
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-medium transition-all border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
          {noPresentadoAppointments.length > 0 && (
            <button
              onClick={() => {
                // Copy the list to clipboard for easy reference
                const appointmentList = noPresentadoAppointments
                  .slice(0, 5)
                  .map(apt => `${apt.usuario.nombre} ${apt.usuario.apellidos} - ${new Date(apt.fecha).toLocaleString('es-ES')}`)
                  .join('\n');

                navigator.clipboard.writeText(appointmentList).then(() => {
                  alert('Lista copiada al portapapeles');
                });
              }}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all hover:opacity-90 shadow-md bg-blue-600"
            >
              Copiar Lista
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentRecovery;