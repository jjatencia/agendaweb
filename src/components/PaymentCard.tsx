import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
  onWalletPayment?: (appointmentId: string, editedAppointment?: Appointment) => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  appointment,
  onCompletePayment,
  onWalletPayment
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>({});
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [isDividedPayment, setIsDividedPayment] = useState<boolean>(false);
  const [inputAmount, setInputAmount] = useState<string>('');
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

  // Estados originales para poder cancelar cambios
  const [estadoOriginal, setEstadoOriginal] = useState({
    servicioSeleccionado: appointment.servicios[0] || null,
    variantesSeleccionadas: appointment.variantes || [],
    promocionesSeleccionadas: appointment.promocion || []
  });
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

        // Actualizar las variantes seleccionadas existentes con los precios de la API
        // Solo al entrar en modo edición por primera vez
        if (isEditing) {
          const variantesActualizadas = variantesSeleccionadas.map(varianteExistente => {
            const varianteConPrecio = variantes.find(v => v._id === varianteExistente._id || v.nombre === varianteExistente.nombre);
            return {
              ...varianteExistente,
              precio: varianteConPrecio?.precio || 0
            };
          });

          // Solo actualizar si realmente hay diferencias
          const hayDiferencias = variantesActualizadas.some((v, i) =>
            v.precio !== variantesSeleccionadas[i]?.precio
          );

          if (hayDiferencias) {
            setVariantesSeleccionadas(variantesActualizadas);

            // Actualizar también el estado original con los precios
            setEstadoOriginal(prev => ({
              ...prev,
              variantesSeleccionadas: variantesActualizadas
            }));

            // Calcular precio inicial
            setTimeout(() => {
              let precioBase = (servicioSeleccionado?.precio || 0) / 100;
              const precioVariantes = variantesActualizadas.reduce((sum, variante) => {
                return sum + ((variante.precio || 0) / 100);
              }, 0);
              precioBase += precioVariantes;

              let descuentoAcumulado = 0;
              for (const promocionId of promocionesSeleccionadas) {
                const promocion = promociones.find(p => p._id === promocionId);
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
            }, 50);
          }
        }
      } catch (error) {
        console.error('Error cargando datos para edición:', error);
      }
    };

    cargarDatosEdicion();
  }, [isEditing, appointment.empresa]);

  // Recalcular precio cuando cambian las selecciones
  useEffect(() => {
    if (!isEditing) return;

    const calcularNuevoPrecio = () => {
      let precioBase = (servicioSeleccionado?.precio || 0) / 100; // Convertir centavos a euros

      // Añadir precio de variantes seleccionadas
      const precioVariantes = variantesSeleccionadas.reduce((sum, variante) => {
        return sum + ((variante.precio || 0) / 100);
      }, 0);

      precioBase += precioVariantes;

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

  // Callbacks para manejar cambios
  const handleServiceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const servicio = serviciosDisponibles.find(s => s._id === e.target.value);
    setServicioSeleccionado(servicio || null);
  }, [serviciosDisponibles]);

  const handleVariantChange = useCallback((variante: Variante, checked: boolean) => {
    if (checked) {
      setVariantesSeleccionadas(prev => [...prev, variante]);
    } else {
      setVariantesSeleccionadas(prev => prev.filter(v => v._id !== variante._id));
    }
  }, []);

  const handlePromocionChange = useCallback((promocionId: string, checked: boolean) => {
    if (checked) {
      setPromocionesSeleccionadas(prev => [...prev, promocionId]);
    } else {
      setPromocionesSeleccionadas(prev => prev.filter(p => p !== promocionId));
    }
  }, []);

  const cancelarCambios = useCallback(() => {
    // Restaurar estados originales
    setServicioSeleccionado(estadoOriginal.servicioSeleccionado);
    setVariantesSeleccionadas(estadoOriginal.variantesSeleccionadas);
    setPromocionesSeleccionadas(estadoOriginal.promocionesSeleccionadas);
    setPrecioCalculado(appointment.importe);
    setPrecioConDescuento(precioConDescuento); // Mantener el precio con descuentos original
    setIsEditing(false);
  }, [estadoOriginal, appointment.importe, precioConDescuento]);

  // Calcular importe total asignado y restante
  const totalAsignado = Object.values(paymentAmounts).reduce((sum, amount) => sum + amount, 0);
  const importeTotal = isEditing ? precioCalculado : precioConDescuento;
  const importeRestante = Math.max(0, importeTotal - totalAsignado);
  const esPagoCompleto = Math.abs(importeRestante) < 0.01;

  // Verificar saldo del monedero
  const saldoMonedero = appointment.usuario.saldoMonedero || 0;

  const handlePaymentMethodClick = useCallback((methodId: string) => {
    if (!isDividedPayment) {
      // Comportamiento normal: seleccionar método completo
      setSelectedPaymentMethod(methodId);
      setPaymentAmounts({}); // Limpiar importes divididos
    } else {
      // Modo dividido: abrir modal para ese método
      setActiveInput(methodId);
      setInputAmount((paymentAmounts[methodId] || 0).toString());
    }
  }, [isDividedPayment, paymentAmounts]);

  const handleLongPress = useCallback((methodId: string) => {
    // Long press activa modo dividido y abre modal
    setIsDividedPayment(true);
    setSelectedPaymentMethod('');
    setActiveInput(methodId);
    setInputAmount('');
  }, []);

  const handleConfirmAmount = useCallback(() => {
    if (!activeInput) return;

    const numAmount = Math.max(0, parseFloat(inputAmount) || 0);
    const baseMaxAmount = importeRestante + (paymentAmounts[activeInput] || 0);

    // Para monedero, limitar también al saldo disponible
    const maxAmount = activeInput === 'Monedero'
      ? Math.min(baseMaxAmount, saldoMonedero)
      : baseMaxAmount;

    const finalAmount = Math.min(numAmount, maxAmount);

    setPaymentAmounts(prev => ({
      ...prev,
      [activeInput]: finalAmount
    }));

    setActiveInput(null);
    setInputAmount('');
  }, [activeInput, inputAmount, importeRestante, paymentAmounts, saldoMonedero]);

  const handleSetAllAmount = useCallback(() => {
    if (!activeInput) return;

    const baseMaxAmount = importeRestante + (paymentAmounts[activeInput] || 0);

    // Para monedero, limitar también al saldo disponible
    const maxAmount = activeInput === 'Monedero'
      ? Math.min(baseMaxAmount, saldoMonedero)
      : baseMaxAmount;

    setInputAmount(maxAmount.toString());
  }, [activeInput, importeRestante, paymentAmounts, saldoMonedero]);

  // Removed unused handlers - keeping for potential future use
  // const handleAmountChange = useCallback((methodId: string, amount: string) => {
  //   const numAmount = Math.max(0, parseFloat(amount) || 0);
  //   const maxAmount = importeRestante + (paymentAmounts[methodId] || 0);
  //   const finalAmount = Math.min(numAmount, maxAmount);

  //   setPaymentAmounts(prev => ({
  //     ...prev,
  //     [methodId]: finalAmount
  //   }));
  // }, [importeRestante, paymentAmounts]);

  // const handleQuickAmount = useCallback((methodId: string, amount: number) => {
  //   const maxAmount = importeRestante + (paymentAmounts[methodId] || 0);
  //   const finalAmount = Math.min(amount, maxAmount);

  //   setPaymentAmounts(prev => ({
  //     ...prev,
  //     [methodId]: finalAmount
  //   }));
  // }, [importeRestante, paymentAmounts]);

  const paymentMethods = useMemo(
    () => [
      { id: 'Pago en efectivo', name: 'Efectivo', icon: CashIcon },
      { id: 'Pago Tarjeta', name: 'Tarjeta', icon: CardIcon },
      { id: 'Monedero', name: 'Monedero', icon: WalletIcon }
    ],
    []
  );

  const handleCompletePayment = async () => {
    if (!isDividedPayment) {
      // Modo normal: requiere método seleccionado
      if (!selectedPaymentMethod) {
        return;
      }
    } else {
      // Modo dividido: requiere pago completo
      if (!esPagoCompleto) {
        return;
      }
    }

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
        importe: precioConDescuento
      };
    }

    if (!isDividedPayment) {
      // Modo normal: un solo pago
      if (selectedPaymentMethod === 'Monedero' && onWalletPayment) {
        // Usar el callback específico del monedero
        onWalletPayment(appointment._id, editedAppointment);
      } else if (onCompletePayment) {
        // Otros métodos de pago
        onCompletePayment(appointment._id, selectedPaymentMethod, editedAppointment);
      }
    } else {
      // Modo dividido: múltiples pagos
      const pagosActivos = Object.entries(paymentAmounts)
        .filter(([_, amount]) => amount > 0)
        .map(([methodId, amount]) => ({ methodId, amount }));

      for (const pago of pagosActivos) {
        const appointmentConImporte = editedAppointment
          ? { ...editedAppointment, importe: pago.amount }
          : { ...appointment, importe: pago.amount };

        if (pago.methodId === 'Monedero' && onWalletPayment) {
          onWalletPayment(appointment._id, appointmentConImporte);
        } else if (onCompletePayment) {
          onCompletePayment(appointment._id, pago.methodId, appointmentConImporte);
        }
      }
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
              onClick={isEditing ? cancelarCambios : () => setIsEditing(true)}
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
                  onChange={handleServiceChange}
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
                          onChange={(e) => handleVariantChange(variante, e.target.checked)}
                          className="text-sm"
                        />
                        <span className="text-sm" style={{ color: '#555BF6' }}>
                          {variante.nombre}
                          {variante.precio !== undefined && variante.precio > 0 ? (
                            <span className="ml-1 text-xs opacity-75">
                              (+€{(variante.precio / 100).toFixed(2)})
                            </span>
                          ) : (
                            <span className="ml-1 text-xs opacity-50">
                              (gratis)
                            </span>
                          )}
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
                          onChange={(e) => handlePromocionChange(promocion._id, e.target.checked)}
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
                  // precioCalculado ya incluye los descuentos y variantes calculados en tiempo real
                  setPrecioConDescuento(precioCalculado);
                  // descuentoTotal ya está calculado correctamente por el useEffect de cálculo
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
                {(descuentoTotal > 0 || (isEditing && Math.abs(precioCalculado - appointment.importe) > 0.01)) ? (
                  <>
                    <div className="text-sm text-gray-600 line-through">
                      €{appointment.importe.toFixed(2)}
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
                    €{(isEditing ? precioCalculado : precioConDescuento).toFixed(2)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-base font-medium" style={{ color: '#555BF6' }}>
                Método de pago:
              </div>
              {isDividedPayment && (
                <div className="text-sm" style={{ color: '#555BF6' }}>
                  Restante: €{importeRestante.toFixed(2)}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-between">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                const isSelected = selectedPaymentMethod === method.id;
                const hasAmount = paymentAmounts[method.id] > 0;
                const isWallet = method.id === 'Monedero';
                const isDisabled = isWallet && saldoMonedero <= 0;

                return (
                  <button
                    key={method.id}
                    onClick={() => handlePaymentMethodClick(method.id)}
                    onTouchStart={(e) => {
                      if (isDisabled) return;

                      const timeoutId = setTimeout(() => {
                        handleLongPress(method.id);
                        if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
                      }, 500);

                      const handleTouchEnd = () => {
                        clearTimeout(timeoutId);
                        e.currentTarget.removeEventListener('touchend', handleTouchEnd);
                        e.currentTarget.removeEventListener('touchcancel', handleTouchEnd);
                      };

                      e.currentTarget.addEventListener('touchend', handleTouchEnd);
                      e.currentTarget.addEventListener('touchcancel', handleTouchEnd);
                    }}
                    disabled={isDisabled}
                    className={`flex-1 p-4 rounded-lg border-2 flex items-center justify-center relative transition-all ${
                      isDisabled
                        ? 'border-gray-300 opacity-50 cursor-not-allowed'
                        : (!isDividedPayment && isSelected) || (isDividedPayment && hasAmount)
                        ? 'border-white shadow-md'
                        : 'border-white/50 hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isDisabled
                        ? 'rgba(200, 200, 200, 0.3)'
                        : ((!isDividedPayment && isSelected) || (isDividedPayment && hasAmount))
                        ? '#FAFAB0'
                        : 'rgba(250, 250, 176, 0.5)'
                    }}
                    title={
                      isWallet
                        ? `${method.name} - Saldo: €${saldoMonedero.toFixed(2)}${saldoMonedero <= 0 ? ' (Sin saldo)' : ''}`
                        : `${method.name} - Mantén presionado para dividir pago`
                    }
                  >
                    <IconComponent size={24} style={{ color: isDisabled ? '#999' : '#555BF6' }} />

                    {/* Check icon para métodos seleccionados */}
                    {!isDisabled && ((!isDividedPayment && isSelected) || (isDividedPayment && hasAmount)) && (
                      <div className="absolute top-1 right-1">
                        <CheckIcon size={14} strokeWidth={3} style={{ color: '#555BF6' }} />
                      </div>
                    )}

                    {/* Mostrar saldo del monedero */}
                    {isWallet && (
                      <div className="absolute bottom-1 left-1 right-1 text-center">
                        <div
                          className={`text-xs font-medium rounded px-1 ${
                            saldoMonedero > 0 ? 'bg-white/80' : 'bg-red-100'
                          }`}
                          style={{
                            color: saldoMonedero > 0 ? '#555BF6' : '#DC2626'
                          }}
                        >
                          €{saldoMonedero.toFixed(2)}
                        </div>
                      </div>
                    )}

                    {/* Mostrar cantidad asignada en modo dividido para monedero si tiene saldo positivo y cantidad asignada */}
                    {isWallet && isDividedPayment && hasAmount && saldoMonedero > 0 && (
                      <div className="absolute bottom-1 left-1 right-1 text-center">
                        <div className="text-xs font-medium bg-white/80 rounded px-1" style={{ color: '#555BF6' }}>
                          €{paymentAmounts[method.id].toFixed(2)}
                        </div>
                      </div>
                    )}

                    {/* Mostrar cantidad asignada en modo dividido para otros métodos */}
                    {!isWallet && isDividedPayment && hasAmount && (
                      <div className="absolute bottom-1 left-1 right-1 text-center">
                        <div className="text-xs font-medium bg-white/80 rounded px-1" style={{ color: '#555BF6' }}>
                          €{paymentAmounts[method.id].toFixed(2)}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {isDividedPayment && (
              <div className="text-center">
                <button
                  onClick={() => {
                    setIsDividedPayment(false);
                    setPaymentAmounts({});
                    setSelectedPaymentMethod('');
                    setActiveInput(null);
                  }}
                  className="text-xs px-3 py-1 rounded border"
                  style={{ borderColor: '#555BF6', color: '#555BF6' }}
                >
                  Volver a pago único
                </button>
              </div>
            )}
          </div>

          {/* Modal de entrada de importe */}
          {activeInput && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div
                className="rounded-xl p-6 w-full max-w-sm shadow-2xl"
                style={{ backgroundColor: '#FCFFA8' }}
              >
                <div className="text-center mb-6">
                  <div className="text-xl font-bold mb-2" style={{ color: '#555BF6' }}>
                    {paymentMethods.find(m => m.id === activeInput)?.name}
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#555BF6', opacity: 0.8 }}>
                    Máximo: €{(() => {
                      const baseMax = importeRestante + (paymentAmounts[activeInput] || 0);
                      return activeInput === 'Monedero'
                        ? Math.min(baseMax, saldoMonedero).toFixed(2)
                        : baseMax.toFixed(2);
                    })()}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="number"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-4 border-2 rounded-xl text-xl text-center font-bold shadow-sm"
                      style={{
                        borderColor: '#555BF6',
                        color: '#555BF6',
                        backgroundColor: '#FAFAB0'
                      }}
                      step="0.01"
                      min="0"
                      max={(() => {
                        const baseMax = importeRestante + (paymentAmounts[activeInput] || 0);
                        return activeInput === 'Monedero'
                          ? Math.min(baseMax, saldoMonedero)
                          : baseMax;
                      })()}
                      autoFocus
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl font-bold" style={{ color: '#555BF6' }}>
                      €
                    </div>
                  </div>

                  <button
                    onClick={handleSetAllAmount}
                    className="w-full py-3 rounded-xl border-2 font-medium transition-all hover:shadow-md"
                    style={{
                      borderColor: '#555BF6',
                      color: '#555BF6',
                      backgroundColor: '#FAFAB0'
                    }}
                    disabled={importeRestante <= 0}
                  >
                    Importe completo: {(() => {
                      const baseMax = importeRestante + (paymentAmounts[activeInput] || 0);
                      const maxAmount = activeInput === 'Monedero'
                        ? Math.min(baseMax, saldoMonedero)
                        : baseMax;
                      return maxAmount.toFixed(2);
                    })()}€
                  </button>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setActiveInput(null);
                        setInputAmount('');
                      }}
                      className="flex-1 py-3 rounded-xl border-2 font-medium transition-all hover:opacity-80"
                      style={{
                        borderColor: '#555BF6',
                        color: '#555BF6',
                        backgroundColor: 'rgba(250, 250, 176, 0.5)'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmAmount}
                      className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90 shadow-md"
                      style={{ backgroundColor: '#555BF6', color: 'white' }}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 space-y-2">
          <button
            onClick={handleCompletePayment}
            disabled={isDividedPayment ? !esPagoCompleto : !selectedPaymentMethod}
            className={`w-full py-3 rounded-lg font-bold text-base transition-all ${
              (isDividedPayment ? esPagoCompleto : selectedPaymentMethod)
                ? 'hover:opacity-90 shadow-lg'
                : 'cursor-not-allowed'
            }`}
            style={
              (isDividedPayment ? esPagoCompleto : selectedPaymentMethod)
                ? { backgroundColor: '#555BF6', color: 'white' }
                : { backgroundColor: '#d1d5db', color: '#6b7280' }
            }
          >
            {isDividedPayment && totalAsignado > 0
              ? `Completar Pago (€${totalAsignado.toFixed(2)})`
              : 'Completar Pago'
            }
          </button>
        </div>
      </div>
    </animated.div>
  );
};

export default PaymentCard;
