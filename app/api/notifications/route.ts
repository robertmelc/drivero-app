import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

// GET /api/notifications — admin sees the whole fleet, driver sees only their vehicle's
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const where: Record<string, unknown> = { companyId: session.companyId, status: "pending" };
  if (session.role === "driver") {
    where.vehicle = { assignments: { some: { userId: session.userId, validTo: null } } };
  }

  const notifications = await prisma.notification.findMany({
    where,
    include: { vehicle: { select: { spz: true, make: true, model: true } } },
    orderBy: { dueDate: "asc" },
  });

  return Response.json({ notifications });
}
