"use client";

import { sourceLabel } from "@/lib/insurance-utils";

interface SourceBadgeProps {
  fuente: unknown;
  className?: string;
}

export default function SourceBadge({ fuente, className = "" }: SourceBadgeProps) {
  const label = sourceLabel(fuente);
  const title = `Fuente: ${label}`;

  if (label === "Sin fuente") {
    return <span title={title} className={`text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded ${className}`}>{label}</span>;
  }

  if (label === "Voucher") {
    return <span title={title} className={`text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded ${className}`}>{label}</span>;
  }

  if (label === "CCGG") {
    return <span title={title} className={`text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded ${className}`}>{label}</span>;
  }

  if (label === "Ambos") {
    return <span title={title} className={`text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded ${className}`}>{label}</span>;
  }

  return <span title={title} className={`text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded ${className}`}>{label}</span>;
}
