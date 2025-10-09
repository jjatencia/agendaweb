/**
 * Utilidad para gestionar mensajes de WhatsApp
 */

export interface MessageTemplate {
  id: string;
  name: string;
  template: (clientName: string, time?: string, professionalName?: string) => string;
}

/**
 * Plantillas de mensajes predefinidas
 */
export const messageTemplates: MessageTemplate[] = [
  {
    id: 'cancelacion',
    name: 'Cliente anterior canceló',
    template: (clientName: string, time?: string, professionalName?: string) =>
      `Hola ${clientName}, soy ${professionalName || '[Tu nombre]'} de LBJ. El cliente que tenía cita antes que tú ha cancelado su visita. Si te viene bien, puedes venir antes${time ? ` (${time})` : ''} y te atiendo sin problema. ¿Te vendría bien?`
  },
  {
    id: 'retraso',
    name: 'Vamos con retraso',
    template: (clientName: string, time?: string, professionalName?: string) =>
      `Hola ${clientName}, soy ${professionalName || '[Tu nombre]'} de LBJ. Lamento informarte que voy con un poco de retraso${time ? ` (aproximadamente ${time})` : ''}. Disculpa las molestias y gracias por tu comprensión.`
  },
  {
    id: 'disponibilidad',
    name: 'Profesional disponible antes',
    template: (clientName: string, time?: string, professionalName?: string) =>
      `Hola ${clientName}, soy ${professionalName || '[Tu nombre]'} de LBJ. Tengo disponibilidad antes de tu cita${time ? ` (${time})` : ''}. Si quieres, puedo adelantarte la cita. ¿Te interesa?`
  }
];

/**
 * Formatea un número de teléfono español para WhatsApp
 * @param phone - Número de teléfono (puede incluir espacios, guiones, etc.)
 * @returns Número formateado con código de país (+34)
 */
export const formatPhoneForWhatsApp = (phone: string): string => {
  // Eliminar todo excepto dígitos
  const cleanPhone = phone.replace(/\D/g, '');

  // Si ya tiene código de país, devolverlo tal cual
  if (cleanPhone.startsWith('34') && cleanPhone.length === 11) {
    return cleanPhone;
  }

  // Si empieza con 0, quitarlo
  if (cleanPhone.startsWith('0')) {
    return '34' + cleanPhone.slice(1);
  }

  // Si es número español (9 dígitos), agregar código de país
  if (cleanPhone.length === 9) {
    return '34' + cleanPhone;
  }

  // Si ya tiene 34 al inicio pero sin más dígitos
  return cleanPhone;
};

/**
 * Genera un deep link de WhatsApp con mensaje pre-rellenado
 * @param phone - Número de teléfono
 * @param message - Mensaje pre-rellenado
 * @returns URL de WhatsApp
 */
export const generateWhatsAppLink = (phone: string, message: string): string => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);

  // Usar wa.me que funciona en web y mobile
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

/**
 * Abre WhatsApp con un mensaje pre-rellenado
 * @param phone - Número de teléfono
 * @param message - Mensaje pre-rellenado
 */
export const openWhatsApp = (phone: string, message: string): void => {
  const link = generateWhatsAppLink(phone, message);
  window.open(link, '_blank');
};
