import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";

const ServiceRecordSchema = z.object({
  type: z.enum(["regular_service", "repair", "tires", "other"]),
  serviceDate: z.string().datetime(),
  odometerKm: z.number().int().nonnegative(),
  supplier: z.string().optional(),
  costAmount: z.number().nonnegative(),
  nextServiceDueDate: z.string().datetime().optional(),
  nextServiceDueKm: z.number().int().nonnegative().optional(),
});

// GET /api/vehicles/:id/service-records
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, companyId: session.companyId },
  });
  if (!vehicle) return Response.json({ error: "Vozidlo nenalezeno" }, { status: 404 });

  const records = await prisma.serviceRecord.findMany({
    where: { vehicleId: vehicle.id },
    orderBy: { serviceDate: "desc" },
  });

  return Response.json({ records });
}

// POST /api/vehicles/:id/service-records — admin only
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (!requireRole(session, ["admin"])) {
    return Response.json({ error: "Pouze administrátor může přidávat servisní záznamy" }, { status: 403 });
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, companyId: session.companyId },
  });
  if (!vehicle) return Response.json({ error: "Vozidlo nenalezeno" }, { status: 404 });

  const body = await req.json();
  const parsed = ServiceRecordSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const record = await prisma.serviceRecord.create({
    data: {
      vehicleId: vehicle.id,
      type: parsed.data.type,
      serviceDate: new Date(parsed.data.serviceDate),
      odometerKm: parsed.data.odometerKm,
      supplier: parsed.data.supplier,
      costAmount: parsed.data.costAmount,
      nextServiceDueDate: parsed.data.nextServiceDueDate ? new Date(parsed.data.nextServiceDueDate) : undefined,
      nextServiceDueKm: parsed.data.nextServiceDueKm,
    },
  });

  return Response.json({ record }, { status: 201 });
}
