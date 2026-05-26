import { desc, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { configs } from "@/lib/db/schema";
import { jsonError, requireApiSession } from "@/lib/api/response";
import { buildCurrentConfig } from "@/lib/server/config";
import { configCreateSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireApiSession(request);
  if (!session) return jsonError("未登录", 401);

  try {
    const rows = await db.select().from(configs).orderBy(isNull(configs.parentId), desc(configs.updatedAt));
    return NextResponse.json({ success: true, configs: rows });
  } catch (error) {
    console.error("[CONFIGS] List error:", error);
    return jsonError("配置列表加载失败", 500);
  }
}

export async function POST(request: Request) {
  const session = await requireApiSession(request);
  if (!session) return jsonError("未登录", 401);

  const body = configCreateSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return jsonError("name and urls are required.");

  try {
    const current = await buildCurrentConfig(body.data);
    const [row] = await db.insert(configs).values({
      name: body.data.name,
      urls: body.data.urls,
      platform: "mihomo",
      settings: body.data.settings,
      proxyGroups: body.data.proxyGroups,
      rules: body.data.rules,
      nodeCount: current.nodeCount,
      parsedNodes: current.proxies,
      generatedConfig: current.yamlStr,
      parentId: body.data.parentId || null,
    }).returning({ id: configs.id });

    return NextResponse.json({ success: true, id: row.id, message: "配置已保存" });
  } catch (error) {
    console.error("[CONFIGS] Create error:", error);
    return jsonError("配置保存失败", 500);
  }
}
