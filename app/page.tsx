import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { InsuranceProduct } from "@/lib/types";
import { getProductName } from "@/lib/insurance-utils";
import ClientPage from "./client-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isInsuranceProduct(value: unknown): value is InsuranceProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as InsuranceProduct;
  return Boolean(product.compania || product.empresa || product.plan || product.coberturas);
}

function loadProducts(): InsuranceProduct[] {
  const publicDir = join(process.cwd(), "public");
  const files = readdirSync(publicDir)
    .filter((file) => file.endsWith(".json"))
    .filter((file) => file !== "test_fixture.json")
    .sort((a, b) => a.localeCompare(b));

  return files
    .map((filename) => {
      try {
        const content = readFileSync(join(publicDir, filename), "utf-8");
        const parsed = JSON.parse(content);
        return isInsuranceProduct(parsed) ? parsed : null;
      } catch (error) {
        console.error(`No se pudo leer ${filename}:`, error);
        return null;
      }
    })
    .filter((product): product is InsuranceProduct => product !== null)
    .sort((a, b) => getProductName(a).localeCompare(getProductName(b)));
}

export default async function Page() {
  return <ClientPage initialProducts={loadProducts()} />;
}
