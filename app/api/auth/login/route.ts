import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Zadejte platný e-mail a heslo" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status === "disabled") {
    return Response.json({ error: "Nesprávný e-mail nebo heslo" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Nesprávný e-mail nebo heslo" }, { status: 401 });
  }

  const token = await createSessionToken({
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
    email: user.email,
  });
  await setSessionCookie(token);

  return Response.json({ user: { id: user.id, email: user.email, role: user.role } });
}
