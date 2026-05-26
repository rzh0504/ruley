import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { configs } from "@/lib/db/schema";
import { buildCurrentConfig, getSafeFilename } from "@/lib/server/config";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string; name?: string[] }> }) {
  const { token } = await params;
  try {
    const [row] = await db.select().from(configs).where(eq(configs.cloudToken, token)).limit(1);
    if (!row) return new Response("Config not found.", { status: 404 });

    const current = await buildCurrentConfig({
      urls: row.urls,
      proxyGroups: row.proxyGroups,
      rules: row.rules,
      advancedDns: row.advancedDns,
    });

    await db.update(configs).set({
      generatedConfig: current.yamlStr,
      parsedNodes: current.proxies,
      nodeCount: current.nodeCount,
      updatedAt: new Date(),
    }).where(eq(configs.id, row.id));

    return new Response(current.yamlStr, {
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${getSafeFilename(row.name)}.yaml`)}`,
      },
    });
  } catch (error) {
    console.error("[SUB] Generation error:", error);
    return new Response("Error generating config.", { status: 500 });
  }
}
