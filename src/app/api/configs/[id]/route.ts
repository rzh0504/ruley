import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { configs } from "@/lib/db/schema";
import { jsonError, requireApiSession } from "@/lib/api/response";
import { buildCurrentConfig } from "@/lib/server/config";
import { configUpdateSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const session = await requireApiSession(request);
  if (!session) return jsonError("未登录", 401);

  const id = Number((await params).id);
  const [row] = await db.select().from(configs).where(eq(configs.id, id)).limit(1);
  if (!row) return jsonError("配置不存在", 404);
  return NextResponse.json({ success: true, config: row });
}

export async function PUT(request: Request, { params }: Params) {
  const session = await requireApiSession(request);
  if (!session) return jsonError("未登录", 401);

  const id = Number((await params).id);
  const body = configUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return jsonError("请求数据无效");

  try {
    const [existing] = await db.select().from(configs).where(eq(configs.id, id)).limit(1);
    if (!existing) return jsonError("配置不存在", 404);

    const proxyGroups = body.data.proxyGroups ?? existing.proxyGroups;
    const rules = body.data.rules ?? existing.rules;
    const parsedNodes = body.data.parsedNodes ?? existing.parsedNodes ?? undefined;
    const settings = body.data.settings ?? existing.settings;
    const urls = body.data.urls ?? existing.urls;
    const current = await buildCurrentConfig({ urls, parsedNodes, proxyGroups, rules, settings });

    await db.update(configs).set({
      name: body.data.name ?? existing.name,
      urls,
      settings,
      proxyGroups,
      rules,
      nodeCount: current.nodeCount,
      parsedNodes: current.proxies,
      generatedConfig: current.yamlStr,
      updatedAt: new Date(),
    }).where(eq(configs.id, id));

    return NextResponse.json({ success: true, message: "配置已更新" });
  } catch (error) {
    console.error("[CONFIGS] Update error:", error);
    return jsonError("配置更新失败", 500);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await requireApiSession(request);
  if (!session) return jsonError("未登录", 401);

  const id = Number((await params).id);
  const [row] = await db.delete(configs).where(eq(configs.id, id)).returning({ id: configs.id });
  if (!row) return jsonError("配置不存在", 404);
  return NextResponse.json({ success: true, message: "配置已删除" });
}
