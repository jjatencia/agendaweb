import React, { useState, useEffect, useCallback } from 'react';
import { Appointment } from '../types';
import {
  cargarChecklist,
  guardarChecklist,
  resetearChecks,
  ChecklistData,
  ChecklistPaso,
} from '../services/checklistService';

interface ChecklistCardProps {
  appointment: Appointment;
  onClose?: () => void;
}

// --- Definición de la estructura del checklist ---

const TIPOS_CORTE = [
  'Personalizado',
  'Fade',
  'Taper',
  'Buzzcut',
  'Crew Cut',
  'Caesar',
  'Undercut',
  'Mohicano',
  'Faux Hawk',
  'Mullet',
  'Edgar',
  'French Crop',
  'Textured Crop',
  'Wolf Cut',
  'Two Block',
  'Line Up',
] as const;

// Presets: al seleccionar un tipo de corte, se precargan los pasos
// Cada preset define los valores que se auto-rellenan en el checklist
interface Preset {
  laterales?: { valor: string; subValor?: string; subValor2?: string };
  direccion?: { valores: string[]; subValor?: string };
}

const PRESETS: Record<string, Preset> = {
  'Fade':         { laterales: { valor: 'Máquina', subValor: 'Degradado' } },
  'Taper':        { laterales: { valor: 'Máquina', subValor: 'Degradado', subValor2: 'Bajo' } },
  'Buzzcut':      { laterales: { valor: 'Máquina' } },
  'Crew Cut':     { laterales: { valor: 'Máquina' }, direccion: { valores: ['Hacia delante'], subValor: 'Texturizado' } },
  'Caesar':       { laterales: { valor: 'Máquina' }, direccion: { valores: ['Hacia delante'] } },
  'Undercut':     { laterales: { valor: 'Máquina' } },
  'Mohicano':     { laterales: { valor: 'Máquina', subValor: 'Degradado' }, direccion: { valores: ['Arriba'], subValor: 'Texturizado' } },
  'Faux Hawk':    { laterales: { valor: 'Máquina', subValor: 'Degradado' }, direccion: { valores: ['Arriba'], subValor: 'Texturizado' } },
  'Mullet':       { laterales: { valor: 'Tijera' } },
  'Edgar':        { laterales: { valor: 'Máquina', subValor: 'Degradado' }, direccion: { valores: ['Hacia delante'] } },
  'French Crop':  { laterales: { valor: 'Máquina', subValor: 'Degradado' }, direccion: { valores: ['Hacia delante'], subValor: 'Texturizado' } },
  'Textured Crop':{ laterales: { valor: 'Máquina', subValor: 'Degradado' }, direccion: { valores: ['Hacia delante'], subValor: 'Texturizado' } },
  'Wolf Cut':     { laterales: { valor: 'Tijera' }, direccion: { valores: [], subValor: 'Texturizado' } },
  'Two Block':    { laterales: { valor: 'Máquina' } },
  'Line Up':      { laterales: { valor: 'Máquina', subValor: 'Degradado' } },
};

interface PasoDef {
  id: string;
  label: string;
  opciones?: string[];
  multiSelect?: boolean;
  subNivel?: string[];
  subOpciones?: Record<string, string[]>;
  subSubOpciones?: Record<string, string[]>;
}

const PASOS_CHECKLIST: PasoDef[] = [
  {
    id: 'laterales',
    label: 'Laterales',
    opciones: ['Máquina', 'Tijera'],
    subOpciones: {
      'Máquina': ['3', '2', '1', '0.5', 'Degradado'],
      'Tijera': ['Tapada', 'Destapada'],
    },
    subSubOpciones: {
      'Degradado': ['Alto', 'Medio', 'Bajo'],
      'Destapada': ['Nuca marcada', 'Nuca en disminución'],
    },
  },
  {
    id: 'finales',
    label: 'He rematado los contornos',
  },
  {
    id: 'direccion',
    label: 'Dirección peinado',
    opciones: ['Derecha', 'Izquierda', 'Hacia atrás', 'Hacia delante', 'Arriba', 'Pompadour', 'Slick Back', 'Side Part', 'Comb Over', 'Curtains', 'Quiff', 'Texturizado', 'Peinado'],
    multiSelect: true,
  },
  {
    id: 'peinado',
    label: 'He peinado al cliente',
  },
  {
    id: 'producto',
    label: 'Producto de finish',
    opciones: ['Sí', 'No'],
    subOpciones: {
      'Sí': ['Mate', 'Brillo'],
    },
  },
];

// --- Componente de un paso individual ---
const PasoItem: React.FC<{
  def: PasoDef;
  paso: ChecklistPaso;
  onChange: (paso: ChecklistPaso) => void;
}> = ({ def, paso, onChange }) => {
  const toggle = () => onChange({ ...paso, checked: !paso.checked });

  const setValor = (v: string) => {
    if (def.multiSelect) {
      const current = paso.valores || [];
      const updated = current.includes(v)
        ? current.filter((x) => x !== v)
        : [...current, v];
      onChange({ ...paso, valores: updated });
    } else {
      onChange({ ...paso, valor: v, subValor: undefined, subValor2: undefined });
    }
  };
  const setSubValor = (v: string) => {
    onChange({ ...paso, subValor: v, subValor2: undefined });
  };
  const setSubValor2 = (v: string) => {
    onChange({ ...paso, subValor2: v });
  };

  const tieneSeleccionMulti = def.multiSelect && (paso.valores || []).length > 0;

  const subOps = def.subOpciones?.[paso.valor || ''];
  const subSubOps = def.subSubOpciones?.[paso.subValor || ''];

  return (
    <div className="rounded-2xl bg-gray-50 px-3 py-3 md:px-4 md:py-4 space-y-2 md:space-y-3">
      {/* Check + label */}
      <button
        onClick={toggle}
        className="flex items-center gap-3 w-full text-left"
      >
        <div
          className={`w-6 h-6 md:w-7 md:h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${
            paso.checked
              ? 'bg-[var(--exora-primary)] border-[var(--exora-primary)]'
              : 'border-gray-300 bg-white'
          }`}
        >
          {paso.checked && (
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          )}
        </div>
        <span className={`text-sm md:text-base font-semibold ${paso.checked ? 'text-gray-900' : 'text-gray-500'}`}>
          {def.label}
        </span>
        {/* Resumen inline de lo seleccionado */}
        {paso.checked && (paso.valor || (paso.valores && paso.valores.length > 0)) && (
          <span className="text-xs md:text-sm text-gray-400 ml-auto">
            {def.multiSelect
              ? [(paso.valores || []).join(' + '), paso.subValor].filter(Boolean).join(' → ')
              : [paso.valor, paso.subValor, paso.subValor2].filter(Boolean).join(' → ')
            }
          </span>
        )}
      </button>

      {/* Opciones nivel 1 */}
      {paso.checked && def.opciones && (
        <div className="flex flex-wrap gap-2 ml-9 md:ml-10">
          {def.opciones.map((op) => (
            <button
              key={op}
              onClick={() => setValor(op)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
                (def.multiSelect ? (paso.valores || []).includes(op) : paso.valor === op)
                  ? 'bg-[var(--exora-primary)] text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      )}

      {/* Sub-nivel para multiSelect (ej: Texturizado / Peinado) */}
      {paso.checked && tieneSeleccionMulti && def.subNivel && (
        <div className="ml-9 md:ml-10 mt-1 rounded-xl bg-white border border-gray-200 px-3 py-2 md:px-4 md:py-3 space-y-1.5">
          <span className="text-[11px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">Acabado</span>
          <div className="flex flex-wrap gap-2">
            {def.subNivel.map((op) => (
              <button
                key={op}
                onClick={() => setSubValor(op)}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
                  paso.subValor === op
                    ? 'bg-[var(--exora-primary)] text-white'
                    : 'bg-gray-100 border border-gray-200 text-gray-600'
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opciones nivel 2 (sub) */}
      {paso.checked && subOps && (
        <div className="flex flex-wrap gap-2 ml-9 md:ml-10">
          {subOps.map((op) => (
            <button
              key={op}
              onClick={() => setSubValor(op)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
                paso.subValor === op
                  ? 'bg-[var(--exora-primary)] text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      )}

      {/* Opciones nivel 3 (sub-sub) */}
      {paso.checked && subSubOps && (
        <div className="flex flex-wrap gap-2 ml-9 md:ml-10">
          {subSubOps.map((op) => (
            <button
              key={op}
              onClick={() => setSubValor2(op)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
                paso.subValor2 === op
                  ? 'bg-[var(--exora-primary)] text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Componente principal ---
const ChecklistCard: React.FC<ChecklistCardProps> = ({ appointment, onClose }) => {
  const clienteId = appointment.usuario._id;
  const clienteNombre = `${appointment.usuario.nombre} ${appointment.usuario.apellidos || ''}`.trim();

  const [tipoCorte, setTipoCorte] = useState<string>('Personalizado');
  const [pasos, setPasos] = useState<Record<string, ChecklistPaso>>({});
  const [notas, setNotas] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [tieneDatosPrevios, setTieneDatosPrevios] = useState(false);

  // Inicializar pasos vacíos
  const crearPasosVacios = useCallback((): Record<string, ChecklistPaso> => {
    const result: Record<string, ChecklistPaso> = {};
    for (const def of PASOS_CHECKLIST) {
      result[def.id] = { id: def.id, checked: false };
    }
    return result;
  }, []);

  // Aplicar preset de un tipo de corte sobre los pasos actuales
  const aplicarPreset = useCallback((tipo: string, pasosActuales: Record<string, ChecklistPaso>): Record<string, ChecklistPaso> => {
    const preset = PRESETS[tipo];
    if (!preset) return pasosActuales;

    const nuevos = { ...pasosActuales };

    if (preset.laterales) {
      nuevos.laterales = {
        ...nuevos.laterales,
        id: 'laterales',
        checked: true,
        valor: preset.laterales.valor,
        subValor: preset.laterales.subValor,
        subValor2: preset.laterales.subValor2,
      };
    }

    if (preset.direccion) {
      nuevos.direccion = {
        ...nuevos.direccion,
        id: 'direccion',
        checked: true,
        valores: preset.direccion.valores,
        subValor: preset.direccion.subValor,
      };
    }

    return nuevos;
  }, []);

  // Cargar datos del cliente al montar o cambiar de cita
  useEffect(() => {
    const saved = cargarChecklist(clienteId);
    if (saved) {
      setTieneDatosPrevios(true);
      const reseteado = resetearChecks(saved);
      setTipoCorte(reseteado.tipoCorte || 'Personalizado');
      setPasos(reseteado.pasos);
      setNotas(reseteado.notas || '');
    } else {
      setTieneDatosPrevios(false);
      setTipoCorte('Personalizado');
      setPasos(crearPasosVacios());
      setNotas('');
    }
    setGuardado(false);
  }, [clienteId, crearPasosVacios]);

  // Cuando cambia el tipo de corte, aplicar preset
  const handleTipoCorteChange = (tipo: string) => {
    setTipoCorte(tipo);
    setGuardado(false);

    if (tipo === 'Personalizado') {
      // Resetear a vacío
      setPasos(crearPasosVacios());
    } else {
      // Partir de vacío y aplicar preset
      const pasosBase = crearPasosVacios();
      setPasos(aplicarPreset(tipo, pasosBase));
    }
  };

  const handlePasoChange = (paso: ChecklistPaso) => {
    setPasos((prev) => ({ ...prev, [paso.id]: paso }));
    setGuardado(false);
  };

  const handleGuardar = () => {
    const data: ChecklistData = {
      tipoCorte,
      pasos,
      notas,
      updatedAt: new Date().toISOString(),
    };
    guardarChecklist(clienteId, data);
    setGuardado(true);
  };

  const todosChecked = PASOS_CHECKLIST.every((def) => pasos[def.id]?.checked);

  return (
    <div
      className="checklist-card-size"
      style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        boxShadow: '0 22px 45px rgba(85, 91, 246, 0.15)',
        height: '100%',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <style>{`
        .checklist-card-size {
          width: min(100%, 560px);
          max-width: 560px;
          max-height: min(680px, calc(100vh - 160px));
          min-height: min(420px, calc(100vh - 160px));
        }
        @media (min-width: 768px) {
          .checklist-card-size {
            width: min(100%, 640px);
            max-width: 640px;
            max-height: min(900px, calc(100vh - 100px));
            min-height: min(520px, calc(100vh - 100px));
          }
        }
      `}</style>
      <div className="p-4 md:p-6 h-full flex flex-col gap-3 md:gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 text-center space-y-1">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">{clienteNombre}</h2>
          {tieneDatosPrevios && (
            <span className="text-xs md:text-sm bg-blue-50 text-blue-600 px-3 py-1 md:px-4 md:py-1.5 rounded-full font-medium">
              Datos del corte anterior cargados
            </span>
          )}
        </div>

        {/* Tipo de corte */}
        <div className="flex-shrink-0">
          <label className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
            Tipo de corte
          </label>
          <div className="relative">
            <div
              className="flex gap-2 overflow-x-auto md:overflow-x-visible md:flex-wrap pb-1 scrollbar-hide snap-x snap-mandatory md:snap-none"
              style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {TIPOS_CORTE.map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => handleTipoCorteChange(tipo)}
                  className={`flex-shrink-0 md:flex-shrink snap-start md:snap-align-none px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
                    tipoCorte === tipo
                      ? 'bg-[var(--exora-primary)] text-white'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
            {/* Right fade hint - hidden on md+ where items wrap */}
            <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
          </div>
        </div>

        {/* Pasos del checklist */}
        <div className="flex-1 overflow-y-auto space-y-2 md:space-y-3 pr-1">
          <label className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
            Checklist
          </label>
          {PASOS_CHECKLIST.map((def) => (
            <PasoItem
              key={def.id}
              def={def}
              paso={pasos[def.id] || { id: def.id, checked: false }}
              onChange={handlePasoChange}
            />
          ))}

          {/* Notas */}
          <div className="rounded-2xl bg-gray-50 px-3 py-3 md:px-4 md:py-4">
            <label className="text-xs md:text-sm font-semibold text-gray-500 block mb-1">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => {
                setNotas(e.target.value);
                setGuardado(false);
              }}
              placeholder="Observaciones del corte..."
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 md:px-4 md:py-3 text-sm md:text-base text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--exora-primary)] focus:border-transparent"
              rows={2}
            />
          </div>
        </div>

        {/* Footer: botón guardar + cerrar */}
        <div className="flex-shrink-0 pt-2 md:pt-3 space-y-2">
          <button
            onClick={handleGuardar}
            className={`w-full py-3 md:py-3.5 rounded-xl font-semibold text-sm md:text-base transition-all ${
              guardado
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : todosChecked
                  ? 'bg-[var(--exora-primary)] text-white hover:opacity-90'
                  : 'bg-gray-200 text-gray-600'
            }`}
          >
            {guardado ? 'Guardado' : 'Guardar checklist'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-2 md:py-3 rounded-xl font-medium text-sm md:text-base text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistCard;
