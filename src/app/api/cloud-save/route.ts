import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { configs } from "@/lib/db/schema";
import { jsonError, requireApiSession } from "@/lib/api/response";
import {
  buildCurrentConfig,
  buildSubUrl,
  createCloudToken,
  getSubscriptionName,
} from "@/lib/server/config";
import { cloudSaveSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireApiSession(request);
  if (!session) return jsonError("未登录", 401);

  const body = cloudSaveSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return jsonError("urls is required");
  const data = body.data;
  const configName = getSubscriptionName(data.name);

  try {
    const current = await buildCurrentConfig(data);
    if (data.configId) {
      const [existing] = await db.select().from(configs).where(eq(configs.id, data.configId)).limit(1);
      if (existing) {
        const token = existing.cloudToken || createCloudToken();
        const subUrl = buildSubUrl(token, configName);
        await db.update(configs).set({
          name: configName,
          urls: data.urls,
          platform: "mihomo",
          settings: data.settings,
          proxyGroups: data.proxyGroups,
          rules: data.rules,
          nodeCount: current.nodeCount,
          parsedNodes: current.proxies,
          generatedConfig: current.yamlStr,
          cloudToken: token,
          cloudUrl: subUrl,
          updatedAt: new Date(),
        }).where(eq(configs.id, data.configId));
        return NextResponse.json({ success: true, token, subUrl, configId: data.configId });
      }
    }

    const token = createCloudToken();
    const subUrl = buildSubUrl(token, configName);
    const [row] = await db.insert(configs).values({
      name: configName,
      urls: data.urls,
      platform: "mihomo",
      settings: data.settings,
      proxyGroups: data.proxyGroups,
      rules: data.rules,
      nodeCount: current.nodeCount,
      parsedNodes: current.proxies,
      generatedConfig: current.yamlStr,
      cloudToken: token,
      cloudUrl: subUrl,
      parentId: data.parentId || null,
    }).returning({ id: configs.id });

    return NextResponse.json({ success: true, token, subUrl, configId: row.id });
  } catch (error) {
    console.error("[CLOUD] Save error:", error);
    return jsonError("云端配置保存失败", 500);
  }
}
