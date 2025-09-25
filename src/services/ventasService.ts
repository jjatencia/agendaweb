import { Appointment } from '../types';
import { ServiciosService } from './serviciosService';

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
    empresa: string;
    nombre: string;
    descripcion: string;
    tiempo: number;
    valor: number;
    valorType: string;
    servicios: string[];
    productos: any[];
    deleted: boolean;
  }>;
  productos: any[];
  metodoPago: string;
  cita: string;
  descuentos: any[];
  fechaVenta: string;
}

// Token validation helper
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? Date.now() >= payload.exp * 1000 : false;
  } catch {
    return true;
  }
};


export const createVenta = async (appointment: Appointment, metodoPago: string, importeFinal?: number): Promise<any> => {
  // Get token from localStorage
  const token = localStorage.getItem((import.meta as any).env?.VITE_TOKEN_STORAGE_KEY || 'exora_auth_token');

  if (!token) {
    throw new Error('No hay token de autenticación válido');
  }

  // Validate token
  if (isTokenExpired(token)) {
    throw new Error('Token de autenticación expirado. Por favor, inicia sesión nuevamente.');
  }

  // Obtener variantes completas de la API si existen variantes en el appointment
  let variantesCompletas = appointment.variantes || [];
  if (appointment.variantes && appointment.variantes.length > 0) {
    try {
      // Usar el nuevo método que devuelve variantes completas sin normalizar
      const todasLasVariantesCompletas = await ServiciosService.getVariantesCompletas(appointment.empresa);

      variantesCompletas = appointment.variantes.map(varianteAppointment => {
        // Buscar la variante completa en la respuesta de la API
        const varianteCompleta = todasLasVariantesCompletas.find(v =>
          v._id === varianteAppointment._id ||
          v.nombre === varianteAppointment.nombre
        );

        if (varianteCompleta) {
          // Devolver la variante tal como viene de la API (formato completo para facturación)
          // Asegurar que el valor esté en centavos como espera el sistema de facturación
          return {
            ...varianteCompleta,
            valor: varianteCompleta.valor || (varianteAppointment.precio ? varianteAppointment.precio * 100 : 0),
            valorType: varianteCompleta.valorType || 'money'
          };
        }

        // Si no se encuentra en la API, construir el objeto completo manualmente
        // Convertir precio a centavos para el valor (precio viene en euros)
        return {
          _id: varianteAppointment._id,
          empresa: appointment.empresa,
          nombre: varianteAppointment.nombre,
          descripcion: varianteAppointment.descripcion || '',
          tiempo: varianteAppointment.tiempo || 0,
          valor: (varianteAppointment.precio || 0) * 100, // Convertir a centavos
          valorType: 'money',
          servicios: varianteAppointment.servicios || [],
          productos: varianteAppointment.productos || [],
          deleted: varianteAppointment.deleted || false
        };
      });
    } catch (error) {
      console.warn('Error obteniendo variantes completas, usando las del appointment:', error);
      // En caso de error, construir las variantes con el formato completo requerido
      // Convertir precio a centavos para el valor
      variantesCompletas = appointment.variantes.map(variante => ({
        _id: variante._id,
        empresa: appointment.empresa,
        nombre: variante.nombre,
        descripcion: variante.descripcion || '',
        tiempo: variante.tiempo || 0,
        valor: (variante.precio || 0) * 100, // Convertir a centavos
        valorType: 'money',
        servicios: variante.servicios || [],
        productos: variante.productos || [],
        deleted: variante.deleted || false
      }));
    }
  }

  // Usar el importe final calculado si se proporciona, sino usar el original
  // El importe final ya incluye variantes y descuentos calculados por el frontend
  const importeParaVenta = importeFinal !== undefined ? importeFinal : appointment.importe;

  // Preparar los datos como los espera la API (solo IDs, igual que la app que funciona)
  const ventaData: any = {
    empresa: appointment.empresa,
    usuario: appointment.usuario._id,
    sucursal: appointment.sucursal._id,
    profesional: appointment.profesional._id,
    fechaCita: appointment.fecha,
    importe: importeParaVenta, // Usar el importe final calculado (ya incluye variantes y descuentos)
    promocion: [], // Enviar array vacío como en el admin - los descuentos ya están aplicados en el importe
    servicios: appointment.servicios.map(servicio => ({
      _id: servicio._id,
      variantes: servicio.variantes || [],
      nombre: servicio.nombre,
      duracion: servicio.duracion || "60",
      precio: servicio.precio,
      deleted: servicio.deleted || false
    })),
    variantes: variantesCompletas,
    metodoPago: metodoPago,
    productos: [],
    cita: appointment._id
  };

  // Debug info (non-sensitive only)
  if ((import.meta as any).env?.DEV) {
    console.log('=== DEBUG VENTA SERVICE ===');
    console.log('Variantes enviadas:', variantesCompletas.length);
    console.log('Ejemplo de variante:', variantesCompletas[0]);
    console.log('Importe final enviado:', importeParaVenta);
    console.log('Datos completos de venta:', ventaData);
  }

  try {

    const response = await fetch('https://api.exora.app/api/ventas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-token': token
      },
      body: JSON.stringify(ventaData)
    });

    if ((import.meta as any).env?.DEV) {
      console.log('Respuesta de venta exitosa:', response.status);
    }

    if (!response.ok) {
      if ((import.meta as any).env?.DEV) {
        console.error('Error HTTP en venta:', response.status, response.statusText);
      }
      throw new Error(`HTTP ${response.status}: Error en la venta`);
    }

    const responseData = await response.json();

    if ((import.meta as any).env?.DEV) {
      console.log('Venta registrada exitosamente:', responseData);
    }
    return responseData;
  } catch (error: any) {
    if ((import.meta as any).env?.DEV) {
      console.error('=== ERROR EN VENTA ===');
      console.error('Error message:', error?.message);
    }

    const message = error?.response?.data?.message || error?.response?.data?.msg || error?.message || 'Error al registrar la venta';
    throw new Error(message);
  }
};
