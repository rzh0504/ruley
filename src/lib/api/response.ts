import { NextResponse } from "next/server";
import { verifySessionToken, sessionCookieName } from "@/lib/auth/session";

export const jsonError = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

export const requireApiSession = async (request: Request) => {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${sessionCookieName}=`));
  const token = cookie ? decodeURIComponent(cookie.slice(sessionCookieName.length + 1)) : undefined;
  const session = await verifySessionToken(token);
  return session;
};
