import { Check, X } from "lucide-react";
import SourceBadge from "@/components/SourceBadge";
import { DetailGrid } from "@/components/ValueView";
import { asArray, displayValue, getCoverageId, getProductName, isIncluded, safeText } from "@/lib/insurance-utils";
import { Cobertura, InsuranceProduct } from "@/lib/types";
import type { ReactNode } from "react";

interface ResumeTabProps {
  product: InsuranceProduct;
}

type CoverageDefinition = {
  label: string;
  patterns: string[];
  fallbackPatterns?: string[];
};

const primaryCoverageDefinitions: CoverageDefinition[] = [
  {
    label: "Asistencia médica",
    patterns: ["tope maximo global medico", "monto maximo global medico"],
    fallbackPatterns: ["asistencia medica por enfermedad", "medica enfermedad no preexistente"],
  },
  {
    label: "Equipaje",
    patterns: ["equipaje protegido por demora", "perdida de equipaje", "extravio de equipaje", "localizacion de equipaje", "equipaje"],
  },
  {
    label: "Vuelo demorado o cancelado",
    patterns: ["vuelo demorado o cancelado", "vuelo cancelado", "demora de vuelo", "reprogramacion de vuelo"],
  },
  {
    label: "Preexistencias",
    patterns: ["preexistencias", "enfermedades preexistentes"],
  },
  {
    label: "Medicamentos",
    patterns: ["medicamentos ambulatorios", "medicamentos por hospitalizacion", "medicamentos"],
  },
  {
    label: "Deportes",
    patterns: ["deporte amateur", "asistencia medica deportiva", "deportes de riesgo", "deportes"],
  },
];

function normalize(value: unknown): string {
  return safeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function findPrimaryCoverage(coverages: Cobertura[], definition: CoverageDefinition): Cobertura | null {
  const primaryCoverage = findCoverageByPatterns(coverages, definition.patterns);
  if (!primaryCoverage || isIncluded(primaryCoverage.inclusion) || !definition.fallbackPatterns) {
    return primaryCoverage;
  }

  return findIncludedCoverageByPatterns(coverages, definition.fallbackPatterns) || primaryCoverage;
}

function findCoverageByPatterns(coverages: Cobertura[], patterns: string[]): Cobertura | null {
  for (const pattern of patterns) {
    const normalizedPattern = normalize(pattern);
    const match = coverages.find((coverage) => {
      const haystack = [
        getCoverageId(coverage),
        coverage.nombre,
        coverage.categoria,
        coverage.tipo_cobertura || coverage.tipo,
        coverage.descripcion,
        coverage.alcance,
      ]
        .map(normalize)
        .join(" ");

      return haystack.includes(normalizedPattern);
    });

    if (match) return match;
  }

  return null;
}

function findIncludedCoverageByPatterns(coverages: Cobertura[], patterns: string[]): Cobertura | null {
  for (const pattern of patterns) {
    const normalizedPattern = normalize(pattern);
    const match = coverages.find((coverage) => {
      if (!isIncluded(coverage.inclusion)) return false;

      const haystack = [
        getCoverageId(coverage),
        coverage.nombre,
        coverage.categoria,
        coverage.tipo_cobertura || coverage.tipo,
        coverage.descripcion,
        coverage.alcance,
      ]
        .map(normalize)
        .join(" ");

      return haystack.includes(normalizedPattern);
    });

    if (match) return match;
  }

  return null;
}

function coverageDisplayValue(coverage: Cobertura | null): string {
  if (!coverage || !isIncluded(coverage.inclusion)) return "No incluido";

  const value = displayValue(coverage);
  return value === "Incluido sin monto" ? "Incluido" : value;
}

function Section({
  title,
  description,
  tone,
  children,
}: {
  title: string;
  description: string;
  tone: "blue" | "green" | "purple";
  children: ReactNode;
}) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    purple: "border-purple-200 bg-purple-50 text-purple-900",
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className={`border-b px-4 py-3 ${tones[tone]}`}>
        <h3 className="text-base font-bold">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function ResumeTab({ product }: ResumeTabProps) {
  const territorial = product.cobertura_territorial || {};
  const coverages = asArray(product.coberturas) as Cobertura[];
  const primaryCoverages = primaryCoverageDefinitions.map((definition) => {
    const coverage = findPrimaryCoverage(coverages, definition);
    const included = Boolean(coverage && isIncluded(coverage.inclusion));

    return {
      ...definition,
      coverage,
      included,
      value: coverageDisplayValue(coverage),
    };
  });

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold text-emerald-700">Coberturas principales</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">{getProductName(product)}</h3>
            <p className="mt-1 text-sm text-slate-600">Resumen de las prestaciones más relevantes del plan.</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {primaryCoverages.map((item) => {
              const Icon = item.included ? Check : X;

              return (
                <div key={item.label} className="flex min-w-0 items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${item.included ? "text-emerald-600" : "text-red-500"}`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="break-words text-xs text-slate-600">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Section title="Cobertura territorial" description="Ámbito regional y restricciones territoriales." tone="green">
        <DetailGrid
          entries={[
            ["ambito", territorial.ambito || territorial.alcance],
            ["paises_incluidos", territorial.paises_incluidos],
            ["regiones_incluidas", territorial.regiones_incluidas],
            ["paises_excluidos", territorial.paises_excluidos],
            ["regiones_excluidas", territorial.regiones_excluidas],
            ["excluye_pais_residencia", territorial.excluye_pais_residencia],
            ["descripcion", territorial.descripcion],
            ["notas", territorial.notas],
          ]}
        />
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <span className="font-medium">Fuente</span>
          <SourceBadge fuente={territorial.fuente} />
        </div>
      </Section>
    </div>
  );
}
