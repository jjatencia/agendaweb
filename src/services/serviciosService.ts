import { apiClient } from './api';
import { Servicio, Variante } from '../types';

export interface ServiciosResponse {
  ok: boolean;
  servicios: Servicio[];
}

export interface VariantesResponse {
  ok: boolean;
  variantes: Variante[];
}

export class ServiciosService {
  static async getServicios(empresa: string): Promise<Servicio[]> {
    try {
      const response = await apiClient.post<ServiciosResponse>('/servicios/empresa', { empresa });
      return response.data.servicios || [];
    } catch (error) {
      console.error('Error fetching servicios:', error);
      throw error;
    }
  }

  static async getVariantes(empresa: string): Promise<Variante[]> {
    try {
      const response = await apiClient.post<VariantesResponse>('/variantes/empresa', { empresa });

      // Mapear las variantes para convertir 'valor' a 'precio'
      const variantesNormalizadas = (response.data.variantes || []).map(variante => ({
        _id: variante._id,
        nombre: variante.nombre,
        precio: (variante as any).valor || 0 // Mapear 'valor' a 'precio'
      }));

      return variantesNormalizadas;
    } catch (error) {
      console.error('Error fetching variantes:', error);
      throw error;
    }
  }

  /**
   * Obtiene las variantes completas con todos los campos necesarios para facturación
   */
  static async getVariantesCompletas(empresa: string): Promise<any[]> {
    try {
      const response = await apiClient.post<VariantesResponse>('/variantes/empresa', { empresa });

      // Devolver las variantes tal como vienen de la API, sin normalizar
      // Esto incluye todos los campos: _id, empresa, nombre, descripcion, tiempo, valor, valorType, servicios, productos, deleted
      return response.data.variantes || [];
    } catch (error) {
      console.error('Error fetching variantes completas:', error);
      throw error;
    }
  }

  // Método auxiliar para calcular el precio total con variantes
  static calcularPrecioTotal(servicio: Servicio, variantes: Variante[]): number {
    let precioTotal = servicio.precio;

    // Sumar precio de variantes si lo tienen
    variantes.forEach(variante => {
      precioTotal += variante.precio || 0;
    });

    return precioTotal;
  }
}