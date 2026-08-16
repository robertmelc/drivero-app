import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, createSessionToken, setSessionCookie } from "@/lib/auth";

const SwitchSchema = z.object({ membershipId: z.string().uuid() });

// POST /api/auth/switch — re-mint the session for a different membership of
// the ALREADY authenticated user. No password re-entry: requireSession()
// proves who they are, this just checks the target membership is actually
// theirs before swapping companyId/role in the cookie.
export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = SwitchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const membership = await prisma.companyMembership.findFirst({
    where: { id: parsed.data.membershipId, userId: session.userId },
  });
  if (!membership) {
    return Response.json({ error: "Členství nenalezeno" }, { status: 404 });
  }

  const token = await createSessionToken({
    userId: session.userId,
    companyId: membership.companyId,
    role: membership.role,
    email: session.email,
  });
  await setSessionCookie(token);

  return Response.json({ ok: true, role: membership.role });
}
