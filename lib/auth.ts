import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-only-secret-change-me"
);
const SESSION_COOKIE = "drivero_session";
const SESSION_DURATION_DAYS = 30;
const INVITE_DURATION_DAYS = 7;

export type SessionPayload = {
  userId: string;
  companyId: string;
  role: "admin" | "accountant" | "driver";
  email: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Reads and verifies the session from the request cookies. Use in Server Components and Route Handlers. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DURATION_DAYS,
  });
}

export async function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

/** Throws-free guard for Route Handlers: returns the session or a 401 response. */
export async function requireSession(): Promise<
  { session: SessionPayload; error: null } | { session: null; error: Response }
> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

export function requireRole(session: SessionPayload, roles: SessionPayload["role"][]): boolean {
  return roles.includes(session.role);
}

// --- Driver invite tokens ---
// Reuses the same signing secret as sessions but with a distinct `purpose` claim
// so an invite token can never be mistaken for (or reused as) a session token.
// Stateless by design — no extra DB table or migration needed.

export async function createInviteToken(userId: string): Promise<string> {
  return new SignJWT({ userId, purpose: "invite" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${INVITE_DURATION_DAYS}d`)
    .sign(JWT_SECRET);
}

export async function verifyInviteToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.purpose !== "invite" || typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
