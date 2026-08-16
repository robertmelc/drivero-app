import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, hashPassword, createInviteToken } from "@/lib/auth";
import { sendDriverInviteEmail } from "@/lib/mailer";

const UserCreateSchema = z.object({
  email: z.string().email(),
  role: z.enum(["driver", "accountant"]),
});

// GET /api/users — admin/accountant see everyone with a membership at this
// company. Scoped via CompanyMembership, not the user's legacy companyId —
// someone invited here from elsewhere only has a membership row, not this
// company as their default. The returned role is the one AT THIS company
// (from the membership), which can differ from the user's legacy default role.
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;
  if (!requireRole(session, ["admin", "accountant"])) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const memberships = await prisma.companyMembership.findMany({
    where: { companyId: session.companyId },
    include: { user: { select: { id: true, email: true, status: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  const users = memberships.map((m) => ({
    id: m.user.id,
    email: m.user.email,
    role: m.role,
    status: m.user.status,
    createdAt: m.user.createdAt,
  }));

  return Response.json({ users });
}

// POST /api/users — admin only.
// - Brand-new e-mail: creates the account with a random password the admin
//   never sees, adds a CompanyMembership, then e-mails an invite link so the
//   person can set their own password and log in themselves.
// - E-mail already belongs to someone at THIS company: 409, no duplicate.
// - E-mail belongs to someone at a DIFFERENT company: that's just a second
//   membership on their existing account — no new user, no new password, no
//   invite e-mail (they already have a working login). They'll see the
//   company/role picker next time they log in (see /api/auth/login).
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

  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  if (!company) return Response.json({ error: "Firma nenalezena" }, { status: 404 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (existing) {
    const existingMembership = await prisma.companyMembership.findFirst({
      where: { userId: existing.id, companyId: session.companyId },
    });
    if (existingMembership) {
      return Response.json({ error: "Uživatel je již členem této firmy" }, { status: 409 });
    }

    await prisma.companyMembership.create({
      data: { userId: existing.id, companyId: session.companyId, role: parsed.data.role },
    });

    return Response.json(
      {
        user: { id: existing.id, email: existing.email, role: parsed.data.role },
        message:
          "Existující uživatel byl přidán k vaší firmě. Přihlásí se svým stávajícím heslem a appka mu nabídne výběr firmy.",
      },
      { status: 201 }
    );
  }

  // Nobody ever sees this password — it's immediately replaced when the
  // invite link is used to set a real one.
  const placeholderPassword = crypto.randomBytes(24).toString("hex");
  const passwordHash = await hashPassword(placeholderPassword);

  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        companyId: session.companyId,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        status: "active",
        startedAt: new Date(),
      },
    });
    await tx.companyMembership.create({
      data: { userId: user.id, companyId: session.companyId, role: parsed.data.role },
    });
    return user;
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
