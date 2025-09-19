import { Appointment } from '../types';
import { apiClient, buildAuthHeaders } from './api';
import { AuthService } from './authService';

export interface VentaData {
  usuario: string;
  empresa: string;
  sucursal: string;
  profesional: string;
  fechaCita: string;
  importe: number;
  promocion: any[];
  servicios: Array<{
    _id: string;
    nombre: string;
    precio: number;
  }>;
  variantes: Array<{
    _id: string;
    nombre: string;
  }>;
  productos: any[];
  metodoPago: string;
  cita: string;
  descuentos: any[];
  fechaVenta: string;
}

export const createVenta = async (appointment: Appointment, metodoPago: string): Promise<any> => {
  const token = AuthService.getToken();

  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const ventaData: VentaData = {
    usuario: appointment.usuario._id,
    empresa: appointment.empresa,
    sucursal: appointment.sucursal._id,
    profesional: appointment.profesional._id,
    fechaCita: appointment.fecha,
    importe: appointment.importe,
    promocion: Array.isArray(appointment.promocion)
      ? appointment.promocion.map((promo: any) => {
          if (typeof promo === 'string') {
            return promo;
          }
          if (promo && typeof promo === 'object' && '_id' in promo) {
            return promo._id;
          }
          return promo;
        })
      : [],
    servicios: appointment.servicios.map((servicio) => ({
      _id: servicio._id,
      nombre: servicio.nombre,
      precio: servicio.precio
    })),
    variantes: appointment.variantes.map((variante) => ({
      _id: variante._id,
      nombre: variante.nombre
    })),
    productos: [],
    metodoPago,
    cita: appointment._id,
    descuentos: Array.isArray(appointment.descuentos) ? appointment.descuentos : [],
    fechaVenta: new Date().toISOString()
  };

  try {
    const authHeaders = buildAuthHeaders(token);

    const response = await apiClient.post('/ventas', ventaData, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      }
    });

    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.response?.data?.msg || error?.message || 'Error al registrar la venta';
    throw new Error(message);
  }
};
