"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, GitCompare, Search } from "lucide-react";
import InclusionBadge from "@/components/InclusionBadge";
import SourceBadge from "@/components/SourceBadge";
import { comparePlans, ComparisonStatus, CoverageComparisonRow, CoverageComparisonSnapshot } from "@/lib/compare-utils";
import { getProductName, safeText } from "@/lib/insurance-utils";
import { InsuranceProduct } from "@/lib/types";

interface CompareTabProps {
  products: InsuranceProduct[];
  selectedProduct: InsuranceProduct | null;
}

function productOptionLabel(product: InsuranceProduct): string {
  return getProductName(product);
}

function comparisonPlanName(product: InsuranceProduct | undefined, fallback: string): string {
  if (!product) return fallback;
  const plan = safeText(product.plan) || getProductName(product);
  return `${fallback}: ${plan}`;
}

function initialIndexes(products: InsuranceProduct[], selectedProduct: InsuranceProduct | null) {
  const selectedIndex = selectedProduct ? products.indexOf(selectedProduct) : -1;
  const planAIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const planBIndex = products.findIndex((_, index) => index !== planAIndex);

  return {
    planAIndex: Math.max(planAIndex, 0),
    planBIndex: planBIndex >= 0 ? planBIndex : 0,
  };
}

function firstDifferentIndex(products: InsuranceProduct[], currentIndex: number): number {
  const nextIndex = products.findIndex((_, index) => index !== currentIndex);
  return nextIndex >= 0 ? nextIndex : currentIndex;
}

function StatusBadge({ status }: { status: ComparisonStatus }) {
  const labels: Record<ComparisonStatus, string> = {
    same: "Sin diferencia",
    different: "Diferencia",
    "only-a": "Solo Plan A",
    "only-b": "Solo Plan B",
    "not-comparable": "No comparable",
  };

  const tones: Record<ComparisonStatus, string> = {
    same: "bg-emerald-50 text-emerald-700 border-emerald-200",
    different: "bg-amber-50 text-amber-800 border-amber-200",
    "only-a": "bg-blue-50 text-blue-800 border-blue-200",
    "only-b": "bg-purple-50 text-purple-800 border-purple-200",
    "not-comparable": "bg-slate-100 text-slate-700 border-slate-200",
  };

  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${tones[status]}`}>{labels[status]}</span>;
}

function Metric({ label, value, tone = "slate" }: { label: string; value: number | string; tone?: "blue" | "amber" | "slate" }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    slate: "border-slate-200 bg-white text-slate-800",
  };

  return (
    <div className={`rounded-lg border px-3 py-2 ${tones[tone]}`}>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-600">{label}</p>
    </div>
  );
}

function PlanSummary({ label, product }: { label: string; product: InsuranceProduct }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-950">{safeText(product.plan) || "Sin plan"}</p>
      <p className="mt-1 text-sm text-slate-600">{safeText(product.compania || product.empresa?.nombre_comercial) || "Sin compañía"}</p>
    </div>
  );
}

function CoverageCell({ snapshot }: { snapshot: CoverageComparisonSnapshot }) {
  if (!snapshot.coverage) {
    return <p className="text-sm text-slate-500">No aparece en este plan.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <InclusionBadge inclusion={snapshot.included ? "Incluido" : "No incluido"} />
        <SourceBadge fuente={snapshot.coverage.fuente} />
        {snapshot.duplicateCount > 1 && (
          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
            {snapshot.duplicateCount} con el mismo ID
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500">Valor original</p>
        <p className="whitespace-pre-wrap break-words text-sm text-slate-900">{snapshot.valueText}</p>
      </div>

      {snapshot.limitText && (
        <div>
          <p className="text-xs font-semibold text-slate-500">Límites</p>
          <p className="whitespace-pre-wrap break-words text-xs text-slate-700">{snapshot.limitText}</p>
        </div>
      )}

      {snapshot.conditionText && (
        <div>
          <p className="text-xs font-semibold text-slate-500">Condiciones</p>
          <p className="max-h-24 overflow-y-auto whitespace-pre-wrap break-words text-xs text-slate-700">{snapshot.conditionText}</p>
        </div>
      )}
    </div>
  );
}

function DifferenceCell({ row }: { row: CoverageComparisonRow }) {
  return (
    <div className="space-y-2">
      <StatusBadge status={row.status} />
      <p className="text-sm font-medium text-slate-900">{row.reason}</p>
      {row.notComparableReason && (
        <p className="flex gap-1.5 text-xs text-slate-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
          <span>{row.notComparableReason}</span>
        </p>
      )}
    </div>
  );
}

function groupRows(rows: CoverageComparisonRow[]) {
  const groups = new Map<string, CoverageComparisonRow[]>();

  rows.forEach((row) => {
    const current = groups.get(row.category) || [];
    current.push(row);
    groups.set(row.category, current);
  });

  return Array.from(groups.entries()).map(([category, items]) => ({ category, rows: items }));
}

export default function CompareTab({ products, selectedProduct }: CompareTabProps) {
  const defaults = initialIndexes(products, selectedProduct);
  const [planAIndex, setPlanAIndex] = useState(String(defaults.planAIndex));
  const [planBIndex, setPlanBIndex] = useState(String(defaults.planBIndex));
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyDifferences, setOnlyDifferences] = useState(false);

  const planA = products[Number(planAIndex)];
  const planB = products[Number(planBIndex)];
  const planAName = comparisonPlanName(planA, "Plan A");
  const planBName = comparisonPlanName(planB, "Plan B");

  const comparison = useMemo(() => {
    if (!planA || !planB) return null;
    return comparePlans(planA, planB);
  }, [planA, planB]);

  const visibleRows = useMemo(() => {
    if (!comparison) return [];
    const search = searchTerm.trim().toLowerCase();

    return comparison.rows.filter((row) => {
      if (onlyDifferences && row.status === "same") return false;
      if (!search) return true;

      const haystack = [
        row.canonicalId,
        row.name,
        row.category,
        row.reason,
        row.planA.valueText,
        row.planB.valueText,
        row.planA.conditionText,
        row.planB.conditionText,
      ]
        .map((value) => safeText(value).toLowerCase())
        .join(" ");

      return haystack.includes(search);
    });
  }, [comparison, onlyDifferences, searchTerm]);

  const groupedRows = useMemo(() => groupRows(visibleRows), [visibleRows]);

  function handlePlanAChange(value: string) {
    setPlanAIndex(value);
    if (value === planBIndex) {
      setPlanBIndex(String(firstDifferentIndex(products, Number(value))));
    }
  }

  function handlePlanBChange(value: string) {
    setPlanBIndex(value);
    if (value === planAIndex) {
      setPlanAIndex(String(firstDifferentIndex(products, Number(value))));
    }
  }

  if (products.length < 2) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Necesitas al menos dos productos cargados para comparar planes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-blue-700" />
          <div>
            <h3 className="text-base font-bold text-slate-950">Comparación por coberturas normalizadas</h3>
            <p className="text-sm text-slate-600">Las filas se alinean por ID canónico, no por el nombre comercial de cada voucher.</p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Plan A</span>
            <select
              value={planAIndex}
              onChange={(event) => handlePlanAChange(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              {products.map((product, index) => (
                <option key={`plan-a-${index}`} value={index} disabled={index === Number(planBIndex)}>
                  {productOptionLabel(product)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Plan B</span>
            <select
              value={planBIndex}
              onChange={(event) => handlePlanBChange(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              {products.map((product, index) => (
                <option key={`plan-b-${index}`} value={index} disabled={index === Number(planAIndex)}>
                  {productOptionLabel(product)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {planA && planB && comparison && (
        <>
          <section className="grid gap-3 xl:grid-cols-[1fr_1fr_0.9fr]">
            <PlanSummary label="Plan A" product={planA} />
            <PlanSummary label="Plan B" product={planB} />
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Coberturas comparadas" value={comparison.totalRows} tone="blue" />
              <Metric label="Diferencias" value={comparison.differences} tone="amber" />
              <Metric label="No comparables" value={comparison.notComparable} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar cobertura, ID canónico, condición o valor"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyDifferences}
                  onChange={(event) => setOnlyDifferences(event.target.checked)}
                  className="h-4 w-4"
                />
                Solo diferencias
              </label>
            </div>
          </section>

          {groupedRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No hay coberturas que coincidan con los filtros.
            </div>
          ) : (
            groupedRows.map((group) => (
              <section key={group.category} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <h3 className="text-sm font-bold text-slate-950">{group.category}</h3>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-600">{group.rows.length}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] text-sm">
                    <thead className="border-b border-slate-200 bg-white text-xs uppercase text-slate-500">
                      <tr>
                        <th className="w-[220px] px-4 py-3 text-left">Cobertura</th>
                        <th className="w-[340px] px-4 py-3 text-left">{planAName}</th>
                        <th className="w-[340px] px-4 py-3 text-left">{planBName}</th>
                        <th className="w-[260px] px-4 py-3 text-left">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 align-top last:border-0">
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-950">{row.name}</p>
                            <p className="mt-1 break-all font-mono text-xs text-slate-500">{row.canonicalId}</p>
                          </td>
                          <td className="px-4 py-4">
                            <CoverageCell snapshot={row.planA} />
                          </td>
                          <td className="px-4 py-4">
                            <CoverageCell snapshot={row.planB} />
                          </td>
                          <td className="px-4 py-4">
                            <DifferenceCell row={row} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
