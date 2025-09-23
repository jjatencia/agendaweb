import React, { useMemo } from 'react';
import { animated } from '@react-spring/web';
import { Appointment } from '../types';
import { isAppointmentDisabled } from '../utils/helpers';
import {
  DiscountIcon,
  MailIcon,
  PhoneIcon,
  ProfessionalIcon,
  ServiceIcon,
  VariantIcon
} from './icons';

const normalizeComments = (
  comments?: (string | Record<string, unknown>)[] | string | null
): string[] => {
  if (!comments) {
    return [];
  }

  const commentList = Array.isArray(comments) ? comments : [comments];

  return commentList
    .map(comment => {
      if (!comment) {
        return '';
      }

      if (typeof comment === 'string') {
        return comment.trim();
      }

      if (typeof comment === 'object') {
        const value =
          (comment as Record<string, unknown>).texto ??
          (comment as Record<string, unknown>).comentario ??
          (comment as Record<string, unknown>).mensaje ??
          '';

        if (typeof value === 'string') {
          return value.trim();
        }

        if (value != null) {
          return String(value).trim();
        }
      }

      return '';
    })
    .filter(comment => comment.length > 0);
};

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

  const appointmentDate = useMemo(() => new Date(appointment.fecha), [appointment.fecha]);
  const formattedTime = useMemo(
    () =>
      appointmentDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    [appointmentDate]
  );

  const promotionLabels = useMemo(() => {
    if (!appointment.promocion || appointment.promocion.length === 0) {
      return [];
    }

    return appointment.promocion.map((promo, index) => {
      const key = `promo-${index}`;
      if (typeof promo === 'string') {
        return { key, label: promo };
      }
      if (typeof promo === 'object' && promo !== null) {
        const label = (promo as any).nombre || (promo as any).descripcion || 'Promoción';
        return { key, label };
      }
      return { key, label: 'Promoción' };
    });
  }, [appointment.promocion]);

  const appointmentComments = useMemo(
    () => normalizeComments(appointment.comentarios),
    [appointment.comentarios]
  );

  const clientComments = useMemo(
    () => normalizeComments(appointment.usuario?.comentarios),
    [appointment.usuario?.comentarios]
  );

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
        {/* Top section - Status and Name */}
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
              className={`text-2xl font-bold leading-tight ${
                isDisabled ? 'text-gray-500' : 'text-gray-900'
              }`}
            >
              {appointment.usuario.nombre} {appointment.usuario.apellidos}
            </h2>
          </div>

          <div className="text-center">
            <div
              className="text-4xl font-bold leading-none"
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

          {appointmentComments.length > 0 && (
            <div className={`${infoTileClass} flex items-start gap-2.5`}>
              <MailIcon size={16} className="mt-0.5" />
              <div className="space-y-1 flex-1">
                <span className={`${infoInlineLabelClass} uppercase tracking-wide`}>
                  Comentarios de la cita:
                </span>
                <p className={`text-[12px] leading-relaxed ${infoMutedClass}`}>
                  {appointmentComments.join(' | ')}
                </p>
              </div>
            </div>
          )}

          {clientComments.length > 0 && (
            <div className={`${infoTileClass} flex items-start gap-2.5`}>
              <MailIcon size={16} className="mt-0.5" />
              <div className="space-y-1 flex-1">
                <span className={`${infoInlineLabelClass} uppercase tracking-wide`}>
                  Comentarios del cliente:
                </span>
                <p className={`text-[12px] leading-relaxed ${infoMutedClass}`}>
                  {clientComments.join(' | ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </animated.div>
  );
};

export default AppointmentCard;
