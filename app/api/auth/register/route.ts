import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

const RegisterSchema = z.object({
  companyName: z.string().min(2),
  ico: z.string().min(6).max(12),
  adminName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { companyName, ico, adminName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "E-mail je již registrován" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const company = await prisma.company.create({
    data: {
      name: companyName,
      ico,
      users: {
        create: {
          email,
          passwordHash,
          role: "admin",
          status: "active",
          startedAt: new Date(),
          // Name is stored as a single field for simplicity here;
          // split into first/last name if your form collects them separately.
        },
      },
    },
    include: { users: true },
  });

  const admin = company.users[0];

  const token = await createSessionToken({
    userId: admin.id,
    companyId: company.id,
    role: "admin",
    email: admin.email,
  });
  await setSessionCookie(token);

  return Response.json(
    { company: { id: company.id, name: company.name }, user: { id: admin.id, email: admin.email } },
    { status: 201 }
  );
}
