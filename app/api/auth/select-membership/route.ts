import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyMembershipSelectionToken, createSessionToken, setSessionCookie } from "@/lib/auth";

const SelectMembershipSchema = z.object({
  selectionToken: z.string().min(1),
  membershipId: z.string().uuid(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = SelectMembershipSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const verified = await verifyMembershipSelectionToken(parsed.data.selectionToken);
  if (!verified) {
    return Response.json({ error: "Výběr vypršel, přihlaste se prosím znovu" }, { status: 401 });
  }

  const membership = await prisma.companyMembership.findFirst({
    where: { id: parsed.data.membershipId, userId: verified.userId },
  });
  if (!membership) {
    return Response.json({ error: "Členství nenalezeno" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: verified.userId } });
  if (!user) {
    return Response.json({ error: "Uživatel nenalezen" }, { status: 404 });
  }

  const token = await createSessionToken({
    userId: user.id,
    companyId: membership.companyId,
    role: membership.role,
    email: user.email,
  });
  await setSessionCookie(token);

  return Response.json({ ok: true, role: membership.role });
}
