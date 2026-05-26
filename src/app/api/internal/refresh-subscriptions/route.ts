import { eq, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { configs } from "@/lib/db/schema";
import { buildCurrentConfig } from "@/lib/server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

const disabled = () => NextResponse.json({ success: true, enabled: false, message: "Subscription auto refresh is disabled." });

const misconfigured = () => NextResponse.json({ success: false, error: "CRON_SECRET is required when auto refresh is enabled." }, { status: 500 });

const isAuthorized = (request: Request) => {
  if (process.env.ENABLE_AUTOUPDATE !== "true") return null;

  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
};

const refreshSubscriptions = async (request: Request) => {
  const authorized = isAuthorized(request);
  if (authorized === null) return disabled();
  if (!process.env.CRON_SECRET) return misconfigured();
  if (!authorized) return unauthorized();

  const rows = await db.select().from(configs).where(isNotNull(configs.cloudToken));
  const results: Array<{ id: number; name: string; success: boolean; nodeCount?: number; error?: string }> = [];

  for (const row of rows) {
    try {
      const current = await buildCurrentConfig({
        urls: row.urls,
        proxyGroups: row.proxyGroups,
        rules: row.rules,
        settings: row.settings,
      });

      await db.update(configs).set({
        generatedConfig: current.yamlStr,
        parsedNodes: current.proxies,
        nodeCount: current.nodeCount,
        updatedAt: new Date(),
      }).where(eq(configs.id, row.id));

      results.push({ id: row.id, name: row.name, success: true, nodeCount: current.nodeCount });
    } catch (error) {
      console.error(`[REFRESH] Failed to refresh config ${row.id}:`, error);
      results.push({
        id: row.id,
        name: row.name,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const failed = results.filter((result) => !result.success).length;
  return NextResponse.json({
    success: failed === 0,
    total: rows.length,
    refreshed: rows.length - failed,
    failed,
    results,
  });
};

export const GET = refreshSubscriptions;
export const POST = refreshSubscriptions;
