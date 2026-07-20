import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

const TripCreateSchema = z.object({
  vehicleId: z.string().uuid(),
  tripDate: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  startLocation: z.string().min(1),
  endLocation: z.string().min(1),
  purpose: z.string().min(1),
  tripType: z.enum(["business", "private"]),
  odometerStartKm: z.number().int().nonnegative(),
  odometerEndKm: z.number().int().nonnegative(),
  note: z.string().optional(),
});

// GET /api/trips?vehicleId=&userId=&month=YYYY-MM
export async function GET(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId") ?? undefined;
  const month = searchParams.get("month") ?? undefined; // "YYYY-MM"

  const where: Record<string, unknown> = {
    vehicle: { companyId: session.companyId },
  };
  if (vehicleId) where.vehicleId = vehicleId;
  // Drivers only ever see their own trips
  if (session.role === "driver") where.userId = session.userId;

  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.tripDate = {
      gte: new Date(Date.UTC(y, m - 1, 1)),
      lt: new Date(Date.UTC(y, m, 1)),
    };
  }

  const trips = await prisma.tripLogEntry.findMany({
    where,
    orderBy: [{ vehicleId: "asc" }, { sequenceNumber: "asc" }],
  });

  return Response.json({ trips });
}

// POST /api/trips — always creates a new sequence-numbered entry (driver's own trip)
export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = TripCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: data.vehicleId, companyId: session.companyId },
  });
  if (!vehicle) return Response.json({ error: "Vozidlo nenalezeno" }, { status: 404 });

  if (data.odometerEndKm < data.odometerStartKm) {
    return Response.json({ error: "Km cíl nemůže být menší než km start" }, { status: 400 });
  }

  // Sequence numbers are assigned atomically per vehicle inside a transaction,
  // and existing entries are never overwritten — see edited_from_id for corrections.
  const trip = await prisma.$transaction(async (tx) => {
    const last = await tx.tripLogEntry.findFirst({
      where: { vehicleId: data.vehicleId },
      orderBy: { sequenceNumber: "desc" },
      select: { sequenceNumber: true },
    });
    const nextSeq = (last?.sequenceNumber ?? 0) + 1;

    const created = await tx.tripLogEntry.create({
      data: {
        vehicleId: data.vehicleId,
        userId: session.userId,
        sequenceNumber: nextSeq,
        tripDate: new Date(data.tripDate),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        purpose: data.purpose,
        tripType: data.tripType,
        odometerStartKm: data.odometerStartKm,
        odometerEndKm: data.odometerEndKm,
        distanceKm: data.odometerEndKm - data.odometerStartKm,
        note: data.note,
      },
    });

    await tx.vehicle.update({
      where: { id: data.vehicleId },
      data: { odometerKm: data.odometerEndKm },
    });

    return created;
  });

  return Response.json({ trip }, { status: 201 });
}
