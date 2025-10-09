import React, { useMemo, useState, useEffect } from 'react';
import { animated } from '@react-spring/web';
import { Appointment } from '../types';
import { isAppointmentDisabled } from '../utils/helpers';
import { PromocionesService, Promocion } from '../services/promocionesService';
import ConfirmationModal from './ConfirmationModal';
import WhatsAppModal from './WhatsAppModal';
import {
  DiscountIcon,
  LocationIcon,
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
  onMarkNoShow?: (appointmentId: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  style,
  isActive = false,
  onClick,
  onMarkNoShow
}) => {
  const isDisabled = isAppointmentDisabled(appointment);
  const primaryService = appointment.servicios[0];
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Cargar promociones de la empresa
  useEffect(() => {
    const cargarPromociones = async () => {
      if (appointment.empresa) {
        try {
          const promocionesEmpresa = await PromocionesService.getPromocionesEmpresa(appointment.empresa);
          setPromociones(promocionesEmpresa);
        } catch (error) {
          console.error('Error cargando promociones:', error);
          setPromociones([]);
        }
      }
    };

    cargarPromociones();
  }, [appointment.empresa]);

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

    return appointment.promocion.map((promoId, index) => {
      const key = `promo-${index}`;
      
      // Si promoId es un string (ID), buscar la promoción en el estado
      if (typeof promoId === 'string') {
        const promocion = promociones.find(p => p._id === promoId);
        if (promocion) {
          const label = promocion.titulo || promocion.descripcion || 'Promoción';
          return { key, label };
        }
        // Si no se encuentra la promoción, mostrar el ID como fallback
        return { key, label: promoId };
      }
      
      // Si promoId es un objeto, usar la lógica anterior
      if (typeof promoId === 'object' && promoId !== null) {
        const label = (promoId as any).nombre || (promoId as any).descripcion || (promoId as any).titulo || 'Promoción';
        return { key, label };
      }
      
      return { key, label: 'Promoción' };
    });
  }, [appointment.promocion, promociones]);

  const appointmentComments = useMemo(
    () => normalizeComments(appointment.comentarios),
    [appointment.comentarios]
  );

  const clientComments = useMemo(
    () => normalizeComments(appointment.usuario?.comentarios),
    [appointment.usuario?.comentarios]
  );

  const handleNoShowClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmNoShow = () => {
    setShowConfirmModal(false);
    if (onMarkNoShow) {
      onMarkNoShow(appointment._id);
    }
  };

  const handleCancelNoShow = () => {
    setShowConfirmModal(false);
  };

  const cardSizeStyle = {
    width: 'min(100%, 560px)',
    maxWidth: '560px',
    height: '100%',
    maxHeight: 'min(680px, calc(100vh - 160px))',
    minHeight: 'min(420px, calc(100vh - 160px))'
  } as const;

  const infoTileClass = `${
    isDisabled ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-700'
  } rounded-2xl px-3 py-2`;
  const infoInlineRowClass = 'flex flex-wrap items-center gap-x-2 gap-y-1';
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
      <div className="p-4 h-full flex flex-col gap-3 overflow-hidden relative">
        {/* Indicador de profesional aleatorio */}
        {appointment.isProfesionalRandom && (
          <div className="absolute top-4 right-4 z-10" title="Profesional aleatorio">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDisabled ? '#9ca3af' : 'var(--exora-primary)'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            >
              <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"></path>
              <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2l6.2 11.2c.6 1.3 2 2.2 3.6 2.2H22"></path>
              <polyline points="18 2 22 6 18 10"></polyline>
              <polyline points="18 14 22 18 18 22"></polyline>
            </svg>
          </div>
        )}

        {/* Top section - Status and Name */}
        <div className="flex-shrink-0 space-y-2">
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
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className={`${infoTileClass} flex items-start gap-2.5`}>
            <PhoneIcon size={16} className="mt-0.5" />
            <div className={`${infoInlineRowClass} flex-1`}>
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
              <span className={`${infoValueClass} break-words`}>
                {primaryService?.nombre || 'Servicio no especificado'}
              </span>
            </div>
          </div>

          {appointment.variantes && appointment.variantes.length > 0 && (
            <div className={`${infoTileClass} flex items-start gap-2.5`}>
              <VariantIcon size={16} className="mt-0.5" />
              <div className={`${infoInlineRowClass} flex-1`}>
                <span className={`text-[13px] font-medium leading-snug tracking-tight ${infoMutedClass}`}>
                  {appointment.variantes.map(v => v.nombre).join(', ')}
                </span>
              </div>
            </div>
          )}

          {appointment.sucursal && (
            <div className={`${infoTileClass} flex items-start gap-2.5`}>
              <LocationIcon size={16} className="mt-0.5" />
              <div className={`${infoInlineRowClass} flex-1`}>
                <span className={infoValueClass}>{appointment.sucursal.nombre}</span>
              </div>
            </div>
          )}

          {appointment.profesional?.nombre && (
            <div className={`${infoTileClass} flex items-start gap-2.5`}>
              <ProfessionalIcon size={16} className="mt-0.5" />
              <div className={`${infoInlineRowClass} flex-1`}>
                <span className={infoValueClass}>{appointment.profesional.nombre}</span>
              </div>
            </div>
          )}

          <div className={`${infoTileClass} flex items-start gap-2.5`}>
            <DiscountIcon size={16} className="mt-0.5" />
            <div className={`${infoInlineRowClass} flex-1`}>
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
                <p className={`text-[13px] leading-relaxed font-medium ${infoValueClass}`}>
                  {appointmentComments.join(' | ')}
                </p>
              </div>
            </div>
          )}

          {clientComments.length > 0 && (
            <div className={`${infoTileClass} flex items-start gap-2.5`}>
              <MailIcon size={16} className="mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className={`text-[13px] leading-relaxed font-medium ${infoValueClass}`}>
                  {clientComments.join(' | ')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom section - Action buttons */}
        {!isDisabled && (
          <div className="flex-shrink-0 pt-3 px-4 pb-4 space-y-2">
            {/* Botón de WhatsApp - siempre visible */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowWhatsAppModal(true);
              }}
              className="w-full py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-90 border-2 flex items-center justify-center gap-2"
              style={{
                borderColor: '#25D366',
                backgroundColor: '#E7F8EE',
                color: '#25D366'
              }}
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Enviar mensaje
            </button>

            {/* Botón "No presentado" - solo si no está pagada */}
            {!appointment.pagada && onMarkNoShow && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNoShowClick();
                }}
                className="w-full py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-80 border-2"
                style={{
                  borderColor: '#DC2626',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626'
                }}
              >
                No presentado
              </button>
            )}
          </div>
        )}

        {/* Modal de WhatsApp */}
        <WhatsAppModal
          isOpen={showWhatsAppModal}
          clientName={appointment.usuario.nombre}
          phone={appointment.usuario.telefono}
          professionalName={appointment.profesional?.nombre}
          onClose={() => setShowWhatsAppModal(false)}
        />

        {/* Modal de confirmación para "No presentado" */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          title="Marcar como No Presentado"
          message={`¿Estás seguro de que deseas marcar la cita de ${appointment.usuario.nombre} como "No presentado"? Esta acción no se puede deshacer.`}
          confirmText="Sí, marcar como No Presentado"
          cancelText="Cancelar"
          type="danger"
          onConfirm={handleConfirmNoShow}
          onCancel={handleCancelNoShow}
        />
      </div>
    </animated.div>
  );
};

export default AppointmentCard;
