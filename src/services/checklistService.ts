// Servicio de persistencia de checklists por cliente
// MVP: localStorage. Se puede migrar a API sin cambiar la interfaz.

export interface ChecklistPaso {
  id: string;
  checked: boolean;
  valor?: string;        // Valor seleccionado (ej: "maquina", "2", "alto")
  valores?: string[];    // Múltiples valores (para multiSelect)
  subValor?: string;     // Sub-valor condicional
  subValor2?: string;    // Segundo nivel condicional
}

export interface ChecklistData {
  tipoCorte?: string;              // Tipo de corte predefinido (taper, buzzcut, etc.)
  pasos: Record<string, ChecklistPaso>;
  notas: string;
  updatedAt: string;
  profesionalId?: string;          // Quién lo rellenó por última vez
}

const STORAGE_PREFIX = 'exora_checklist_';

/**
 * Carga el checklist guardado de un cliente.
 * Devuelve null si no hay datos previos.
 */
export function cargarChecklist(clienteId: string): ChecklistData | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${clienteId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ChecklistData;
  } catch {
    return null;
  }
}

/**
 * Guarda el checklist de un cliente.
 */
export function guardarChecklist(clienteId: string, data: ChecklistData): void {
  data.updatedAt = new Date().toISOString();
  localStorage.setItem(`${STORAGE_PREFIX}${clienteId}`, JSON.stringify(data));
}

/**
 * Resetea todos los checks a false (para nueva sesión),
 * manteniendo los valores seleccionados de la última vez.
 */
export function resetearChecks(data: ChecklistData): ChecklistData {
  const pasosReseteados: Record<string, ChecklistPaso> = {};
  for (const [key, paso] of Object.entries(data.pasos)) {
    pasosReseteados[key] = { ...paso, checked: false };
  }
  return { ...data, pasos: pasosReseteados };
}
