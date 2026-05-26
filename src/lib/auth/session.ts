import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

export const sessionCookieName = "ruley_session";
const tokenExpiry = "7d";
const tokenMaxAge = 60 * 60 * 24 * 7;

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET must be configured.");
  return new TextEncoder().encode(secret);
};

export const verifyAdminPassword = (password: unknown) =>
  typeof password === "string" && password === process.env.ADMIN_PASSWORD;

export const createSessionToken = async () =>
  new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("ruley")
    .setAudience("ruley-admin")
    .setIssuedAt()
    .setExpirationTime(tokenExpiry)
    .sign(getSecret());

export const verifySessionToken = async (token?: string) => {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: "ruley",
      audience: "ruley-admin",
    });
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
};

export const getSession = async () => {
  const store = await cookies();
  return verifySessionToken(store.get(sessionCookieName)?.value);
};

export const requireSession = async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
};

export const getSessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: tokenMaxAge,
});
