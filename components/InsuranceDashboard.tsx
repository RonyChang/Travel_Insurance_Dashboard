"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import ProductList from "@/components/ProductList";
import CoverageTab from "@/components/tabs/CoverageTab";
import ExclusionsTab from "@/components/tabs/ExclusionsTab";
import JsonTab from "@/components/tabs/JsonTab";
import ResumeTab from "@/components/tabs/ResumeTab";
import UpgradesTab from "@/components/tabs/UpgradesTab";
import { getProductName, getQuickMetrics, safeText } from "@/lib/insurance-utils";
import { InsuranceProduct } from "@/lib/types";

type TabType = "resumen" | "coberturas" | "exclusiones" | "upgrades" | "json";

interface InsuranceDashboardProps {
  products: InsuranceProduct[];
  selectedProduct: InsuranceProduct | null;
  onSelectProduct: (product: InsuranceProduct) => void;
}

const tabsList: { id: TabType; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "coberturas", label: "Coberturas" },
  { id: "exclusiones", label: "Exclusiones" },
  { id: "upgrades", label: "Upgrades" },
  { id: "json", label: "JSON" },
];

function Metric({ label, value, tone = "slate" }: { label: string; value: number | string; tone?: "blue" | "green" | "amber" | "red" | "slate" }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-800",
    slate: "border-slate-200 bg-white text-slate-800",
  };

  return (
    <div className={`rounded-lg border px-3 py-2 ${tones[tone]}`}>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-600">{label}</p>
    </div>
  );
}

export default function InsuranceDashboard({ products, selectedProduct, onSelectProduct }: InsuranceDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("coberturas");
  const metrics = useMemo(() => (selectedProduct ? getQuickMetrics(selectedProduct) : null), [selectedProduct]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 lg:flex lg:h-screen lg:overflow-hidden">
      <div className="h-[42vh] min-h-[360px] lg:h-screen lg:w-[340px] lg:min-h-0 lg:flex-shrink-0">
        <ProductList products={products} selectedProduct={selectedProduct} onSelect={onSelectProduct} />
      </div>

      <main className="flex min-w-0 flex-1 flex-col lg:h-screen">
        <div className="border-b border-slate-200 bg-white">
          <div className="px-4 py-4 md:px-6">
            {selectedProduct ? (
              <div className="space-y-4">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                      {safeText(selectedProduct.compania || selectedProduct.empresa?.nombre_comercial) || "Sin compañía"}
                    </span>
                  </div>
                  <h2 className="truncate text-xl font-bold text-slate-950 md:text-2xl">{getProductName(selectedProduct)}</h2>
                  <p className="mt-1 text-sm text-slate-600">Configuración lista para revisar.</p>
                </div>

                {metrics && (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                    <Metric label="Coberturas" value={metrics.totalCoberturas} tone="blue" />
                    <Metric label="Incluidas" value={metrics.coberturasIncluidas} tone="green" />
                    <Metric label="No incluidas" value={metrics.coberturasNoIncluidas} />
                    <Metric label="Exclusiones aplican" value={metrics.exclusionesAplican} tone="amber" />
                    <Metric label="Upgrades incluidos" value={metrics.upgradesIncluidos} tone="green" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500">
                <ShieldCheck className="h-6 w-6" />
                No se encontraron JSON de seguros en public.
              </div>
            )}
          </div>

          <div className="flex gap-1 overflow-x-auto px-4 md:px-6">
            {tabsList.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-blue-700 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          {selectedProduct ? (
            <>
              {activeTab === "resumen" && <ResumeTab product={selectedProduct} />}
              {activeTab === "coberturas" && <CoverageTab product={selectedProduct} />}
              {activeTab === "exclusiones" && <ExclusionsTab product={selectedProduct} />}
              {activeTab === "upgrades" && <UpgradesTab product={selectedProduct} />}
              {activeTab === "json" && <JsonTab product={selectedProduct} />}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
