import { readdirSync, readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const publicDir = join(process.cwd(), "public");
    const jsonFiles = readdirSync(publicDir)
      .filter((file) => file.endsWith(".json"))
      .filter((file) => file !== "test_fixture.json")
      .sort((a, b) => a.localeCompare(b));

    const data = jsonFiles.map((filename) => {
      const content = readFileSync(join(publicDir, filename), "utf-8");
      return {
        filename,
        data: JSON.parse(content),
      };
    });

    return Response.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Error leyendo los JSON de seguros:", err);
    return Response.json([], { status: 500 });
  }
}
