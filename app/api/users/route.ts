import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, hashPassword, createInviteToken } from "@/lib/auth";
import { sendDriverInviteEmail } from "@/lib/mailer";

const UserCreateSchema = z.object({
  email: z.string().email(),
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

// POST /api/users — admin only. Creates the account with a random password the
// admin never sees, then e-mails the person an invite link so they can set
// their own password and log in themselves.
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

  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  if (!company) return Response.json({ error: "Firma nenalezena" }, { status: 404 });

  // Nobody ever sees this password — it's immediately replaced when the
  // invite link is used to set a real one.
  const placeholderPassword = crypto.randomBytes(24).toString("hex");
  const passwordHash = await hashPassword(placeholderPassword);

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

  const inviteToken = await createInviteToken(user.id);
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/accept?token=${inviteToken}`;

  try {
    await sendDriverInviteEmail(user.email, inviteUrl, company.name);
  } catch (e) {
    // The account exists either way — surface the mail failure separately so
    // the admin knows to resend or share the link manually, without losing the user.
    return Response.json(
      { user: { id: user.id, email: user.email, role: user.role }, mailError: e instanceof Error ? e.message : "Odeslání e-mailu selhalo" },
      { status: 201 }
    );
  }

  return Response.json({ user: { id: user.id, email: user.email, role: user.role } }, { status: 201 });
}
