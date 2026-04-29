import { Cobertura, Exclusion, InsuranceProduct, Upgrade } from "./types";

export function asArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value === null || value === undefined || value === "") return [];
  return [value as T];
}

export function safeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => safeText(item)).filter(Boolean).join(", ");

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function getCoverageId(item: Cobertura, fallback = ""): string {
  return safeText(item.id_condicion || item.id || fallback);
}

export function getExclusionId(item: Exclusion, fallback = ""): string {
  return safeText(item.id_exclusion || item.id || fallback);
}

export function getUpgradeId(item: Upgrade, fallback = ""): string {
  return safeText(item.id_upgrade || item.id || fallback);
}

export function displayValue(item: Pick<Cobertura | Upgrade, "valor_completo" | "valor" | "medida" | "inclusion">): string {
  const complete = safeText(item.valor_completo).trim();
  if (complete && complete.toLowerCase() !== "none" && complete.toLowerCase() !== "null") {
    return complete;
  }

  const valor = safeText(item.valor).trim();
  const medida = safeText(item.medida).trim();
  if (valor && medida) return `${valor} ${medida}`;
  if (valor) return valor;
  if (medida) return medida;
  if (isIncluded(item.inclusion)) return "Incluido sin monto";
  return "Sin monto";
}

export function isNotIncluded(value: unknown): boolean {
  const text = safeText(value).trim().toLowerCase();
  return (
    text === "no" ||
    text === "false" ||
    text === "no incluido" ||
    text === "no incluida" ||
    text.includes("no incluido") ||
    text.includes("no incluida")
  );
}

export function isIncluded(value: unknown): boolean {
  const text = safeText(value).trim().toLowerCase();
  if (!text || isNotIncluded(text)) return false;
  return text === "si" || text === "sí" || text === "true" || text.includes("incluido") || text.includes("incluida");
}

export function sourceLabel(fuente: unknown): string {
  const text = safeText(fuente).trim();
  if (!text || text.toLowerCase() === "null" || text.toLowerCase() === "none") return "Sin fuente";

  const lower = text.toLowerCase();
  const hasVoucher = lower.includes("voucher");
  const hasCcgg = lower.includes("ccgg") || lower.includes("cc.gg");
  if (lower.includes("ambos") || (hasVoucher && hasCcgg)) return "Ambos";
  if (hasVoucher) return "Voucher";
  if (hasCcgg) return "CCGG";
  return text;
}

export function containsMojibake(text: unknown): boolean {
  const str = safeText(text);
  if (!str) return false;
  return /Ã.|Â.|â€|â€™|â€œ|â€|â€“|â€”|â€¢|�/.test(str);
}

export function hasPositiveValueText(text: unknown): boolean {
  const str = safeText(text);
  if (!str) return false;
  if (/no incluido|sin monto|no aplica/i.test(str)) return false;

  return /(\$|USD|US\$|EUR|€|S\/|COP|MXN|ARS)\s*[\d.,]+|[\d.,]+\s*(USD|US\$|EUR|€|S\/|COP|MXN|ARS)|\b\d{2,}\s*(por|cada|hasta|kg|dia|día|dias|días)\b/i.test(
    str,
  );
}

export function hasCompoundLimitText(text: unknown): boolean {
  const str = safeText(text);
  if (!str) return false;

  return /\b(por dia|por día|por dias|por días|hasta|maximo|máximo|minimo|mínimo|por kg|cada 8 horas|resto del mundo|costa rica|por evento|por viaje|por noche)\b/i.test(
    str,
  );
}

export function displayLimits(limites: unknown): string {
  const items = asArray(limites);
  if (items.length === 0) return "";

  return items
    .map((item) => {
      if (typeof item !== "object" || item === null) return safeText(item);
      const obj = item as Record<string, unknown>;
      const parts = [obj.moneda, obj.cantidad, obj.medida, obj.periodo ? `por ${safeText(obj.periodo)}` : ""]
        .map((part) => safeText(part).trim())
        .filter(Boolean);
      return parts.length > 0 ? parts.join(" ") : safeText(obj);
    })
    .filter(Boolean)
    .join("; ");
}

function parseNumberToken(token: string): number | null {
  const compact = token.replace(/\s/g, "");
  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  let normalized = compact;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandSeparator = decimalSeparator === "," ? "." : ",";
    normalized = compact.split(thousandSeparator).join("").replace(decimalSeparator, ".");
  } else if (lastComma >= 0 || lastDot >= 0) {
    const separator = lastComma >= 0 ? "," : ".";
    const parts = compact.split(separator);
    const tail = parts[parts.length - 1];
    normalized = tail.length === 3 ? parts.join("") : compact.replace(separator, ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function extractCoverageAmount(coverage: Pick<Cobertura, "valor" | "valor_completo">): number | null {
  const values: number[] = [];

  if (typeof coverage.valor === "number" && Number.isFinite(coverage.valor)) {
    values.push(coverage.valor);
  }

  [coverage.valor_completo, coverage.valor].forEach((value) => {
    const text = safeText(value);
    const matches = text.match(/\d+(?:[.,]\d{3})*(?:[.,]\d+)?/g) || [];
    matches.forEach((match) => {
      const parsed = parseNumberToken(match);
      if (parsed !== null) values.push(parsed);
    });
  });

  if (values.length === 0) return null;
  return Math.max(...values);
}

export function formatAmount(value: number | null): string {
  if (value === null) return "-";
  return value.toLocaleString("es-PE", { maximumFractionDigits: 2 });
}

export function getProductName(product: InsuranceProduct): string {
  const company = safeText(product.compania || product.empresa?.nombre_comercial);
  const plan = safeText(product.plan);
  if (company && plan) return `${company} - ${plan}`;
  return company || plan || "Producto sin nombre";
}

export function getQuickMetrics(product: InsuranceProduct) {
  const coberturas = asArray(product.coberturas) as Cobertura[];
  const exclusiones = asArray(product.exclusiones_generales) as Exclusion[];
  const upgrades = asArray(product.upgrades) as Upgrade[];

  return {
    totalCoberturas: coberturas.length,
    coberturasIncluidas: coberturas.filter((c) => isIncluded(c.inclusion)).length,
    coberturasNoIncluidas: coberturas.filter((c) => isNotIncluded(c.inclusion)).length,
    totalExclusiones: exclusiones.length,
    exclusionesAplican: exclusiones.filter((e) => isIncluded(e.inclusion)).length,
    totalUpgrades: upgrades.length,
    upgradesIncluidos: upgrades.filter((u) => isIncluded(u.inclusion)).length,
  };
}
