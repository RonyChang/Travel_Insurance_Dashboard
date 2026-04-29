"use client";

import { useState } from "react";
import InsuranceDashboard from "@/components/InsuranceDashboard";
import { InsuranceProduct } from "@/lib/types";

interface ClientPageProps {
  initialProducts: InsuranceProduct[];
}

export default function ClientPage({ initialProducts }: ClientPageProps) {
  const [selectedProduct, setSelectedProduct] = useState<InsuranceProduct | null>(initialProducts[0] || null);

  return (
    <InsuranceDashboard
      products={initialProducts}
      selectedProduct={selectedProduct}
      onSelectProduct={setSelectedProduct}
    />
  );
}
