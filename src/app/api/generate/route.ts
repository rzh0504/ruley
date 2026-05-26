import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api/response";
import { generateConfig, type GenerateRequest } from "@/lib/server/generator";
import { generateSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireApiSession(request);
  if (!session) return jsonError("未登录", 401);

  const body = generateSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return jsonError("proxies array is required.");

  try {
    const config = generateConfig(body.data as unknown as GenerateRequest);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("[GEN] Error:", error);
    return jsonError("生成失败", 500);
  }
}
