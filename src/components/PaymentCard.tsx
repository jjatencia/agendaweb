import React, { useMemo, useState, useEffect } from 'react';
import { animated } from '@react-spring/web';
import { Appointment, Servicio, Variante } from '../types';
import { PromocionesService, Promocion } from '../services/promocionesService';
import { ServiciosService } from '../services/serviciosService';
import {
  CardIcon,
  CashIcon,
  CheckIcon,
  ServiceIcon,
  VariantIcon,
  WalletIcon
} from './icons';

interface PaymentCardProps {
  appointment: Appointment;
  onCompletePayment?: (appointmentId: string, metodoPago: string, editedAppointment?: Appointment) => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  appointment,
  onCompletePayment
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [precioConDescuento, setPrecioConDescuento] = useState<number>(appointment.importe);
  const [descuentoTotal, setDescuentoTotal] = useState<number>(0);
  const [loadingDescuentos, setLoadingDescuentos] = useState<boolean>(false);

  // Estados para edición
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [serviciosDisponibles, setServiciosDisponibles] = useState<Servicio[]>([]);
  const [variantesDisponibles, setVariantesDisponibles] = useState<Variante[]>([]);
  const [promocionesDisponibles, setPromocionesDisponibles] = useState<Promocion[]>([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(appointment.servicios[0] || null);
  const [variantesSeleccionadas, setVariantesSeleccionadas] = useState<Variante[]>(appointment.variantes || []);
  const [promocionesSeleccionadas, setPromocionesSeleccionadas] = useState<string[]>(appointment.promocion || []);
  const [precioCalculado, setPrecioCalculado] = useState<number>(appointment.importe);
  const cardSizeStyle = {
    width: 'min(100%, 560px)',
    maxWidth: '560px',
    height: '100%',
    maxHeight: 'min(680px, calc(100vh - 160px))',
    minHeight: 'min(420px, calc(100vh - 160px))'
  } as const;
  const appointmentDate = useMemo(() => new Date(appointment.fecha), [appointment.fecha]);
  const formattedTime = useMemo(
    () =>
      appointmentDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    [appointmentDate]
  );

  // Calcular descuentos por promociones
  useEffect(() => {
    const calcularDescuentos = async () => {
      if (!appointment.promocion || appointment.promocion.length === 0) {
        setPrecioConDescuento(appointment.importe);
        setDescuentoTotal(0);
        return;
      }

      setLoadingDescuentos(true);
      try {
        // Obtener promociones de la empresa
        const promocionesEmpresa = await PromocionesService.getPromocionesEmpresa(appointment.empresa);

        // Filtrar promociones aplicadas
        const promocionesAplicadas = promocionesEmpresa.filter(promocion =>
          appointment.promocion.includes(promocion._id)
        );

        let descuentoAcumulado = 0;

        // Calcular descuento total
        promocionesAplicadas.forEach(promocion => {
          // Solo aplicar descuentos si la promoción está activa y es de tipo descuento para servicios
          if (promocion.activo && promocion.tipo === 'descuento' && promocion.destino === 'servicio') {
            if (promocion.porcentaje !== null && promocion.porcentaje !== undefined) {
              // Descuento por porcentaje
              const descuento = appointment.importe * (promocion.porcentaje / 100);
              descuentoAcumulado += descuento;
            } else if (promocion.cifra !== undefined && promocion.cifra > 0) {
              // Descuento por cantidad fija (en centavos, convertir a euros)
              const descuento = promocion.cifra / 100;
              descuentoAcumulado += descuento;
            }
          }
        });

        const precioFinal = Math.max(0, appointment.importe - descuentoAcumulado);
        setPrecioConDescuento(precioFinal);
        setDescuentoTotal(descuentoAcumulado);
      } catch (error) {
        console.error('Error calculando descuentos en payment:', error);
        // En caso de error, usar precio original
        setPrecioConDescuento(appointment.importe);
        setDescuentoTotal(0);
      } finally {
        setLoadingDescuentos(false);
      }
    };

    calcularDescuentos();
  }, [appointment.promocion, appointment.empresa, appointment.importe]);

  // Cargar datos para edición
  useEffect(() => {
    const cargarDatosEdicion = async () => {
      if (!isEditing) return;

      try {
        const [servicios, variantes, promociones] = await Promise.all([
          ServiciosService.getServicios(appointment.empresa),
          ServiciosService.getVariantes(appointment.empresa),
          PromocionesService.getPromocionesEmpresa(appointment.empresa)
        ]);

        setServiciosDisponibles(servicios);
        setVariantesDisponibles(variantes);
        setPromocionesDisponibles(promociones);
      } catch (error) {
        console.error('Error cargando datos para edición:', error);
      }
    };

    cargarDatosEdicion();
  }, [isEditing, appointment.empresa]);

  // Recalcular precio cuando cambian las selecciones
  useEffect(() => {
    if (!isEditing) return;

    const calcularNuevoPrecio = async () => {
      let precioBase = (servicioSeleccionado?.precio || 0) / 100; // Convertir centavos a euros

      // Aquí se podría añadir lógica para variantes con precio
      // precioBase += variantesSeleccionadas.reduce((sum, v) => sum + (v.precio || 0), 0);

      // Aplicar descuentos de promociones
      let descuentoAcumulado = 0;
      for (const promocionId of promocionesSeleccionadas) {
        const promocion = promocionesDisponibles.find(p => p._id === promocionId);
        if (promocion && promocion.activo && promocion.tipo === 'descuento' && promocion.destino === 'servicio') {
          if (promocion.porcentaje !== null && promocion.porcentaje !== undefined) {
            descuentoAcumulado += precioBase * (promocion.porcentaje / 100);
          } else if (promocion.cifra !== undefined && promocion.cifra > 0) {
            descuentoAcumulado += promocion.cifra / 100;
          }
        }
      }

      const precioFinal = Math.max(0, precioBase - descuentoAcumulado);
      setPrecioCalculado(precioFinal);
      setDescuentoTotal(descuentoAcumulado);
    };

    calcularNuevoPrecio();
  }, [servicioSeleccionado, variantesSeleccionadas, promocionesSeleccionadas, promocionesDisponibles, isEditing]);

  const paymentMethods = useMemo(
    () => [
      { id: 'Pago en efectivo', name: 'Efectivo', icon: CashIcon },
      { id: 'Pago Tarjeta', name: 'Tarjeta', icon: CardIcon },
      { id: 'Monedero', name: 'Monedero', icon: WalletIcon }
    ],
    []
  );

  const handleCompletePayment = () => {
    if (!selectedPaymentMethod) {
      return;
    }
    if (onCompletePayment) {
      // Detectar si hay cambios comparando con los valores originales
      const hasServiceChanges = servicioSeleccionado?._id !== appointment.servicios[0]?._id;
      const hasVariantChanges = variantesSeleccionadas.length !== (appointment.variantes?.length || 0) ||
        variantesSeleccionadas.some(v => !(appointment.variantes?.some(av => av._id === v._id)));
      const hasPromocionChanges = promocionesSeleccionadas.length !== (appointment.promocion?.length || 0) ||
        promocionesSeleccionadas.some(p => !appointment.promocion?.includes(p)) ||
        appointment.promocion?.some(p => !promocionesSeleccionadas.includes(p));

      let editedAppointment: Appointment | undefined;

      // Si hay cambios, crear un appointment actualizado
      if (hasServiceChanges || hasVariantChanges || hasPromocionChanges) {
        editedAppointment = {
          ...appointment,
          servicios: servicioSeleccionado ? [servicioSeleccionado] : appointment.servicios,
          variantes: variantesSeleccionadas,
          promocion: promocionesSeleccionadas,
          importe: precioCalculado
        };
      }

      onCompletePayment(appointment._id, selectedPaymentMethod, editedAppointment);
    }
  };

  return (
    <animated.div
      style={{
        backgroundColor: '#FCFFA8', // Amarillo personalizado
        borderRadius: '24px',
        boxShadow: '0 22px 45px rgba(85, 91, 246, 0.18)',
        ...cardSizeStyle,
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="p-7 h-full flex flex-col relative gap-7 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 text-center pt-2 space-y-1">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#555BF6' }}>
            {appointment.usuario.nombre}
          </h2>
          <div className="text-base" style={{ color: '#555BF6' }}>
            {formattedTime}
          </div>
        </div>

        {/* Service Info */}
        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          {/* Botón de editar */}
          <div className="flex justify-between items-center">
            <div className="text-base font-medium" style={{ color: '#555BF6' }}>
              {isEditing ? 'Editando servicio' : 'Servicio reservado'}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
              style={{
                backgroundColor: isEditing ? '#E0E7FF' : '#D2E9FF',
                color: '#555BF6'
              }}
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {!isEditing ? (
            // Vista normal
            <>
              <div className="flex items-start space-x-3" style={{ color: '#555BF6' }}>
                <ServiceIcon size={16} />
                <div className="flex-1">
                  <div className="text-base font-medium">
                    {servicioSeleccionado?.nombre || appointment.servicios[0]?.nombre || 'Servicio no especificado'}
                  </div>
                </div>
              </div>

              {(variantesSeleccionadas.length > 0 || (appointment.variantes && appointment.variantes.length > 0)) && (
                <div className="flex items-start space-x-3" style={{ color: '#555BF6' }}>
                  <VariantIcon size={16} />
                  <div className="flex-1">
                    <div className="text-base font-medium">Variante:</div>
                    <div className="text-sm mt-1" style={{ color: '#555BF6' }}>
                      {(variantesSeleccionadas.length > 0 ? variantesSeleccionadas : appointment.variantes).map(v => v.nombre).join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Vista de edición
            <>
              {/* Selector de servicio */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: '#555BF6' }}>
                  Servicio:
                </label>
                <select
                  value={servicioSeleccionado?._id || ''}
                  onChange={(e) => {
                    const servicio = serviciosDisponibles.find(s => s._id === e.target.value);
                    setServicioSeleccionado(servicio || null);
                  }}
                  className="w-full p-2 border rounded-md text-sm"
                  style={{ borderColor: '#555BF6', color: '#555BF6' }}
                >
                  <option value="">Seleccionar servicio</option>
                  {serviciosDisponibles.map(servicio => (
                    <option key={servicio._id} value={servicio._id}>
                      {servicio.nombre} - €{(servicio.precio / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de variantes */}
              {variantesDisponibles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: '#555BF6' }}>
                    Variantes:
                  </label>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {variantesDisponibles.map(variante => (
                      <label key={variante._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={variantesSeleccionadas.some(v => v._id === variante._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVariantesSeleccionadas([...variantesSeleccionadas, variante]);
                            } else {
                              setVariantesSeleccionadas(variantesSeleccionadas.filter(v => v._id !== variante._id));
                            }
                          }}
                          className="text-sm"
                        />
                        <span className="text-sm" style={{ color: '#555BF6' }}>
                          {variante.nombre}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de promociones */}
              {promocionesDisponibles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: '#555BF6' }}>
                    Promociones:
                  </label>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {promocionesDisponibles
                      .filter(p => p.activo && p.tipo === 'descuento' && p.destino === 'servicio')
                      .map(promocion => (
                      <label key={promocion._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={promocionesSeleccionadas.includes(promocion._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPromocionesSeleccionadas([...promocionesSeleccionadas, promocion._id]);
                            } else {
                              setPromocionesSeleccionadas(promocionesSeleccionadas.filter(p => p !== promocion._id));
                            }
                          }}
                          className="text-sm"
                        />
                        <span className="text-sm" style={{ color: '#555BF6' }}>
                          {promocion.titulo || 'Promoción'}
                          {promocion.porcentaje && ` (-${promocion.porcentaje}%)`}
                          {promocion.cifra && ` (-€${(promocion.cifra / 100).toFixed(2)})`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón para confirmar cambios */}
              <button
                onClick={() => {
                  setIsEditing(false);
                  // Aquí se aplicarían los cambios al precio final
                  setPrecioConDescuento(precioCalculado);
                }}
                className="w-full py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  backgroundColor: '#555BF6',
                  color: 'white'
                }}
              >
                Confirmar cambios
              </button>
            </>
          )}

          {/* Promociones aplicadas */}
          {appointment.promocion && appointment.promocion.length > 0 && (
            <div className="flex items-start space-x-3" style={{ color: '#555BF6' }}>
              <div className="flex-1">
                <div className="text-base font-medium">Promociones:</div>
                <div className="text-sm mt-1">
                  {appointment.promocion.map((promocionId, index) => {
                    let label = 'Promoción especial';
                    if (promocionId === '66945b4a5706bb70baa15bc0') {
                      label = 'Aleatorio o barbero Junior';
                    } else if (promocionId === '66aff43347f5e3f837f20ad7') {
                      label = 'Mañanas';
                    }
                    return (
                      <span
                        key={promocionId || index}
                        className="inline-block px-2 py-1 rounded-md mr-1 mb-1 text-xs"
                        style={{ backgroundColor: '#E0E7FF', color: '#555BF6' }}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#FAFAB0' }}>
            <div className="text-base font-medium" style={{ color: '#555BF6' }}>
              {isEditing ? 'Precio estimado' : 'Total a cobrar'}
            </div>
            {loadingDescuentos ? (
              <div className="text-lg" style={{ color: '#555BF6' }}>Calculando...</div>
            ) : (
              <>
                {(descuentoTotal > 0 || (isEditing && precioCalculado !== ((servicioSeleccionado?.precio || 0) / 100))) ? (
                  <>
                    <div className="text-sm text-gray-600 line-through">
                      €{isEditing ? ((servicioSeleccionado?.precio || 0) / 100).toFixed(2) : appointment.importe.toFixed(2)}
                    </div>
                    <div className="text-2xl font-bold" style={{ color: '#555BF6' }}>
                      €{(isEditing ? precioCalculado : precioConDescuento).toFixed(2)}
                    </div>
                    {descuentoTotal > 0 && (
                      <div className="text-xs text-red-600">
                        Descuento: -€{descuentoTotal.toFixed(2)}
                      </div>
                    )}
                    {isEditing && (
                      <div className="text-xs" style={{ color: '#555BF6' }}>
                        Precio actualizado en tiempo real
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-2xl font-bold" style={{ color: '#555BF6' }}>
                    €{(isEditing ? precioCalculado : appointment.importe).toFixed(2)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <div className="text-base font-medium" style={{ color: '#555BF6' }}>Método de pago:</div>
            {paymentMethods.map((method) => {
              const IconComponent = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={`w-full p-3 rounded-lg border-2 flex items-center space-x-3 transition-all ${
                    selectedPaymentMethod === method.id
                      ? 'border-white shadow-md'
                      : 'border-white/50 hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: selectedPaymentMethod === method.id ? '#FAFAB0' : 'rgba(250, 250, 176, 0.5)'
                  }}
                >
                  <IconComponent size={20} style={{ color: '#555BF6' }} />
                  <span className="text-base font-medium" style={{ color: '#555BF6' }}>{method.name}</span>
                  {selectedPaymentMethod === method.id && (
                    <div className="ml-auto">
                      <CheckIcon size={16} strokeWidth={3} style={{ color: '#555BF6' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 space-y-2">
          <button
            onClick={handleCompletePayment}
            disabled={!selectedPaymentMethod}
            className={`w-full py-3 rounded-lg font-bold text-base transition-all ${
              selectedPaymentMethod
                ? 'hover:opacity-90 shadow-lg'
                : 'cursor-not-allowed'
            }`}
            style={
              selectedPaymentMethod
                ? { backgroundColor: '#555BF6', color: 'white' }
                : { backgroundColor: '#d1d5db', color: '#6b7280' }
            }
          >
            Completar Pago
          </button>
        </div>
      </div>
    </animated.div>
  );
};

export default PaymentCard;
