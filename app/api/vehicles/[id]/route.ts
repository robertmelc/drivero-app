import { z } from "zod";
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

// Whitelist — same shape as vehicle creation, everything optional so a partial
// edit (e.g. just the odometer) doesn't require resending every field.
// This replaces the previous `data: body` passthrough, which would have
// written ANY key sent in the request body (including things like companyId)
// straight to the database.
const VehicleUpdateSchema = z.object({
  spz: z.string().min(1).optional(),
  vin: z.string().min(1).optional(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().optional(),
  fuelType: z.enum(["petrol", "diesel", "electric", "hybrid", "lpg"]).optional(),
  ownershipType: z.enum(["owned", "finance_lease", "operating_lease"]).optional(),
  odometerKm: z.number().int().nonnegative().optional(),
  stkValidUntil: z.string().datetime().nullable().optional(),
  vignetteValidUntil: z.string().datetime().nullable().optional(),
  insuranceLiabilityValidUntil: z.string().datetime().nullable().optional(),
  insuranceProvider: z.string().nullable().optional(),
  parkingCardValidUntil: z.string().datetime().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (!requireRole(session, ["admin", "accountant"])) {
    return Response.json({ error: "Pouze administrátor nebo účetní může upravovat vozidla" }, { status: 403 });
  }

  const existing = await prisma.vehicle.findFirst({
    where: { id: params.id, companyId: session.companyId },
  });
  if (!existing) return Response.json({ error: "Vozidlo nenalezeno" }, { status: 404 });

  const body = await req.json();
  const parsed = VehicleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = {
    ...parsed.data,
    stkValidUntil: parsed.data.stkValidUntil ? new Date(parsed.data.stkValidUntil) : parsed.data.stkValidUntil,
    vignetteValidUntil: parsed.data.vignetteValidUntil ? new Date(parsed.data.vignetteValidUntil) : parsed.data.vignetteValidUntil,
    insuranceLiabilityValidUntil: parsed.data.insuranceLiabilityValidUntil
      ? new Date(parsed.data.insuranceLiabilityValidUntil)
      : parsed.data.insuranceLiabilityValidUntil,
    parkingCardValidUntil: parsed.data.parkingCardValidUntil
      ? new Date(parsed.data.parkingCardValidUntil)
      : parsed.data.parkingCardValidUntil,
  };

  const vehicle = await prisma.vehicle.update({ where: { id: params.id }, data });

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
