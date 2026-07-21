import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyInviteToken, hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

const AcceptSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = AcceptSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const invite = await verifyInviteToken(parsed.data.token);
  if (!invite) {
    return Response.json({ error: "Odkaz je neplatný nebo vypršel" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: invite.userId } });
  if (!user) {
    return Response.json({ error: "Uživatel nenalezen" }, { status: 404 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash, status: "active" } });

  const token = await createSessionToken({
    userId: user.id,
    companyId: user.companyId,
    role: user.role as "admin" | "accountant" | "driver",
    email: user.email,
  });
  await setSessionCookie(token);

  return Response.json({ ok: true, role: user.role });
}
