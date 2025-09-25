import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useAppointmentStore } from '../stores/appointmentStore';
// import { formatDateForAPILocal } from '../utils/helpers'; // No longer needed after removing date restriction
import { createVenta } from '../services/ventasService';
import { MonederoService } from '../services/monederoService';
import { CitasService } from '../services/citasService';
import { Appointment, ViewMode } from '../types';

interface UseDashboardResult {
  userName: string;
  isAuthenticated: boolean;
  paymentMode: boolean;
  currentDate: string;
  currentIndex: number;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
  showPaidOnly: boolean;
  filteredAppointments: Appointment[];
  canGoBack: boolean;
  canGoForward: boolean;
  handlers: {
    changeDate: (date: string) => void;
    changeViewMode: (mode: ViewMode) => void;
    nextAppointment: () => void;
    previousAppointment: () => void;
    refreshAppointments: () => void;
    initiatePaymentMode: () => void;
    completePayment: (appointmentId: string, metodoPago: string, editedAppointment?: Appointment) => Promise<void>;
    completeWalletPayment: (appointmentId: string, editedAppointment?: Appointment) => Promise<void>;
    markNoShow: (appointmentId: string) => Promise<void>;
    cancelPayment: () => void;
    logout: () => void;
    selectAppointment: (appointment: Appointment) => void;
  };
}

export const useDashboard = (): UseDashboardResult => {
  const navigate = useNavigate();
  const [paymentMode, setPaymentMode] = useState(false);

  const { user, isAuthenticated, logout: logoutStore, checkAuth } = useAuthStore();

  const {
    filteredAppointments,
    currentDate,
    currentIndex,
    viewMode,
    showPaidOnly,
    isLoading,
    error,
    fetchAppointments,
    setCurrentIndex,
    setCurrentDate,
    setViewMode,
    toggleShowPaid
  } = useAppointmentStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Comentado: Este efecto causaba loops infinitos al forzar fechas pasadas a cambiar a hoy
  // useEffect(() => {
  //   const now = new Date();
  //   const today = formatDateForAPILocal(now);

  //   if (currentDate < today) {
  //     setCurrentDate(today);
  //   }
  // }, [currentDate, setCurrentDate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments(currentDate);
    }
  }, [currentDate, fetchAppointments, isAuthenticated]);

  // Guardar citas en localStorage para recuperación de emergencia
  useEffect(() => {
    if (filteredAppointments.length > 0) {
      const appointmentsWithTimestamp = filteredAppointments.map(apt => ({
        ...apt,
        _cached_at: new Date().toISOString()
      }));
      localStorage.setItem('exora_recent_appointments', JSON.stringify(appointmentsWithTimestamp));
    }
  }, [filteredAppointments]);

  const changeDate = useCallback(
    (newDate: string) => {
      setCurrentDate(newDate);
    },
    [setCurrentDate]
  );

  const changeViewMode = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      // Cerrar modo pago al cambiar vista
      if (paymentMode) {
        setPaymentMode(false);
      }
    },
    [setViewMode, paymentMode]
  );

  const selectAppointment = useCallback(
    (appointment: Appointment) => {
      // Encontrar el índice en la lista filtrada
      const appointmentIndex = filteredAppointments.findIndex(apt => apt._id === appointment._id);
      if (appointmentIndex !== -1) {
        setCurrentIndex(appointmentIndex);
        // Cambiar automáticamente a vista tarjetas
        setViewMode(ViewMode.CARDS);
        // Si no está en modo pago y la cita no está pagada, activar modo pago
        if (!paymentMode && !appointment.pagada) {
          setPaymentMode(true);
        }
      }
    },
    [filteredAppointments, setCurrentIndex, setViewMode, paymentMode]
  );

  const nextAppointment = useCallback(() => {
    if (currentIndex < filteredAppointments.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, filteredAppointments.length, setCurrentIndex]);

  const previousAppointment = useCallback(() => {
    if (currentIndex > 0 && currentIndex <= filteredAppointments.length - 1) {
      setCurrentIndex(currentIndex - 1);
      return;
    }

    if (!showPaidOnly && currentIndex === 0) {
      toggleShowPaid();
    }
  }, [currentIndex, filteredAppointments.length, showPaidOnly, setCurrentIndex, toggleShowPaid]);

  const refreshAppointments = useCallback(() => {
    fetchAppointments(currentDate);
  }, [currentDate, fetchAppointments]);

  const resetPaymentMode = useCallback(() => {
    setPaymentMode(false);
  }, []);

  const initiatePaymentMode = useCallback(() => {
    if (paymentMode) {
      resetPaymentMode();
      return;
    }

    if (filteredAppointments.length === 0) {
      toast.error('No hay citas disponibles');
      return;
    }

    const appointment = filteredAppointments[currentIndex];

    if (!appointment) {
      toast.error('No se encontró la cita');
      return;
    }

    if (appointment.pagada) {
      toast.error('Esta cita ya está pagada');
      return;
    }

    setPaymentMode(true);
  }, [currentIndex, filteredAppointments, paymentMode, resetPaymentMode]);

  const completePayment = useCallback(
    async (_appointmentId: string, metodoPago: string, editedAppointment?: Appointment) => {
      const currentAppointment = filteredAppointments[currentIndex];

      if (!currentAppointment) {
        toast.error('No se encontró la cita');
        return;
      }

      try {
        toast.loading('Procesando pago...');

        // Usar la cita editada si está disponible, caso contrario usar la original
        const appointmentToProcess = editedAppointment || currentAppointment;

        // Pasar el importe final calculado si hay editedAppointment, sino undefined para usar el original
        const importeFinal = editedAppointment ? editedAppointment.importe : undefined;

        await createVenta(appointmentToProcess, metodoPago, importeFinal);

        toast.dismiss();
        toast.success('Pago completado exitosamente');
        resetPaymentMode();
        fetchAppointments(currentDate);
      } catch (error: any) {
        toast.dismiss();
        console.error('Error al procesar el pago:', error);

        // Handle auth errors gracefully
        if (error.authError || error.status === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          logoutStore();
          navigate('/login');
        } else {
          toast.error(error.message || 'Error al procesar el pago');
        }
      }
    },
    [currentDate, currentIndex, filteredAppointments, fetchAppointments, resetPaymentMode, logoutStore, navigate]
  );

  const completeWalletPayment = useCallback(
    async (_appointmentId: string, editedAppointment?: Appointment) => {
      const currentAppointment = filteredAppointments[currentIndex];

      if (!currentAppointment) {
        toast.error('No se encontró la cita');
        return;
      }

      try {
        toast.loading('Procesando pago con monedero...');

        // Usar la cita editada si está disponible, caso contrario usar la original
        const appointmentToProcess = editedAppointment || currentAppointment;

        // Usar el importe final calculado si hay editedAppointment, sino el original
        const importeFinal = editedAppointment ? editedAppointment.importe : appointmentToProcess.importe;

        // Verificar saldo suficiente con el importe final
        if (!MonederoService.tieneSaldoSuficiente(appointmentToProcess.usuario.saldoMonedero, importeFinal)) {
          toast.dismiss();
          toast.error('Saldo insuficiente en el monedero');
          return;
        }

        // Procesar pago con monedero usando la secuencia completa de la API
        await MonederoService.procesarPagoMonedero(
          appointmentToProcess.usuario._id,
          appointmentToProcess.empresa,
          appointmentToProcess._id,
          importeFinal
        );

        toast.dismiss();
        toast.success('Pago con monedero completado exitosamente');
        resetPaymentMode();
        fetchAppointments(currentDate);
      } catch (error: any) {
        toast.dismiss();
        console.error('Error al procesar el pago con monedero:', error);

        // Handle auth errors gracefully
        if (error.authError || error.status === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          logoutStore();
          navigate('/login');
        } else {
          toast.error(error.message || 'Error al procesar el pago con monedero');
        }
      }
    },
    [currentDate, currentIndex, filteredAppointments, fetchAppointments, resetPaymentMode, logoutStore, navigate]
  );

  const markNoShow = useCallback(
    async (appointmentId: string) => {
      const appointment = filteredAppointments.find(apt => apt._id === appointmentId);

      if (!appointment) {
        toast.error('No se encontró la cita');
        return;
      }

      try {
        toast.loading('Marcando como no presentado...');

        await CitasService.marcarNoPresentado(appointment);

        toast.dismiss();
        toast.success('Cita marcada como no presentado');
        fetchAppointments(currentDate);
      } catch (error: any) {
        toast.dismiss();
        console.error('Error marcando cita como no presentado:', error);

        // Handle auth errors gracefully
        if (error.authError || error.status === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          logoutStore();
          navigate('/login');
        } else {
          toast.error(error.message || 'Error al marcar cita como no presentado');
        }
      }
    },
    [currentDate, filteredAppointments, fetchAppointments, logoutStore, navigate]
  );

  const cancelPayment = useCallback(() => {
    resetPaymentMode();
    toast('Pago cancelado');
  }, [resetPaymentMode]);

  const logout = useCallback(() => {
    logoutStore();
    navigate('/login');
  }, [logoutStore, navigate]);

  const resolvedUserName = useMemo(() => {
    if (!user) {
      return 'Usuario';
    }

    if ('name' in user && user.name) {
      return user.name;
    }

    const legacyUser = user as unknown as { nombre?: string };
    return legacyUser.nombre || 'Usuario';
  }, [user]);

  const canGoBack = useMemo(() => currentIndex > 0 && !paymentMode, [currentIndex, paymentMode]);
  const canGoForward = useMemo(
    () => currentIndex < filteredAppointments.length - 1 && !paymentMode,
    [currentIndex, filteredAppointments.length, paymentMode]
  );

  return {
    userName: resolvedUserName,
    isAuthenticated,
    paymentMode,
    currentDate,
    currentIndex,
    viewMode,
    isLoading,
    error,
    showPaidOnly,
    filteredAppointments,
    canGoBack,
    canGoForward,
    handlers: {
      changeDate,
      changeViewMode,
      nextAppointment,
      previousAppointment,
      refreshAppointments,
      initiatePaymentMode,
      completePayment,
      completeWalletPayment,
      markNoShow,
      cancelPayment,
      logout,
      selectAppointment
    }
  };
};
