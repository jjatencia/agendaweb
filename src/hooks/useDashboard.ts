import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useAppointmentStore } from '../stores/appointmentStore';
import { CitasService } from '../services/citasService';
import { Appointment, ViewMode } from '../types';

interface UseDashboardResult {
  userName: string;
  isAuthenticated: boolean;
  checklistMode: boolean;
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
    toggleChecklist: () => void;
    closeChecklist: () => void;
    markNoShow: (appointmentId: string) => Promise<void>;
    logout: () => void;
    selectAppointment: (appointment: Appointment) => void;
  };
}

export const useDashboard = (): UseDashboardResult => {
  const navigate = useNavigate();
  const [checklistMode, setChecklistMode] = useState(false);

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
      if (checklistMode) {
        setChecklistMode(false);
      }
    },
    [setViewMode, checklistMode]
  );

  const selectAppointment = useCallback(
    (appointment: Appointment) => {
      const appointmentIndex = filteredAppointments.findIndex(apt => apt._id === appointment._id);
      if (appointmentIndex !== -1) {
        setCurrentIndex(appointmentIndex);
        setViewMode(ViewMode.CARDS);
      }
    },
    [filteredAppointments, setCurrentIndex, setViewMode]
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

  const toggleChecklist = useCallback(() => {
    if (checklistMode) {
      setChecklistMode(false);
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

    setChecklistMode(true);
  }, [currentIndex, filteredAppointments, checklistMode]);

  const closeChecklist = useCallback(() => {
    setChecklistMode(false);
  }, []);

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

  const canGoBack = useMemo(() => currentIndex > 0 && !checklistMode, [currentIndex, checklistMode]);
  const canGoForward = useMemo(
    () => currentIndex < filteredAppointments.length - 1 && !checklistMode,
    [currentIndex, filteredAppointments.length, checklistMode]
  );

  return {
    userName: resolvedUserName,
    isAuthenticated,
    checklistMode,
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
      toggleChecklist,
      closeChecklist,
      markNoShow,
      logout,
      selectAppointment
    }
  };
};
