import { apiClient } from './api';
import { Appointment } from '../types';

export interface UpdateCitaEstadoRequest {
  empresa: string;
  estadoCita: string;
}

export interface UpdateCitaEstadoResponse {
  ok: boolean;
  msg: string;
  cita: {
    recordatorios: {
      m1: boolean;
      m2: boolean;
      m3: boolean;
      m4: boolean;
      m5: boolean;
      m6: boolean;
    };
    _id: string;
    usuario: {
      _id: string;
      nombre: string;
      email: string;
      telefono: string;
      deleted: boolean;
    };
    usuarioDelayType: string;
    usuarioDelay: string;
    empresa: string;
    sucursal: string;
    profesional: string;
    profesionalDelayType: string;
    profesionalDelay: string;
    fecha: string;
    importe: number;
    descuentos: any[];
    promocion: any[];
    servicios: string[];
    comentarios: any[];
    tieneHijas: boolean;
    duracion: string;
    pagada: boolean;
    prepago: boolean;
    variantes: any[];
    complementarios: any[];
    isProfesionalRandom: boolean;
    estado: string;
    deleted: boolean;
    metodoPago: string;
    creacion: string;
    modificacion: string;
  };
}

export class CitasService {
  /**
   * Marca una cita como "No presentado"
   */
  static async marcarNoPresentado(appointment: Appointment): Promise<UpdateCitaEstadoResponse> {
    try {
      const payload: UpdateCitaEstadoRequest = {
        empresa: appointment.empresa,
        estadoCita: 'No presentado'
      };

      const response = await apiClient.delete<UpdateCitaEstadoResponse>(
        `/citas/${appointment._id}`,
        { data: payload }
      );

      return response.data;
    } catch (error) {
      console.error('Error marcando cita como no presentado:', error);
      throw error;
    }
  }

  /**
   * Intenta recuperar citas marcadas como "No presentado" de hoy
   */
  static async getCitasNoPresentadas(empresa: string, fecha: string): Promise<Appointment[]> {
    try {
      // Intentar obtener todas las citas del día para buscar las marcadas como "No presentado"
      const response = await apiClient.post<any>('/citas/dia/profesional', {
        empresa,
        fecha
      });

      // Filtrar citas con estado "No presentado" si existe ese campo
      const allAppointments = response.data.citas || response.data;
      const noPresentadoAppointments = Array.isArray(allAppointments)
        ? allAppointments.filter((cita: any) =>
            cita.estado === 'No presentado' ||
            cita.estadoCita === 'No presentado'
          )
        : [];

      return noPresentadoAppointments;
    } catch (error) {
      console.error('Error obteniendo citas no presentadas:', error);
      throw error;
    }
  }

  /**
   * Intenta obtener el historial de cambios de citas
   */
  static async getHistorialCitas(empresa: string, fecha: string): Promise<any[]> {
    try {
      // Intentar diferentes endpoints posibles para historial
      const endpoints = [
        `/citas/historial`,
        `/citas/auditoria`,
        `/citas/logs`,
        `/empresa/${empresa}/citas/historial`,
        `/citas/eliminadas`,
        `/citas/papelera`,
        `/admin/citas/eliminadas`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await apiClient.get(endpoint, {
            params: { empresa, fecha }
          });
          return response.data;
        } catch (endpointError: any) {
          // Si no es 404, re-throw el error
          if (endpointError.status !== 404) {
            throw endpointError;
          }
          // Continue to next endpoint if 404
        }
      }

      throw new Error('No se encontró endpoint de historial disponible');
    } catch (error) {
      console.error('Error obteniendo historial de citas:', error);
      throw error;
    }
  }

  /**
   * Intenta buscar todas las citas de los últimos días para encontrar patrones
   */
  static async buscarCitasRecientes(empresa: string, diasAtras: number = 3): Promise<Appointment[]> {
    try {
      const todasLasCitas: Appointment[] = [];

      for (let i = 0; i <= diasAtras; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];

        try {
          const response = await apiClient.post<any>('/citas/dia/profesional', {
            empresa,
            fecha: fechaStr
          });

          const citasDelDia = response.data.citas || response.data || [];
          todasLasCitas.push(...citasDelDia);
        } catch (error) {
          console.warn(`No se pudieron obtener citas para ${fechaStr}`);
        }
      }

      // Ordenar por fecha de modificación descendente
      return todasLasCitas.sort((a, b) =>
        new Date(b.modificacion || b.creacion || 0).getTime() -
        new Date(a.modificacion || a.creacion || 0).getTime()
      );
    } catch (error) {
      console.error('Error buscando citas recientes:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una cita
   */
  static async updateEstadoCita(
    appointment: Appointment,
    estadoCita: string
  ): Promise<UpdateCitaEstadoResponse> {
    try {
      const payload: UpdateCitaEstadoRequest = {
        empresa: appointment.empresa,
        estadoCita: estadoCita
      };

      const response = await apiClient.delete<UpdateCitaEstadoResponse>(
        `/citas/${appointment._id}`,
        { data: payload }
      );

      return response.data;
    } catch (error) {
      console.error('Error actualizando estado de cita:', error);
      throw error;
    }
  }
}