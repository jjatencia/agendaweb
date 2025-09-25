import { Appointment } from '../types';
import { PromocionesService } from './promocionesService';
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
    nombre: string;
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

// Función para calcular descuentos basado en promociones
const calcularDescuentoPromociones = async (appointment: Appointment): Promise<{ importeConDescuento: number; descuentoTotal: number }> => {
  if (!appointment.promocion || appointment.promocion.length === 0) {
    return {
      importeConDescuento: appointment.importe,
      descuentoTotal: 0
    };
  }

  try {
    // Obtener todas las promociones de la empresa
    const promocionesEmpresa = await PromocionesService.getPromocionesEmpresa(appointment.empresa);

    // Filtrar solo las promociones aplicadas a esta cita
    const promocionesAplicadas = promocionesEmpresa.filter(promocion =>
      appointment.promocion.includes(promocion._id)
    );

    let descuentoTotal = 0;

    // Calcular descuento total
    promocionesAplicadas.forEach(promocion => {
      // Solo aplicar descuentos si la promoción está activa y es de tipo descuento para servicios
      if (promocion.activo && promocion.tipo === 'descuento' && promocion.destino === 'servicio') {
        if (promocion.porcentaje !== null && promocion.porcentaje !== undefined) {
          // Descuento por porcentaje
          descuentoTotal += appointment.importe * (promocion.porcentaje / 100);
        } else if (promocion.cifra !== undefined && promocion.cifra > 0) {
          // Descuento por cantidad fija (en centavos, convertir a euros)
          descuentoTotal += promocion.cifra / 100;
        }
      }
    });

    const importeConDescuento = Math.max(0, appointment.importe - descuentoTotal);

    if ((import.meta as any).env?.DEV) {
     
    }

    return {
      importeConDescuento,
      descuentoTotal
    };
  } catch (error) {
    console.error('Error calculando descuentos:', error);
    // En caso de error, devolver el importe original
    return {
      importeConDescuento: appointment.importe,
      descuentoTotal: 0
    };
  }
};

export const createVenta = async (appointment: Appointment, metodoPago: string): Promise<any> => {
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
      const todasLasVariantes = await ServiciosService.getVariantes(appointment.empresa);
      variantesCompletas = appointment.variantes.map(varianteAppointment => {
        const varianteCompleta = todasLasVariantes.find(v =>
          v._id === varianteAppointment._id ||
          v.nombre === varianteAppointment.nombre
        );

        if (varianteCompleta) {
          // Asegurar que el campo precio se mapee a valor y valorType
          return {
            ...varianteCompleta,
            valor: varianteCompleta.precio || 0,
            valorType: 'money'
          };
        }

        // Si no se encuentra, usar el objeto original con los campos requeridos
        return {
          ...varianteAppointment,
          empresa: appointment.empresa,
          descripcion: varianteAppointment.descripcion || '',
          tiempo: varianteAppointment.tiempo || 0,
          valor: varianteAppointment.precio || 0,
          valorType: 'money',
          servicios: varianteAppointment.servicios || [],
          productos: varianteAppointment.productos || [],
          deleted: varianteAppointment.deleted || false
        };
      });
    } catch (error) {
      console.warn('Error obteniendo variantes completas, usando las del appointment:', error);
      // En caso de error, usar las variantes del appointment con campos mínimos requeridos
      variantesCompletas = appointment.variantes.map(variante => ({
        ...variante,
        empresa: appointment.empresa,
        descripcion: variante.descripcion || '',
        tiempo: variante.tiempo || 0,
        valor: variante.precio || 0,
        valorType: 'money',
        servicios: variante.servicios || [],
        productos: variante.productos || [],
        deleted: variante.deleted || false
      }));
    }
  }

  // Calcular descuentos por promociones
  const { importeConDescuento, descuentoTotal } = await calcularDescuentoPromociones(appointment);

  // Preparar los datos como los espera la API (solo IDs, igual que la app que funciona)
  const ventaData: any = {
    empresa: appointment.empresa,
    usuario: appointment.usuario._id,
    sucursal: appointment.sucursal._id,
    profesional: appointment.profesional._id,
    fechaCita: appointment.fecha,
    importe: importeConDescuento, // Usar el importe con descuento aplicado
    promocion: appointment.promocion,
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
    cita: appointment._id,
    // Agregar información de descuentos si los hay
    ...(descuentoTotal > 0 && {
      descuentos: [{
        tipo: 'promocion',
        valor: descuentoTotal,
        descripcion: 'Descuento por promociones aplicadas'
      }]
    })
  };

  // Debug info (non-sensitive only)
  if ((import.meta as any).env?.DEV) {

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
   
    }

    if (!response.ok) {
      if ((import.meta as any).env?.DEV) {
        
      }
      throw new Error(`HTTP ${response.status}: Error en la venta`);
    }

    const responseData = await response.json();

    if ((import.meta as any).env?.DEV) {
      
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
