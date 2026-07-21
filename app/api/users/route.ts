import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, hashPassword } from "@/lib/auth";

const UserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["driver", "accountant"]),
});

// GET /api/users — admin/accountant see everyone in the company
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;
  if (!requireRole(session, ["admin", "accountant"])) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { companyId: session.companyId },
    select: { id: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ users });
}

// POST /api/users — admin only. Creates a driver/accountant account directly and
// activates it immediately (a full e-mail invite flow can replace this later).
export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (!requireRole(session, ["admin"])) {
    return Response.json({ error: "Pouze administrátor může přidávat uživatele" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UserCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return Response.json({ error: "E-mail je již registrován" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      companyId: session.companyId,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      status: "active",
      startedAt: new Date(),
    },
  });

  return Response.json({ user: { id: user.id, email: user.email, role: user.role } }, { status: 201 });
}
