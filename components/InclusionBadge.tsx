"use client";

import { isIncluded, isNotIncluded } from "@/lib/insurance-utils";

interface InclusionBadgeProps {
  inclusion: unknown;
  className?: string;
  type?: "coverage" | "exclusion"; // exclusion: "Incluido" = "Aplica" (red)
}

export default function InclusionBadge({
  inclusion,
  className = "",
  type = "coverage",
}: InclusionBadgeProps) {
  if (isIncluded(inclusion)) {
    if (type === "exclusion") {
      // For exclusions, "Incluido" means it applies (red/warning)
      return (
        <span className={`text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-medium ${className}`}>
          Aplica
        </span>
      );
    }
    // For coverage, "Incluido" is green
    return (
      <span className={`text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium ${className}`}>
        Incluido
      </span>
    );
  }

  if (isNotIncluded(inclusion)) {
    if (type === "exclusion") {
      return (
        <span className={`text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded font-medium ${className}`}>
          No aplica
        </span>
      );
    }

    return (
      <span className={`text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded font-medium ${className}`}>
        No incluido
      </span>
    );
  }

  if (type === "exclusion") {
    return (
      <span className={`text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded font-medium ${className}`}>
        No aplica
      </span>
    );
  }

  return (
    <span className={`text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded font-medium ${className}`}>
      No incluido
    </span>
  );
}
