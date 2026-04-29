import { safeText } from "@/lib/insurance-utils";

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function primitive(value: unknown): boolean {
  return value === null || ["string", "number", "boolean", "undefined"].includes(typeof value);
}

function formatLabel(label: string): string {
  const normalized = label.replace(/_/g, " ").trim().toLowerCase();
  const labels: Record<string, string> = {
    ambito: "Ámbito",
    alcance: "Alcance",
    categoria: "Categoría",
    categorias_afectadas: "Categorías afectadas",
    categorias_afectadas_ids: "Categorías afectadas",
    coberturas_relacionadas_ids: "Coberturas relacionadas",
    compania: "Compañía",
    descripcion: "Descripción",
    direccion: "Dirección",
    email_contacto: "Email de contacto",
    excluye_pais_residencia: "Excluye país de residencia",
    excepciones: "Excepciones",
    exclusiones: "Exclusiones",
    fuente: "Fuente",
    inclusion: "Estado",
    medida: "Medida",
    nombre_comercial: "Nombre comercial",
    nombre_legal: "Nombre legal",
    notas: "Notas",
    pais_origen: "País de origen",
    paises_excluidos: "Países excluidos",
    paises_incluidos: "Países incluidos",
    plan: "Plan",
    regiones_excluidas: "Regiones excluidas",
    regiones_incluidas: "Regiones incluidas",
    sitio_web: "Sitio web",
    telefono_contacto: "Teléfono de contacto",
    tipo_cobertura: "Tipo de cobertura",
    tipo_valor: "Tipo de valor",
    upgrades_ids: "Upgrades relacionados",
    valor: "Valor",
  };

  if (labels[label] || labels[normalized]) return labels[label] || labels[normalized];

  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ValueView({ value }: { value: unknown }) {
  if (isEmpty(value)) return <span className="text-slate-400">-</span>;

  if (typeof value === "boolean") {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
        {value ? "Si" : "No"}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400">-</span>;
    if (value.every(primitive)) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item, index) => (
            <span key={index} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
              {safeText(item)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li key={index} className="rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-700">
            <ValueView value={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    return (
      <pre className="max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-relaxed text-slate-100">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <span className="break-words text-slate-800">{safeText(value)}</span>;
}

export function DetailGrid({ entries }: { entries: Array<[string, unknown]> }) {
  const visibleEntries = entries.filter(([, value]) => !isEmpty(value));

  if (visibleEntries.length === 0) {
    return <p className="text-sm text-slate-500">No hay datos adicionales.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {visibleEntries.map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-md border border-slate-200 bg-white p-3">
          <p className="mb-1 text-xs font-semibold text-slate-500">{formatLabel(label)}</p>
          <div className="text-sm">
            <ValueView value={value} />
          </div>
        </div>
      ))}
    </div>
  );
}
