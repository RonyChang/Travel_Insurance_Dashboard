"use client";

import { useMemo, useState } from "react";
import { Database, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Cobertura, InsuranceProduct } from "@/lib/types";
import {
  asArray,
  displayValue,
  extractCoverageAmount,
  formatAmount,
  getCoverageId,
  getProductName,
  getQuickMetrics,
  isIncluded,
  safeText,
} from "@/lib/insurance-utils";

interface ProductListProps {
  products: InsuranceProduct[];
  selectedProduct: InsuranceProduct | null;
  onSelect: (product: InsuranceProduct) => void;
}

function toNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function matchingCoverages(product: InsuranceProduct, coverageSearch: string, minAmount: number | null, maxAmount: number | null) {
  const search = coverageSearch.trim().toLowerCase();
  if (!search && minAmount === null && maxAmount === null) return [];

  return (asArray(product.coberturas) as Cobertura[]).filter((coverage) => {
    if (search) {
      const haystack = [coverage.nombre, getCoverageId(coverage), coverage.categoria, coverage.valor_completo, coverage.descripcion]
        .map(safeText)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    const amount = extractCoverageAmount(coverage);
    if (minAmount !== null && (amount === null || amount < minAmount)) return false;
    if (maxAmount !== null && (amount === null || amount > maxAmount)) return false;
    return true;
  });
}

export default function ProductList({ products, selectedProduct, onSelect }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [company, setCompany] = useState("");
  const [coverageSearch, setCoverageSearch] = useState("");
  const [minAmountText, setMinAmountText] = useState("");
  const [maxAmountText, setMaxAmountText] = useState("");
  const [onlyIncludedCoverage, setOnlyIncludedCoverage] = useState(false);

  const minAmount = toNumber(minAmountText);
  const maxAmount = toNumber(maxAmountText);
  const coverageFilterActive = Boolean(coverageSearch.trim() || minAmount !== null || maxAmount !== null || onlyIncludedCoverage);

  const companies = useMemo(() => {
    return Array.from(new Set(products.map((product) => safeText(product.compania || product.empresa?.nombre_comercial)).filter(Boolean))).sort();
  }, [products]);

  const coverageOptions = useMemo(() => {
    const names = new Set<string>();
    products.forEach((product) => {
      (asArray(product.coberturas) as Cobertura[]).forEach((coverage) => {
        const name = safeText(coverage.nombre);
        if (name) names.add(name);
      });
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b)).slice(0, 300);
  }, [products]);

  const productMatches = useMemo(() => {
    const map = new Map<InsuranceProduct, Cobertura[]>();
    products.forEach((product) => {
      const matches = matchingCoverages(product, coverageSearch, minAmount, maxAmount).filter((coverage) =>
        onlyIncludedCoverage ? isIncluded(coverage.inclusion) : true,
      );
      map.set(product, matches);
    });
    return map;
  }, [coverageSearch, maxAmount, minAmount, onlyIncludedCoverage, products]);

  const filteredProducts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      if (company && safeText(product.compania || product.empresa?.nombre_comercial) !== company) return false;
      if (coverageFilterActive && (productMatches.get(product)?.length || 0) === 0) return false;
      if (!search) return true;

      const haystack = [
        getProductName(product),
        product.compania,
        product.plan,
        product.empresa?.nombre_comercial,
      ]
        .map(safeText)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [company, coverageFilterActive, productMatches, products, searchTerm]);

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-950">Seguros de viaje</h1>
            <p className="text-xs text-slate-500">{products.length} productos configurados</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-b border-slate-200 p-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar empresa, plan o código"
            className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <select
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todas las empresas</option>
          {companies.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtro por cobertura
          </div>

          <input
            list="coverage-options"
            value={coverageSearch}
            onChange={(event) => setCoverageSearch(event.target.value)}
            placeholder="Ej. preexistencias, equipaje, COVID"
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <datalist id="coverage-options">
            {coverageOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              inputMode="decimal"
              value={minAmountText}
              onChange={(event) => setMinAmountText(event.target.value)}
              placeholder="Monto min."
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <input
              inputMode="decimal"
              value={maxAmountText}
              onChange={(event) => setMaxAmountText(event.target.value)}
              placeholder="Monto max."
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <label className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={onlyIncludedCoverage}
              onChange={(event) => setOnlyIncludedCoverage(event.target.checked)}
            />
            Solo coberturas incluidas
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="px-2 pb-2 text-xs font-medium text-slate-500">
          Mostrando {filteredProducts.length} de {products.length}
        </p>

        {filteredProducts.length === 0 ? (
          <div className="m-2 rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
            No hay productos con esos filtros.
          </div>
        ) : (
          <div className="space-y-1">
            {filteredProducts.map((product, index) => {
              const metrics = getQuickMetrics(product);
              const active = selectedProduct === product;
              const matches = productMatches.get(product) || [];
              const bestMatch = matches
                .map((coverage) => ({ coverage, amount: extractCoverageAmount(coverage) }))
                .sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];

              return (
                <button
                  key={`${getProductName(product)}-${index}`}
                  onClick={() => onSelect(product)}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    active ? "border-blue-600 bg-blue-50" : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold uppercase text-slate-500">
                      {safeText(product.compania || product.empresa?.nombre_comercial) || "Sin compañía"}
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-950">{safeText(product.plan) || "Sin plan"}</p>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{metrics.totalCoberturas} cob.</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{metrics.totalExclusiones} exc.</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{metrics.totalUpgrades} upg.</span>
                    {coverageFilterActive && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800">
                        {matches.length} coincid.
                      </span>
                    )}
                  </div>

                  {coverageFilterActive && bestMatch && (
                    <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5">
                      <p className="truncate text-xs font-semibold text-emerald-900">{safeText(bestMatch.coverage.nombre)}</p>
                      <p className="truncate text-[11px] text-emerald-800">
                        {displayValue(bestMatch.coverage)}
                        {bestMatch.amount !== null ? ` · monto detectado ${formatAmount(bestMatch.amount)}` : ""}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-700" />
          Datos cargados desde los JSON locales en <span className="font-mono">public</span>.
        </div>
      </div>
    </aside>
  );
}
