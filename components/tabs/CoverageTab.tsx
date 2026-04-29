"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import ExpandableRow from "@/components/ExpandableRow";
import InclusionBadge from "@/components/InclusionBadge";
import SourceBadge from "@/components/SourceBadge";
import { DetailGrid } from "@/components/ValueView";
import {
  asArray,
  displayValue,
  extractCoverageAmount,
  getCoverageId,
  isIncluded,
  safeText,
  sourceLabel,
} from "@/lib/insurance-utils";
import { Cobertura, InsuranceProduct } from "@/lib/types";

interface CoverageTabProps {
  product: InsuranceProduct;
}

const groupDefinitions = [
  {
    id: "medical",
    label: "Asistencia medica",
    description: "Gastos medicos, emergencias, COVID y atenciones relacionadas.",
    categories: ["asistencia_medica", "covid"],
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  {
    id: "travel",
    label: "Inconvenientes de viaje",
    description: "Transporte, equipaje, documentos, cruceros y beneficios operativos.",
    categories: ["transporte", "equipaje", "documentos", "crucero", "mascotas"],
    tone: "border-blue-200 bg-blue-50 text-blue-900",
  },
  {
    id: "accident",
    label: "Accidente personal y seguros",
    description: "Muerte accidental, invalidez y seguros contenidos en el producto.",
    categories: ["seguros_contenidos"],
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    id: "services",
    label: "Servicios adicionales",
    description: "Asistencias complementarias y otros beneficios.",
    categories: ["servicios_asistencia", "otros_beneficios"],
    tone: "border-purple-200 bg-purple-50 text-purple-900",
  },
  {
    id: "other",
    label: "Otras coberturas",
    description: "Categorías no clasificadas dentro de los grupos principales.",
    categories: [],
    tone: "border-slate-200 bg-slate-50 text-slate-900",
  },
] as const;

function groupForCategory(category: string) {
  return groupDefinitions.find((group) => (group.categories as readonly string[]).includes(category)) || groupDefinitions[groupDefinitions.length - 1];
}

function formatLimit(limit: unknown): string {
  if (!limit || typeof limit !== "object") return safeText(limit);
  const item = limit as Record<string, unknown>;
  const description = safeText(item.descripcion).trim();
  if (description) return description;

  const parts = [item.moneda, item.cantidad, item.medida, item.periodo ? `por ${safeText(item.periodo)}` : "", item.alcance]
    .map((part) => safeText(part).trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : safeText(item);
}

function DetailList({
  title,
  value,
  emptyText,
}: {
  title: string;
  value: unknown;
  emptyText?: string;
}) {
  const items = asArray(value).map(safeText).filter(Boolean);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">{title}</p>
      {items.length > 0 ? (
        <ul className="space-y-1.5 text-sm text-slate-700">
          {items.map((item, index) => (
            <li key={index} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{emptyText || "No aplica."}</p>
      )}
    </div>
  );
}

function LimitsList({ value }: { value: unknown }) {
  const items = asArray(value).map(formatLimit).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Límites</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span key={index} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CoverageTab({ product }: CoverageTabProps) {
  const rows = useMemo(
    () =>
      (asArray(product.coberturas) as Cobertura[]).map((coverage, index) => ({
        coverage,
        index,
        id: getCoverageId(coverage, `cobertura-${index + 1}`),
      })),
    [product.coberturas],
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const categories = useMemo(() => {
    return Array.from(new Set(rows.map(({ coverage }) => safeText(coverage.categoria)).filter(Boolean))).sort();
  }, [rows]);

  const sources = useMemo(() => {
    return Array.from(new Set(rows.map(({ coverage }) => sourceLabel(coverage.fuente)))).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const min = minAmount.trim() ? Number(minAmount.replace(",", ".")) : null;
    const max = maxAmount.trim() ? Number(maxAmount.replace(",", ".")) : null;

    return rows.filter(({ coverage }) => {
      if (selectedCategory && safeText(coverage.categoria) !== selectedCategory) return false;
      if (selectedSource && sourceLabel(coverage.fuente) !== selectedSource) return false;
      if (selectedState === "incluido" && !isIncluded(coverage.inclusion)) return false;
      if (selectedState === "no-incluido" && isIncluded(coverage.inclusion)) return false;
      const amount = extractCoverageAmount(coverage);
      if (min !== null && Number.isFinite(min) && (amount === null || amount < min)) return false;
      if (max !== null && Number.isFinite(max) && (amount === null || amount > max)) return false;

      if (!search) return true;
      const haystack = [
        coverage.nombre,
        coverage.categoria,
        coverage.tipo_cobertura || coverage.tipo,
        coverage.valor_completo,
        coverage.valor,
        coverage.medida,
        coverage.fuente,
        coverage.descripcion,
      ]
        .map(safeText)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [maxAmount, minAmount, rows, searchTerm, selectedCategory, selectedSource, selectedState]);

  const groupedRows = useMemo(() => {
    return groupDefinitions
      .map((group) => ({
        ...group,
        rows: filteredRows.filter(({ coverage }) => groupForCategory(safeText(coverage.categoria)).id === group.id),
      }))
      .filter((group) => group.rows.length > 0);
  }, [filteredRows]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const toggleGroup = (id: string) => {
    const next = new Set(collapsedGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsedGroups(next);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_0.6fr_0.6fr]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, categoría, valor o fuente"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Todas las categorias</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={selectedState}
            onChange={(event) => setSelectedState(event.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Todos los estados</option>
            <option value="incluido">Incluido</option>
            <option value="no-incluido">No incluido</option>
          </select>

          <select
            value={selectedSource}
            onChange={(event) => setSelectedSource(event.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Todas las fuentes</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>

          <input
            inputMode="decimal"
            value={minAmount}
            onChange={(event) => setMinAmount(event.target.value)}
            placeholder="Monto min."
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />

          <input
            inputMode="decimal"
            value={maxAmount}
            onChange={(event) => setMaxAmount(event.target.value)}
            placeholder="Monto max."
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Mostrando {filteredRows.length} de {rows.length} coberturas. El rango usa el mayor monto numerico detectado en valor_completo o valor.
        </p>
      </div>

      {groupedRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No hay coberturas que coincidan con los filtros.
        </div>
      ) : (
        groupedRows.map((group) => {
          const collapsed = collapsedGroups.has(group.id);

          return (
            <section key={group.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <button
                onClick={() => toggleGroup(group.id)}
                className={`flex w-full items-center justify-between gap-4 border-b px-4 py-3 text-left ${group.tone}`}
              >
                <div>
                  <h3 className="text-base font-bold">{group.label}</h3>
                  <p className="text-sm opacity-80">{group.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-bold">{group.rows.length}</span>
                  <ChevronDown className={`h-5 w-5 transition ${collapsed ? "-rotate-90" : ""}`} />
                </div>
              </button>

              {!collapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Estado</th>
                        <th className="px-4 py-3 text-left">Nombre</th>
                        <th className="px-4 py-3 text-left">Tipo</th>
                        <th className="px-4 py-3 text-left">Valor</th>
                        <th className="px-4 py-3 text-left">Fuente</th>
                        <th className="px-4 py-3 text-center">Ver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map(({ coverage, id, index }) => {
                        const isOpen = expandedIds.has(id);

                        return (
                          <ExpandableRow
                            key={`${id}-${index}`}
                            isOpen={isOpen}
                            onToggle={() => toggleExpand(id)}
                            summary={
                              <>
                                <td className="px-4 py-3">
                                  <InclusionBadge inclusion={coverage.inclusion} />
                                </td>
                                <td className="max-w-[260px] px-4 py-3 font-semibold text-slate-950">
                                  <span className="line-clamp-2">{safeText(coverage.nombre) || "Sin nombre"}</span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600">{safeText(coverage.tipo_cobertura || coverage.tipo) || "-"}</td>
                                <td className="max-w-[260px] px-4 py-3 text-slate-800" title={`Fuente: ${sourceLabel(coverage.fuente)}`}>
                                  <span className="line-clamp-2">{displayValue(coverage)}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <SourceBadge fuente={coverage.fuente} />
                                </td>
                              </>
                            }
                          >
                            <div className="space-y-4">
                              <div className="grid gap-3 lg:grid-cols-2">
                                <DetailList title="Condición" value={coverage.condiciones} emptyText="Sin condición específica." />
                                <LimitsList value={coverage.limites} />
                              </div>
                              <DetailGrid
                                entries={[
                                  ["descripción", coverage.descripcion],
                                  ["estado", isIncluded(coverage.inclusion) ? "Incluido" : "No incluido"],
                                  ["valor", displayValue(coverage)],
                                  ["tipo de valor", coverage.tipo_valor],
                                  ["tipo de cobertura", coverage.tipo_cobertura || coverage.tipo],
                                  ["alcance", coverage.alcance],
                                  ["exclusiones", coverage.exclusiones],
                                  ["upgrades relacionados", coverage.upgrades_ids],
                                  ["fuente", coverage.fuente],
                                ]}
                              />
                            </div>
                          </ExpandableRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
