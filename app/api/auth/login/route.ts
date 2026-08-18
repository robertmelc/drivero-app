import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, setSessionCookie, createMembershipSelectionToken } from "@/lib/auth";

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

  const memberships = await prisma.companyMembership.findMany({
    where: { userId: user.id },
    include: { company: { select: { name: true } } },
  });

  // Exactly one membership — behaves exactly like today, straight to a session.
  if (memberships.length === 1) {
    const m = memberships[0];
    const token = await createSessionToken({
      userId: user.id,
      companyId: m.companyId,
      role: m.role,
      email: user.email,
    });
    await setSessionCookie(token);
    return Response.json({ user: { id: user.id, email: user.email, role: m.role } });
  }

  // More than one — password is verified, but don't set a session yet; the
  // client picks a company/role first via /api/auth/select-membership.
  if (memberships.length > 1) {
    const selectionToken = await createMembershipSelectionToken(user.id);

    // For driver memberships, show which vehicle it is — company name alone
    // doesn't help a driver tell two memberships apart at a glance.
    const driverCompanyIds = memberships.filter((m) => m.role === "driver").map((m) => m.companyId);
    const assignments = driverCompanyIds.length
      ? await prisma.vehicleAssignment.findMany({
          where: { userId: user.id, validTo: null, vehicle: { companyId: { in: driverCompanyIds } } },
          include: { vehicle: { select: { spz: true, make: true, model: true, companyId: true } } },
        })
      : [];
    const vehicleByCompanyId = new Map(assignments.map((a) => [a.vehicle.companyId, a.vehicle]));

    return Response.json({
      selectionRequired: true,
      selectionToken,
      memberships: memberships.map((m) => ({
        id: m.id,
        companyName: m.company.name,
        role: m.role,
        vehicle: m.role === "driver" ? vehicleByCompanyId.get(m.companyId) ?? null : null,
      })),
    });
  }

  // No membership rows yet — happens for anyone registered/invited before the
  // CompanyMembership backfill, or before phase 3 wires membership creation
  // into register/invite. Fall back to the legacy fields so login keeps
  // working exactly as before until that's in place.
  const token = await createSessionToken({
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
    email: user.email,
  });
  await setSessionCookie(token);
  return Response.json({ user: { id: user.id, email: user.email, role: user.role } });
}
