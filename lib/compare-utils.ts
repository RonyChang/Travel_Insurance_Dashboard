import { asArray, displayValue, getCoverageId, getProductName, isIncluded, safeText, sourceLabel } from "./insurance-utils";
import { Cobertura, InsuranceProduct } from "./types";

export type ComparisonStatus = "same" | "different" | "only-a" | "only-b" | "not-comparable";

export interface CoverageComparisonSnapshot {
  coverage: Cobertura | null;
  included: boolean;
  valueText: string;
  limitText: string;
  conditionText: string;
  sourceText: string;
  category: string;
  duplicateCount: number;
}

export interface CoverageComparisonRow {
  id: string;
  canonicalId: string;
  name: string;
  category: string;
  planA: CoverageComparisonSnapshot;
  planB: CoverageComparisonSnapshot;
  status: ComparisonStatus;
  reason: string;
  notComparableReason?: string;
}

export interface PlanComparison {
  planAName: string;
  planBName: string;
  totalRows: number;
  differences: number;
  notComparable: number;
  rows: CoverageComparisonRow[];
}

interface IndexedCoverage {
  key: string;
  canonicalId: string;
  coverage: Cobertura;
  missingCanonicalId: boolean;
}

interface ComparableAmount {
  value: number;
  unit: string;
}

function normalize(value: unknown): string {
  return safeText(value).trim().replace(/\s+/g, " ");
}

function normalizeForCompare(value: unknown): string {
  return normalize(value).toLowerCase();
}

function categoryLabel(category: unknown): string {
  const text = normalize(category);
  if (!text) return "Sin categoría";
  return text.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function limitItemText(limit: unknown): string {
  if (typeof limit !== "object" || limit === null) return normalize(limit);

  const item = limit as Record<string, unknown>;
  const description = normalize(item.descripcion);
  if (description) return description;

  const parts = [item.moneda, item.cantidad, item.medida, item.periodo ? `por ${normalize(item.periodo)}` : "", item.alcance]
    .map(normalize)
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : normalize(item);
}

function displayLimitText(limits: unknown): string {
  return asArray(limits).map(limitItemText).filter(Boolean).join("; ");
}

function coverageName(coverage: Cobertura | null, fallback: string): string {
  return normalize(coverage?.nombre) || fallback;
}

function buildCoverageIndex(product: InsuranceProduct, side: "a" | "b") {
  const entries = (asArray(product.coberturas) as Cobertura[]).map((coverage, index): IndexedCoverage => {
    const canonicalId = getCoverageId(coverage).trim();
    const missingCanonicalId = canonicalId.length === 0;

    return {
      key: missingCanonicalId ? `__missing_${side}_${index}` : canonicalId,
      canonicalId: missingCanonicalId ? "Sin ID canónico" : canonicalId,
      coverage,
      missingCanonicalId,
    };
  });

  const index = new Map<string, IndexedCoverage[]>();
  entries.forEach((entry) => {
    const current = index.get(entry.key) || [];
    current.push(entry);
    index.set(entry.key, current);
  });

  return index;
}

function makeSnapshot(entries: IndexedCoverage[] | undefined): CoverageComparisonSnapshot {
  const coverage = entries?.[0]?.coverage || null;

  return {
    coverage,
    included: coverage ? isIncluded(coverage.inclusion) : false,
    valueText: coverage ? displayValue(coverage) : "-",
    limitText: coverage ? displayLimitText(coverage.limites) : "",
    conditionText: coverage ? asArray(coverage.condiciones).map(normalize).filter(Boolean).join("; ") : "",
    sourceText: coverage ? sourceLabel(coverage.fuente) : "-",
    category: coverage ? categoryLabel(coverage.categoria) : "Sin categoría",
    duplicateCount: entries?.length || 0,
  };
}

function normalizeCurrency(value: string): string {
  const upper = value.toUpperCase();
  if (upper === "US$") return "USD";
  if (upper === "€" || upper === "â‚¬") return "EUR";
  if (upper === "S/") return "PEN";
  return upper;
}

function extractCurrencies(text: string): string[] {
  const matches = text.toUpperCase().match(/\bUSD\b|US\$|\bEUR\b|€|â‚¬|S\/|\bCOP\b|\bMXN\b|\bARS\b/g) || [];
  return Array.from(new Set(matches.map(normalizeCurrency)));
}

function simpleUnit(value: unknown): string {
  const text = normalize(value).toUpperCase();
  if (!text) return "";
  if (/[\/,]/.test(text)) return "";
  return normalizeCurrency(text);
}

function comparableAmount(coverage: Cobertura | null): ComparableAmount | null {
  if (!coverage || typeof coverage.valor !== "number" || !Number.isFinite(coverage.valor)) return null;

  const valueText = normalize(coverage.valor_completo);
  const unit = simpleUnit(coverage.medida || coverage.tipo_valor);
  const currencies = extractCurrencies(valueText);

  if (!unit) return null;
  if (currencies.length > 1) return null;
  if (currencies.length === 1 && normalizeCurrency(unit) !== currencies[0]) return null;
  if (coverage.valor === 0 && !/\b0(?:[.,]0+)?\b/.test(valueText)) return null;

  return {
    value: coverage.valor,
    unit: normalizeCurrency(unit),
  };
}

function sameText(left: string, right: string): boolean {
  return normalizeForCompare(left) === normalizeForCompare(right);
}

function compareSharedCoverage(planA: CoverageComparisonSnapshot, planB: CoverageComparisonSnapshot): Pick<CoverageComparisonRow, "status" | "reason" | "notComparableReason"> {
  if (planA.duplicateCount > 1 || planB.duplicateCount > 1) {
    return {
      status: "not-comparable",
      reason: "No comparable automáticamente",
      notComparableReason: "Hay más de una cobertura con el mismo ID canónico en un plan.",
    };
  }

  if (planA.included && !planB.included) {
    return { status: "only-a", reason: "Solo incluido en Plan A" };
  }

  if (!planA.included && planB.included) {
    return { status: "only-b", reason: "Solo incluido en Plan B" };
  }

  if (!planA.included && !planB.included) {
    return { status: "same", reason: "No incluido en ambos planes" };
  }

  const amountA = comparableAmount(planA.coverage);
  const amountB = comparableAmount(planB.coverage);
  const valueChanged = !sameText(planA.valueText, planB.valueText);
  const limitChanged = !sameText(planA.limitText, planB.limitText);
  const conditionChanged = !sameText(planA.conditionText, planB.conditionText);
  const sourceChanged = !sameText(planA.sourceText, planB.sourceText);

  if (amountA && amountB) {
    if (amountA.unit !== amountB.unit) {
      return {
        status: "not-comparable",
        reason: "No comparable automáticamente",
        notComparableReason: "Moneda o unidad distinta entre planes.",
      };
    }

    if (amountA.value > amountB.value) {
      return { status: "different", reason: "Mayor monto en Plan A" };
    }

    if (amountB.value > amountA.value) {
      return { status: "different", reason: "Mayor monto en Plan B" };
    }

    const detailReasons = [
      valueChanged ? "mismo monto, distinto texto de valor" : "",
      limitChanged ? "mismo monto, distinto límite" : "",
      conditionChanged ? "mismo monto, distinta condición" : "",
      sourceChanged ? "mismo monto, distinta fuente" : "",
    ].filter(Boolean);

    if (detailReasons.length > 0) {
      return { status: "different", reason: detailReasons.join("; ") };
    }

    return { status: "same", reason: "Mismo monto y condiciones equivalentes" };
  }

  if (amountA || amountB || valueChanged) {
    return {
      status: "not-comparable",
      reason: "No comparable automáticamente",
      notComparableReason: "Valor sin monto normalizado comparable, unidad ambigua o formato mixto.",
    };
  }

  const detailReasons = [
    limitChanged ? "mismo valor, distinto límite" : "",
    conditionChanged ? "mismo valor, distinta condición" : "",
    sourceChanged ? "mismo valor, distinta fuente" : "",
  ].filter(Boolean);

  if (detailReasons.length > 0) {
    return { status: "different", reason: detailReasons.join("; ") };
  }

  return { status: "same", reason: "Sin diferencias relevantes" };
}

function buildRow(key: string, entriesA: IndexedCoverage[] | undefined, entriesB: IndexedCoverage[] | undefined): CoverageComparisonRow {
  const planA = makeSnapshot(entriesA);
  const planB = makeSnapshot(entriesB);
  const entryA = entriesA?.[0];
  const entryB = entriesB?.[0];
  const canonicalId = entryA?.canonicalId || entryB?.canonicalId || key;
  const missingCanonicalId = Boolean(entryA?.missingCanonicalId || entryB?.missingCanonicalId);
  const coverageA = planA.coverage;
  const coverageB = planB.coverage;
  const name = coverageName(coverageA, coverageName(coverageB, canonicalId));
  const category = coverageA ? planA.category : planB.category;

  if (missingCanonicalId) {
    return {
      id: key,
      canonicalId,
      name,
      category,
      planA,
      planB,
      status: "not-comparable",
      reason: "No comparable automáticamente",
      notComparableReason: "La cobertura no tiene ID canónico.",
    };
  }

  if (!coverageA && coverageB) {
    return {
      id: key,
      canonicalId,
      name,
      category,
      planA,
      planB,
      status: planB.included ? "only-b" : "different",
      reason: planB.included ? "Solo incluido en Plan B" : "Solo aparece en Plan B",
    };
  }

  if (coverageA && !coverageB) {
    return {
      id: key,
      canonicalId,
      name,
      category,
      planA,
      planB,
      status: planA.included ? "only-a" : "different",
      reason: planA.included ? "Solo incluido en Plan A" : "Solo aparece en Plan A",
    };
  }

  const result = compareSharedCoverage(planA, planB);

  return {
    id: key,
    canonicalId,
    name,
    category,
    planA,
    planB,
    ...result,
  };
}

export function comparePlans(planA: InsuranceProduct, planB: InsuranceProduct): PlanComparison {
  const indexA = buildCoverageIndex(planA, "a");
  const indexB = buildCoverageIndex(planB, "b");
  const keys = Array.from(new Set([...indexA.keys(), ...indexB.keys()]));

  const rows = keys
    .map((key) => buildRow(key, indexA.get(key), indexB.get(key)))
    .sort((left, right) => {
      const categoryCompare = left.category.localeCompare(right.category);
      if (categoryCompare !== 0) return categoryCompare;
      return left.name.localeCompare(right.name);
    });

  return {
    planAName: getProductName(planA),
    planBName: getProductName(planB),
    totalRows: rows.length,
    differences: rows.filter((row) => row.status === "different" || row.status === "only-a" || row.status === "only-b").length,
    notComparable: rows.filter((row) => row.status === "not-comparable").length,
    rows,
  };
}
