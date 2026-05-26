import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/response";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireApiSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }
  return NextResponse.json({ success: true, user: { role: "admin" } });
}
