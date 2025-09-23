import React, { useMemo, useEffect } from 'react';
import { animated } from '@react-spring/web';
import { Appointment } from '../types';
import { isAppointmentDisabled } from '../utils/helpers';
import { PromocionesService } from '../services/promocionesService';
import {
  CommentIcon,
  DiscountIcon,
  LocationIcon,
  PhoneIcon,
  ServiceIcon,
  VariantIcon
} from './icons';

interface AppointmentCardProps {
  appointment: Appointment;
  style?: any;
  isActive?: boolean;
  onClick?: () => void;
  onActivatePayment?: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  style,
  isActive = false,
  onClick
}) => {
  const isDisabled = isAppointmentDisabled(appointment);

  // Debug saldo en móvil
  React.useEffect(() => {
    if (typeof window !== 'undefined' && /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
      console.log('Mobile detected - Appointment user data:', {
        nombre: appointment.usuario.nombre,
        saldoMonedero: appointment.usuario.saldoMonedero,
        pagada: appointment.pagada
      });
    }
  }, [appointment]);

  // Probar API de promociones (solo en desarrollo y si hay promociones)
  useEffect(() => {
    if ((import.meta as any).env?.DEV && appointment.promocion && appointment.promocion.length > 0) {
      const testPromocionAPIs = async () => {
        console.log('=== PROBANDO APIS DE PROMOCIONES ===');
        console.log('IDs de promoción:', appointment.promocion);

        // Solo probamos el endpoint que funciona
        console.log('\n--- Probando promociones por empresa ---');
        const promocionesEmpresa = await PromocionesService.getPromocionesEmpresa(appointment.empresa);
        if (promocionesEmpresa.length > 0) {
          console.log('✅ Promociones por empresa:', promocionesEmpresa);
        }
      };

      testPromocionAPIs();
    }
  }, [appointment.promocion, appointment.empresa]);
  const appointmentDate = useMemo(() => new Date(appointment.fecha), [appointment.fecha]);
  const formattedTime = useMemo(
    () =>
      appointmentDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    [appointmentDate]
  );
  const formattedDate = useMemo(
    () =>
      appointmentDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
    [appointmentDate]
  );

  const promotionLabels = useMemo(() => {
    if (!appointment.promocion || appointment.promocion.length === 0) {
      return [] as Array<{ key: string; label: string }>;
    }

    return appointment.promocion.map((promocionId: string, index: number) => {
      let label = 'Promoción especial';

      if (promocionId === '66945b4a5706bb70baa15bc0') {
        label = 'Aleatorio o barbero Junior';
      } else if (promocionId === '66aff43347f5e3f837f20ad7') {
        label = 'Mañanas';
      }

      return {
        key: promocionId || `promo-${index}`,
        label
      };
    });
  }, [appointment.promocion]);

  return (
    <animated.div
      style={{
        ...style,
        backgroundColor: isDisabled ? '#f8f9fa' : 'white',
        borderRadius: '20px',
        boxShadow: isDisabled ? '0 2px 8px rgba(0, 0, 0, 0.04)' : '0 4px 15px rgba(0, 0, 0, 0.08)',
        cursor: isDisabled ? 'default' : 'pointer',
        zIndex: isActive ? 20 : 10,
        width: '100%',
        maxWidth: '460px',
        height: '100%', // Ocupa todo el alto disponible del contenedor
        maxHeight: '560px', // Permite una tarjeta más alta sin tapar la navegación inferior
        minHeight: '360px', // Garantiza presencia visual en pantallas más pequeñas
        margin: '0 auto',
        position: 'relative',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all 0.3s ease'
      }}
      onClick={isDisabled ? undefined : onClick}
    >
      <div className="p-6 h-full flex flex-col overflow-hidden">
        {/* Top section - Header */}
        <div className="flex-shrink-0">
          {/* Badge de estado pagada o saldo disponible */}
          {appointment.pagada ? (
            <div className="flex justify-center items-center mb-3">
              <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                PAGADA
              </span>
            </div>
          ) : (
            <div className="flex justify-center items-center mb-3">
              <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                Saldo: €{(appointment.usuario.saldoMonedero || 0).toFixed(2)}
              </span>
            </div>
          )}

          {/* Cliente Name */}
          <div className="text-center mb-3">
            <h2 className={`text-3xl font-bold leading-tight ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
              {appointment.usuario.nombre} {appointment.usuario.apellidos}
            </h2>
          </div>

          {/* Hora */}
          <div className="text-center mb-5">
            <div
              className="text-5xl font-bold leading-none"
              style={{ color: isDisabled ? '#9ca3af' : 'var(--exora-primary)' }}
            >
              {formattedTime}
            </div>
          </div>
        </div>

        {/* Middle section - Information */}
        <div className="flex-1 space-y-4 min-h-0">
          <div className={`flex items-center space-x-3 ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
            <PhoneIcon size={16} />
            <a
              href={`tel:${appointment.usuario.telefono}`}
              className={`text-base hover:underline ${isDisabled ? 'text-gray-400 pointer-events-none' : 'text-blue-600 hover:text-blue-800'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {appointment.usuario.telefono}
            </a>
          </div>

          <div className={`flex items-start space-x-3 ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
            <ServiceIcon size={16} />
            <div className="flex-1">
              <div className="text-base font-medium">
                {appointment.servicios[0]?.nombre || 'Servicio no especificado'}
              </div>
            </div>
          </div>

          {appointment.variantes && appointment.variantes.length > 0 && (
            <div className={`flex items-start space-x-3 ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
              <VariantIcon size={16} />
              <div className="flex-1">
                <div className="text-base font-medium">Variante:</div>
                <div className={`text-sm mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                  {appointment.variantes.map(v => v.nombre).join(', ')}
                </div>
              </div>
            </div>
          )}

          <div className={`flex items-center space-x-3 ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
            <LocationIcon size={16} />
            <span className="text-base">{appointment.sucursal.nombre}</span>
          </div>


          {/* Promociones */}
          <div className={`flex items-start space-x-3 ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
            <DiscountIcon size={16} />
            <div className="flex-1">
              <div className="text-base font-medium">Promociones:</div>
              {appointment.promocion.length > 0 ? (
                <div className={`text-sm mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                  {promotionLabels.map(({ key, label }) => (
                    <span
                      key={key}
                      className="bg-green-50 text-green-700 px-2 py-1 rounded-md inline-block mr-1 mb-1"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 mt-1">No</div>
              )}
            </div>
          </div>

          {appointment.comentarios && appointment.comentarios.length > 0 && (
            <div className="flex items-start space-x-3 text-gray-700 pt-3 border-t border-gray-200 mt-4">
              <div className="flex-shrink-0">
                <CommentIcon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 mb-2">Comentarios:</div>
                <div className="text-sm text-gray-600 leading-relaxed break-words">
                  {appointment.comentarios.map(comentario =>
                    typeof comentario === 'string' ? comentario :
                    (comentario?.texto || comentario?.comentario || JSON.stringify(comentario))
                  ).join(' | ')}
                </div>
              </div>
            </div>
          )}

          {appointment.usuario.comentarios && appointment.usuario.comentarios.length > 0 && (
            <div className="flex items-start space-x-3 text-gray-700 pt-3 border-t border-gray-200 mt-4">
              <div className="flex-shrink-0">
                <CommentIcon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 mb-2">Comentarios del cliente:</div>
                <div className="text-sm text-gray-600 leading-relaxed break-words">
                  {appointment.usuario.comentarios.map(comentario =>
                    typeof comentario === 'string' ? comentario :
                    (comentario?.texto || comentario?.comentario || JSON.stringify(comentario))
                  ).join(' | ')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom section - Date */}
        <div className="flex-shrink-0 pt-3 border-t border-gray-100 text-center">
          <div className="text-sm text-gray-500">
            {formattedDate}
          </div>
        </div>
      </div>
    </animated.div>
  );
};

export default AppointmentCard;
