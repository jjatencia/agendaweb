import React, { useMemo, useEffect } from 'react';
import { animated } from '@react-spring/web';
import { Appointment } from '../types';
import { isAppointmentDisabled } from '../utils/helpers';
import { PromocionesService } from '../services/promocionesService';
import {
  ClockIcon,
  CommentIcon,
  DiscountIcon,
  LocationIcon,
  PhoneIcon,
  ProfessionalIcon,
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
  const primaryService = appointment.servicios[0];

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

  const cardSizeStyle = {
    width: 'min(100%, 560px)',
    maxWidth: '560px',
    height: '100%',
    maxHeight: 'min(680px, calc(100vh - 160px))',
    minHeight: 'min(420px, calc(100vh - 160px))'
  } as const;

  const infoTileClass = `${
    isDisabled ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-700'
  } rounded-2xl px-3 py-2.5`;
  const infoInlineRowClass = 'flex flex-wrap items-center gap-x-2 gap-y-1';
  const infoInlineLabelClass = `text-[12px] font-semibold ${
    isDisabled ? 'text-gray-400' : 'text-gray-500'
  }`;
  const infoMutedClass = isDisabled ? 'text-gray-400' : 'text-gray-600';
  const infoValueClass = `text-[13px] font-semibold leading-snug tracking-tight ${
    isDisabled ? 'text-gray-400' : 'text-gray-800'
  }`;
  const formattedDuration = useMemo(() => {
    const raw = (appointment.duracion || primaryService?.duracion || '').toString().trim();

    if (!raw) {
      return null;
    }

    if (/^\d+$/.test(raw)) {
      const minutes = parseInt(raw, 10);
      if (Number.isNaN(minutes)) {
        return raw;
      }
      return `${minutes} min`;
    }

    const isoMatch = raw.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
    if (isoMatch) {
      const [, hoursStr, minutesStr] = isoMatch;
      const hours = hoursStr ? parseInt(hoursStr, 10) : 0;
      const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;
      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours} h`);
      if (minutes > 0) parts.push(`${minutes} min`);
      return parts.length > 0 ? parts.join(' ') : '0 min';
    }

    const timeParts = raw.split(':').map(part => Number(part));
    if (timeParts.length >= 2 && timeParts.every(part => !Number.isNaN(part))) {
      const [hours, minutes] = timeParts;
      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours} h`);
      if (minutes > 0) parts.push(`${minutes} min`);
      return parts.length > 0 ? parts.join(' ') : '0 min';
    }

    return raw;
  }, [appointment.duracion, primaryService?.duracion]);
  const promotionPillClass = isDisabled
    ? 'bg-gray-200 text-gray-500'
    : 'bg-green-50 text-green-700';

  return (
    <animated.div
      style={{
        ...style,
        backgroundColor: isDisabled ? '#f8f9fa' : 'white',
        borderRadius: '24px',
        boxShadow: isDisabled
          ? '0 10px 30px rgba(15, 23, 42, 0.05)'
          : '0 22px 45px rgba(85, 91, 246, 0.15)',
        cursor: isDisabled ? 'default' : 'pointer',
        zIndex: isActive ? 20 : 10,
        ...cardSizeStyle,
        margin: '0 auto',
        position: 'relative',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all 0.3s ease'
      }}
      onClick={isDisabled ? undefined : onClick}
    >
      <div className="p-6 h-full flex flex-col gap-4 overflow-hidden">
        {/* Top section - Header */}
        <div className="flex-shrink-0 space-y-3">
          {appointment.pagada ? (
            <div className="flex justify-center">
              <span className="text-xs bg-green-100 text-green-800 px-4 py-1.5 rounded-full font-semibold tracking-wide">
                PAGADA
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="text-xs bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full font-semibold tracking-wide">
                Saldo: €{(appointment.usuario.saldoMonedero || 0).toFixed(2)}
              </span>
            </div>
          )}

          <div className="text-center space-y-0.5">
            <h2
              className={`text-base font-semibold tracking-tight ${
                isDisabled ? 'text-gray-500' : 'text-gray-900'
              }`}
            >
              {appointment.usuario.nombre} {appointment.usuario.apellidos}
            </h2>
          </div>

          <div className="text-center">
            <div
              className="text-2xl font-black leading-none"
              style={{ color: isDisabled ? '#9ca3af' : 'var(--exora-primary)' }}
            >
              {formattedTime}
            </div>
          </div>
        </div>

        {/* Middle section - Information */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className={`${infoTileClass} flex items-start gap-2.5`}>
            <PhoneIcon size={16} className="mt-0.5" />
            <div className={`${infoInlineRowClass} flex-1`}>
              <span className={infoInlineLabelClass}>Teléfono:</span>
              <a
                href={`tel:${appointment.usuario.telefono}`}
                className={`${infoValueClass} ${
                  isDisabled ? 'pointer-events-none' : 'hover:underline'
                }`}
                style={{ color: isDisabled ? undefined : 'var(--exora-primary)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {appointment.usuario.telefono}
              </a>
            </div>
          </div>

          <div className={`${infoTileClass} flex items-start gap-2.5`}>
            <ServiceIcon size={16} className="mt-0.5" />
            <div className={`${infoInlineRowClass} flex-1`}>
              <span className={infoInlineLabelClass}>Servicio:</span>
              <span className={`${infoValueClass} break-words`}>
                {primaryService?.nombre || 'Servicio no especificado'}
              </span>
            </div>
          </div>

          {appointment.profesional?.nombre && (
            <div className={`${infoTileClass} flex items-start gap-2.5`}>
              <ProfessionalIcon size={16} className="mt-0.5" />
              <div className={`${infoInlineRowClass} flex-1`}>
                <span className={infoInlineLabelClass}>Profesional:</span>
                <span className={infoValueClass}>{appointment.profesional.nombre}</span>
              </div>
            </div>
          )}

          {appointment.variantes && appointment.variantes.length > 0 && (
            <div className={`${infoTileClass} flex items-start gap-2.5`}>
              <VariantIcon size={16} className="mt-0.5" />
              <div className={`${infoInlineRowClass} flex-1`}>
                <span className={infoInlineLabelClass}>Variante:</span>
                <span className={`text-[13px] font-medium leading-snug tracking-tight ${infoMutedClass}`}>
                  {appointment.variantes.map(v => v.nombre).join(', ')}
                </span>
              </div>
            </div>
          )}

          <div className={`${infoTileClass} flex items-start gap-2.5`}>
            <LocationIcon size={16} className="mt-0.5" />
            <div className={infoInlineRowClass}>
              <span className={infoInlineLabelClass}>Sucursal:</span>
              <span className={infoValueClass}>{appointment.sucursal.nombre}</span>
            </div>
          </div>

          {formattedDuration && (
            <div className={`${infoTileClass} flex items-start gap-2.5`}>
              <ClockIcon size={16} className="mt-0.5" />
              <div className={infoInlineRowClass}>
                <span className={infoInlineLabelClass}>Duración:</span>
                <span className={infoValueClass}>{formattedDuration}</span>
              </div>
            </div>
          )}

          <div className={`${infoTileClass} flex items-start gap-2.5`}>
            <DiscountIcon size={16} className="mt-0.5" />
            <div className={`${infoInlineRowClass} flex-1`}>
              <span className={infoInlineLabelClass}>Promociones:</span>
              {appointment.promocion.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {promotionLabels.map(({ key, label }) => (
                    <span
                      key={key}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${promotionPillClass}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <span className={`text-[13px] font-medium ${infoMutedClass}`}>No</span>
              )}
            </div>
          </div>

          {appointment.comentarios && appointment.comentarios.length > 0 && (
            <div className={`${infoTileClass} flex flex-col gap-2`}>
              <div
                className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${
                  isDisabled ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                <CommentIcon size={14} />
                <span>Comentarios</span>
              </div>
              <div className={`text-xs leading-relaxed ${infoMutedClass}`}>
                {appointment.comentarios
                  .map(comentario =>
                    typeof comentario === 'string'
                      ? comentario
                      : (comentario?.texto || comentario?.comentario || JSON.stringify(comentario))
                  )
                  .join(' | ')}
              </div>
            </div>
          )}

          {appointment.usuario.comentarios && appointment.usuario.comentarios.length > 0 && (
            <div className={`${infoTileClass} flex flex-col gap-2`}>
              <div
                className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${
                  isDisabled ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                <CommentIcon size={14} />
                <span>Comentarios del cliente</span>
              </div>
              <div className={`text-xs leading-relaxed ${infoMutedClass}`}>
                {appointment.usuario.comentarios
                  .map(comentario =>
                    typeof comentario === 'string'
                      ? comentario
                      : (comentario?.texto || comentario?.comentario || JSON.stringify(comentario))
                  )
                  .join(' | ')}
              </div>
            </div>
          )}
        </div>

        {/* Bottom section - Date */}
        <div className="flex-shrink-0 pt-2 text-center">
          <div className="text-xs font-medium text-gray-500">
            {formattedDate}
          </div>
        </div>
      </div>
    </animated.div>
  );
};

export default AppointmentCard;
