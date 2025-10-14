/**
 * Utilidad para gestionar mensajes de WhatsApp
 */

export type Language = 'es' | 'ca';

export interface MessageTemplate {
  id: string;
  name: {
    es: string;
    ca: string;
  };
  template: {
    es: (clientName: string, time?: string, professionalName?: string) => string;
    ca: (clientName: string, time?: string, professionalName?: string) => string;
  };
}

/**
 * Plantillas de mensajes predefinidas en español y catalán
 */
export const messageTemplates: MessageTemplate[] = [
  {
    id: 'cancelacion',
    name: {
      es: 'Cliente anterior canceló',
      ca: 'Client anterior ha cancel·lat'
    },
    template: {
      es: (clientName: string, time?: string, professionalName?: string) =>
        `Hola ${clientName}, soy ${professionalName || '[Tu nombre]'} de LBJ. El cliente que tenía cita antes que tú ha cancelado su visita. Si te viene bien, puedes venir antes${time ? ` (${time})` : ''} y te atiendo sin problema. ¿Te vendría bien?`,
      ca: (clientName: string, time?: string, professionalName?: string) =>
        `Hola ${clientName}, sóc ${professionalName || '[El teu nom]'} de LBJ. El client que tenia cita abans que tu ha cancel·lat la seva visita. Si et va bé, pots venir abans${time ? ` (${time})` : ''} i t'atenc sense problema. Et vindria bé?`
    }
  },
  {
    id: 'retraso',
    name: {
      es: 'Vamos con retraso',
      ca: 'Anem amb retard'
    },
    template: {
      es: (clientName: string, time?: string, professionalName?: string) =>
        `Hola ${clientName}, soy ${professionalName || '[Tu nombre]'} de LBJ. Lamento informarte que voy con un poco de retraso${time ? ` (aproximadamente ${time})` : ''}. Disculpa las molestias y gracias por tu comprensión.`,
      ca: (clientName: string, time?: string, professionalName?: string) =>
        `Hola ${clientName}, sóc ${professionalName || '[El teu nom]'} de LBJ. Lamento informar-te que vaig amb una mica de retard${time ? ` (aproximadament ${time})` : ''}. Disculpa les molèsties i gràcies per la teva comprensió.`
    }
  },
  {
    id: 'disponibilidad',
    name: {
      es: 'Profesional disponible antes',
      ca: 'Professional disponible abans'
    },
    template: {
      es: (clientName: string, time?: string, professionalName?: string) =>
        `Hola ${clientName}, soy ${professionalName || '[Tu nombre]'} de LBJ. Tengo disponibilidad antes de tu cita${time ? ` (${time})` : ''}. Si quieres, puedo adelantarte la cita. ¿Te interesa?`,
      ca: (clientName: string, time?: string, professionalName?: string) =>
        `Hola ${clientName}, sóc ${professionalName || '[El teu nom]'} de LBJ. Tinc disponibilitat abans de la teva cita${time ? ` (${time})` : ''}. Si vols, puc avançar-te la cita. T'interessa?`
    }
  },
  {
    id: 'no-show',
    name: {
      es: 'Cliente no ha llegado',
      ca: 'Client no ha arribat'
    },
    template: {
      es: (clientName: string, time?: string, professionalName?: string) =>
        `Hola ${clientName}, soy ${professionalName || '[Tu nombre]'} de LBJ. Tenías cita${time ? ` a las ${time}` : ''} y no te veo por aquí. ¿Estás de camino? ¿Cuánto tardarás en llegar?`,
      ca: (clientName: string, time?: string, professionalName?: string) =>
        `Hola ${clientName}, sóc ${professionalName || '[El teu nom]'} de LBJ. Tenies cita${time ? ` a les ${time}` : ''} i no et veig per aquí. Estàs de camí? Quant trigaràs a arribar?`
    }
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
 * @param useShortcut - Usar Atajo de iOS para auto-envío (solo iOS)
 * @returns URL de WhatsApp o del Atajo
 */
export const generateWhatsAppLink = (phone: string, message: string, useShortcut: boolean = false): string => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);

  // Detectar si es iOS
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (useShortcut && isIOS) {
    // Usar Atajo de iOS para auto-envío
    // El usuario debe tener instalado un Atajo llamado "EnviarWhatsAppLBJ"
    // que reciba "phone" y "message" como parámetros
    // Usar "|||" como separador (más visible y menos propenso a errores)
    return `shortcuts://run-shortcut?name=EnviarWhatsAppLBJ&input=text&text=${formattedPhone}|||${encodedMessage}`;
  }

  // Fallback: usar wa.me que funciona en web y mobile
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
