import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieOptions,
  sessionCookieName,
  verifyAdminPassword,
} from "@/lib/auth/session";
import { jsonError } from "@/lib/api/response";
import { loginSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    return jsonError("ADMIN_PASSWORD and JWT_SECRET must be configured.", 500);
  }

  const body = loginSchema.safeParse(await request.json().catch(() => null));
  if (!body.success || !verifyAdminPassword(body.data.password)) {
    return jsonError("密码错误", 401);
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookieName, token, getSessionCookieOptions());
  return response;
}
