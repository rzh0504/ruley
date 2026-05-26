import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { configs } from "@/lib/db/schema";
import { buildCurrentConfig, getSafeFilename } from "@/lib/server/config";

export const runtime = "nodejs";

const SUBSCRIPTION_CACHE_TTL_MS = Number(process.env.SUBSCRIPTION_CACHE_TTL_MS || 5 * 60 * 1000);

const createYamlResponse = (yaml: string, name: string, cacheStatus: "HIT" | "MISS" | "STALE") =>
  new Response(yaml, {
    headers: {
      "Content-Type": "text/yaml; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${getSafeFilename(name)}.yaml`)}`,
      "X-Ruley-Cache": cacheStatus,
    },
  });

export async function GET(_request: Request, { params }: { params: Promise<{ token: string; name?: string[] }> }) {
  const { token } = await params;
  let row: typeof configs.$inferSelect | undefined;
  try {
    [row] = await db.select().from(configs).where(eq(configs.cloudToken, token)).limit(1);
    if (!row) return new Response("Config not found.", { status: 404 });

    const cacheAge = Date.now() - new Date(row.updatedAt).getTime();
    if (row.generatedConfig && cacheAge >= 0 && cacheAge < SUBSCRIPTION_CACHE_TTL_MS) {
      return createYamlResponse(row.generatedConfig, row.name, "HIT");
    }

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

    return createYamlResponse(current.yamlStr, row.name, "MISS");
  } catch (error) {
    console.error("[SUB] Generation error:", error);
    if (row?.generatedConfig) {
      return createYamlResponse(row.generatedConfig, row.name, "STALE");
    }
    return new Response("Error generating config.", { status: 500 });
  }
}
