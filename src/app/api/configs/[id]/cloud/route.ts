import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { configs } from "@/lib/db/schema";
import { jsonError, requireApiSession } from "@/lib/api/response";
import { buildPublicUrl, buildSubUrl, createCloudToken } from "@/lib/server/config";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession(request);
  if (!session) return jsonError("未登录", 401);

  const id = Number((await params).id);
  const [row] = await db.select().from(configs).where(eq(configs.id, id)).limit(1);
  if (!row) return jsonError("配置不存在", 404);

  const token = row.cloudToken || createCloudToken();
  const subUrl = buildSubUrl(token, row.name);
  await db.update(configs).set({
    cloudToken: token,
    cloudUrl: subUrl,
    updatedAt: new Date(),
  }).where(eq(configs.id, id));

  return NextResponse.json({
    success: true,
    token,
    subUrl,
    cloudUrl: buildPublicUrl(request, subUrl),
  });
}
