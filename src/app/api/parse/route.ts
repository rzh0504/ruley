import { NextResponse } from "next/server";
import { jsonError, requireApiSession } from "@/lib/api/response";
import { parseInput } from "@/lib/server/parser";
import { getActiveSubscriptionInput } from "@/lib/subscription-sources";
import { parseSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireApiSession(request);
  if (!session) return jsonError("未登录", 401);

  const body = parseSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return jsonError('"urls" string is required.');

  try {
    const result = await parseInput(getActiveSubscriptionInput(body.data.urls));
    return NextResponse.json({
      success: true,
      nodesCount: result.proxies.length,
      proxies: result.proxies,
      errors: result.errors.length > 0 ? result.errors : undefined,
      diagnostics: result.diagnostics.length > 0 ? result.diagnostics : undefined,
    });
  } catch (error) {
    console.error("[PARSE] Error:", error);
    return jsonError("解析失败", 500);
  }
}
