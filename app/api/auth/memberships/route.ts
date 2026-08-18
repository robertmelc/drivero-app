import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

// GET /api/auth/memberships — every company/role the current user belongs to,
// plus which one is active in the session right now. The CompanySwitcher uses
// this to decide whether to render at all (1 membership → stays hidden).
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const [memberships, user] = await Promise.all([
    prisma.companyMembership.findMany({
      where: { userId: session.userId },
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    // Fresh read, same as requireSuperAdmin() — isSuperAdmin is never in the
    // JWT, so this is the only way the switcher knows whether to show the link.
    prisma.user.findUnique({ where: { id: session.userId }, select: { isSuperAdmin: true } }),
  ]);

  return Response.json({
    memberships: memberships.map((m) => ({
      id: m.id,
      companyId: m.companyId,
      companyName: m.company.name,
      role: m.role,
    })),
    active: { companyId: session.companyId, role: session.role },
    isSuperAdmin: user?.isSuperAdmin ?? false,
  });
}
