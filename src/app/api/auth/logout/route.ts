import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookieName, "", { path: "/", maxAge: 0 });
  return response;
}
