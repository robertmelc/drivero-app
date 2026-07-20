import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";

const VehicleCreateSchema = z.object({
  spz: z.string().min(4),
  vin: z.string().min(11).max(17),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().gte(1980).lte(new Date().getFullYear() + 1),
  fuelType: z.enum(["petrol", "diesel", "electric", "hybrid", "lpg"]),
  ownershipType: z.enum(["owned", "finance_lease", "operating_lease"]),
  odometerKm: z.number().int().nonnegative().default(0),
  stkValidUntil: z.string().datetime().optional(),
  vignetteValidUntil: z.string().datetime().optional(),
  insuranceLiabilityValidUntil: z.string().datetime().optional(),
  insuranceProvider: z.string().optional(),
});

// GET /api/vehicles — admin/accountant see the whole fleet, driver sees only assigned vehicles
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  if (session.role === "driver") {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        companyId: session.companyId,
        assignments: { some: { userId: session.userId, validTo: null } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ vehicles });
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
    include: {
      assignments: {
        where: { validTo: null },
        include: { user: { select: { id: true, email: true } } },
      },
    },
  });
  return Response.json({ vehicles });
}

// POST /api/vehicles — admin only
export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (!requireRole(session, ["admin"])) {
    return Response.json({ error: "Pouze administrátor může přidávat vozidla" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = VehicleCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ...parsed.data,
      companyId: session.companyId,
      stkValidUntil: parsed.data.stkValidUntil ? new Date(parsed.data.stkValidUntil) : undefined,
      vignetteValidUntil: parsed.data.vignetteValidUntil
        ? new Date(parsed.data.vignetteValidUntil)
        : undefined,
      insuranceLiabilityValidUntil: parsed.data.insuranceLiabilityValidUntil
        ? new Date(parsed.data.insuranceLiabilityValidUntil)
        : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: session.companyId,
      userId: session.userId,
      entityType: "vehicle",
      entityId: vehicle.id,
      action: "create",
      diff: { after: vehicle },
    },
  });

  return Response.json({ vehicle }, { status: 201 });
}
