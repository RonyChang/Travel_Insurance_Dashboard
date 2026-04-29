"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ExpandableRow from "@/components/ExpandableRow";
import InclusionBadge from "@/components/InclusionBadge";
import SourceBadge from "@/components/SourceBadge";
import { DetailGrid } from "@/components/ValueView";
import {
  asArray,
  displayValue,
  getUpgradeId,
  isIncluded,
  safeText,
  sourceLabel,
} from "@/lib/insurance-utils";
import { InsuranceProduct, Upgrade } from "@/lib/types";

interface UpgradesTabProps {
  product: InsuranceProduct;
}

export default function UpgradesTab({ product }: UpgradesTabProps) {
  const rows = useMemo(
    () =>
      (asArray(product.upgrades) as Upgrade[]).map((upgrade, index) => ({
        upgrade,
        index,
        id: getUpgradeId(upgrade, `upgrade-${index + 1}`),
      })),
    [product.upgrades],
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSource, setSelectedSource] = useState("");

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        rows.flatMap(({ upgrade }) => asArray(upgrade.categorias_afectadas).map(safeText).filter(Boolean)),
      ),
    ).sort();
  }, [rows]);

  const sources = useMemo(() => Array.from(new Set(rows.map(({ upgrade }) => sourceLabel(upgrade.fuente)))).sort(), [rows]);

  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return rows.filter(({ upgrade }) => {
      const affectedCategories = asArray(upgrade.categorias_afectadas).map(safeText);
      if (selectedCategory && !affectedCategories.includes(selectedCategory)) return false;
      if (selectedSource && sourceLabel(upgrade.fuente) !== selectedSource) return false;
      if (selectedState === "incluido" && !isIncluded(upgrade.inclusion)) return false;
      if (selectedState === "no-incluido" && isIncluded(upgrade.inclusion)) return false;

      if (!search) return true;
      const haystack = [
        upgrade.nombre,
        upgrade.descripcion,
        upgrade.valor_completo,
        upgrade.fuente,
        affectedCategories.join(" "),
        asArray(upgrade.coberturas_relacionadas_ids).join(" "),
      ]
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
              placeholder="Buscar por nombre, categoría afectada o fuente"
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
        </div>

        <p className="mt-3 text-xs text-slate-500">Mostrando {filteredRows.length} de {rows.length} upgrades.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Categorías afectadas</th>
                <th className="px-4 py-3 text-left">Coberturas relacionadas</th>
                <th className="px-4 py-3 text-left">Fuente</th>
                <th className="px-4 py-3 text-center">Ver</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No hay upgrades que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ upgrade, id, index }) => {
                  const categoriesText = asArray(upgrade.categorias_afectadas).map(safeText).filter(Boolean);
                  const relatedText = asArray(upgrade.coberturas_relacionadas_ids).map(safeText).filter(Boolean);

                  return (
                    <ExpandableRow
                      key={`${id}-${index}`}
                      isOpen={expandedIds.has(id)}
                      onToggle={() => toggleExpand(id)}
                      summary={
                        <>
                          <td className="px-4 py-3">
                            <InclusionBadge inclusion={upgrade.inclusion} />
                          </td>
                          <td className="max-w-[240px] px-4 py-3 font-semibold text-slate-950">
                            <span className="line-clamp-2">{safeText(upgrade.nombre) || "Sin nombre"}</span>
                          </td>
                          <td className="max-w-[220px] px-4 py-3 text-xs text-slate-600">{categoriesText.join(", ") || "-"}</td>
                          <td className="max-w-[240px] px-4 py-3 font-mono text-xs text-slate-600">
                            <span className="line-clamp-2">{relatedText.join(", ") || "-"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <SourceBadge fuente={upgrade.fuente} />
                          </td>
                        </>
                      }
                    >
                      <div className="space-y-4">
                        <DetailGrid
                          entries={[
                            ["descripcion", upgrade.descripcion],
                            ["estado", isIncluded(upgrade.inclusion) ? "Incluido" : "No incluido"],
                            ["valor", displayValue(upgrade)],
                            ["tipo_valor", upgrade.tipo_valor],
                            ["medida", upgrade.medida],
                            ["condiciones", upgrade.condiciones],
                            ["exclusiones", upgrade.exclusiones],
                            ["categorias_afectadas", upgrade.categorias_afectadas],
                            ["coberturas_relacionadas_ids", upgrade.coberturas_relacionadas_ids],
                            ["fuente", upgrade.fuente],
                          ]}
                        />
                      </div>
                    </ExpandableRow>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
