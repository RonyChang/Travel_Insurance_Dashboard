"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ExpandableRow from "@/components/ExpandableRow";
import InclusionBadge from "@/components/InclusionBadge";
import SourceBadge from "@/components/SourceBadge";
import { DetailGrid } from "@/components/ValueView";
import { asArray, getExclusionId, isIncluded, safeText, sourceLabel } from "@/lib/insurance-utils";
import { Exclusion, InsuranceProduct } from "@/lib/types";

interface ExclusionsTabProps {
  product: InsuranceProduct;
}

export default function ExclusionsTab({ product }: ExclusionsTabProps) {
  const rows = useMemo(
    () =>
      (asArray(product.exclusiones_generales) as Exclusion[]).map((exclusion, index) => ({
        exclusion,
        index,
        id: getExclusionId(exclusion, `exclusion-${index + 1}`),
      })),
    [product.exclusiones_generales],
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSource, setSelectedSource] = useState("");

  const categories = useMemo(() => Array.from(new Set(rows.map(({ exclusion }) => safeText(exclusion.categoria)).filter(Boolean))).sort(), [rows]);
  const sources = useMemo(() => Array.from(new Set(rows.map(({ exclusion }) => sourceLabel(exclusion.fuente)))).sort(), [rows]);

  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return rows.filter(({ exclusion }) => {
      if (selectedCategory && safeText(exclusion.categoria) !== selectedCategory) return false;
      if (selectedSource && sourceLabel(exclusion.fuente) !== selectedSource) return false;
      if (selectedState === "aplica" && !isIncluded(exclusion.inclusion)) return false;
      if (selectedState === "no-aplica" && isIncluded(exclusion.inclusion)) return false;

      if (!search) return true;
      const haystack = [exclusion.nombre, exclusion.categoria, exclusion.descripcion, exclusion.fuente]
        .map(safeText)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [rows, searchTerm, selectedCategory, selectedSource, selectedState]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, categoría o descripción"
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
            <option value="">Todas</option>
            <option value="aplica">Aplica</option>
            <option value="no-aplica">No aplica</option>
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
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Mostrando {filteredRows.length} de {rows.length}. En esta seccion, Incluido significa que la exclusion aplica.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Aplica</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Fuente</th>
                <th className="px-4 py-3 text-center">Ver</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No hay exclusiones que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ exclusion, id, index }) => (
                  <ExpandableRow
                    key={`${id}-${index}`}
                    isOpen={expandedIds.has(id)}
                    onToggle={() => toggleExpand(id)}
                    summary={
                      <>
                        <td className="px-4 py-3">
                          <InclusionBadge inclusion={exclusion.inclusion} type="exclusion" />
                        </td>
                        <td className="max-w-[240px] px-4 py-3 font-semibold text-slate-950">
                          <span className="line-clamp-2">{safeText(exclusion.nombre) || "Sin nombre"}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{safeText(exclusion.categoria) || "-"}</td>
                        <td className="max-w-[360px] px-4 py-3 text-slate-700">
                          <span className="line-clamp-2">{safeText(exclusion.descripcion) || "-"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <SourceBadge fuente={exclusion.fuente} />
                        </td>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <DetailGrid
                        entries={[
                          ["descripcion", exclusion.descripcion],
                          ["estado", isIncluded(exclusion.inclusion) ? "Aplica" : "No aplica"],
                          ["condiciones", exclusion.condiciones],
                          ["excepciones", exclusion.excepciones],
                          ["fuente", exclusion.fuente],
                        ]}
                      />
                    </div>
                  </ExpandableRow>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
