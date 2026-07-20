import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, companyId: session.companyId },
    include: {
      assignments: { where: { validTo: null }, include: { user: true } },
      serviceRecords: { orderBy: { serviceDate: "desc" } },
      handoverProtocols: { orderBy: { protocolDate: "desc" }, take: 1 },
    },
  });

  if (!vehicle) return Response.json({ error: "Vozidlo nenalezeno" }, { status: 404 });

  // Drivers may only view a vehicle currently assigned to them
  if (session.role === "driver") {
    const isAssigned = vehicle.assignments.some((a) => a.userId === session.userId);
    if (!isAssigned) return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ vehicle });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (!requireRole(session, ["admin"])) {
    return Response.json({ error: "Pouze administrátor může upravovat vozidla" }, { status: 403 });
  }

  const existing = await prisma.vehicle.findFirst({
    where: { id: params.id, companyId: session.companyId },
  });
  if (!existing) return Response.json({ error: "Vozidlo nenalezeno" }, { status: 404 });

  const body = await req.json();
  const vehicle = await prisma.vehicle.update({ where: { id: params.id }, data: body });

  await prisma.auditLog.create({
    data: {
      companyId: session.companyId,
      userId: session.userId,
      entityType: "vehicle",
      entityId: vehicle.id,
      action: "update",
      diff: { before: existing, after: vehicle },
    },
  });

  return Response.json({ vehicle });
}
