import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

// The schema has no dedicated signature-image columns, only the signedByX booleans/timestamps.
// We store the actual PNG data URLs (and the photo URLs) inside the existing `photos` Json
// column as { images, adminSignature, driverSignature } — no migration needed.
const ProtocolSchema = z.object({
  type: z.enum(["handover", "return"]),
  userId: z.string().uuid(),
  protocolDate: z.string().datetime(),
  odometerKm: z.number().int().nonnegative(),
  conditionNotes: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
  adminSignatureDataUrl: z.string().optional(),
  driverSignatureDataUrl: z.string().optional(),
});

// GET /api/vehicles/:id/handover-protocols
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, companyId: session.companyId },
  });
  if (!vehicle) return Response.json({ error: "Vozidlo nenalezeno" }, { status: 404 });

  const protocols = await prisma.handoverProtocol.findMany({
    where: { vehicleId: vehicle.id },
    orderBy: { protocolDate: "desc" },
    include: { driver: { select: { email: true } } },
  });

  return Response.json({ protocols });
}

// POST /api/vehicles/:id/handover-protocols — admin only
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (session.role !== "admin") {
    return Response.json({ error: "Pouze administrátor může vytvořit protokol" }, { status: 403 });
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, companyId: session.companyId },
  });
  if (!vehicle) return Response.json({ error: "Vozidlo nenalezeno" }, { status: 404 });

  const body = await req.json();
  const parsed = ProtocolSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const driver = await prisma.user.findFirst({
    where: { id: data.userId, companyId: session.companyId, role: "driver" },
  });
  if (!driver) return Response.json({ error: "Řidič nenalezen" }, { status: 404 });

  const now = new Date();

  const protocol = await prisma.handoverProtocol.create({
    data: {
      vehicleId: vehicle.id,
      userId: driver.id,
      type: data.type,
      protocolDate: new Date(data.protocolDate),
      odometerKm: data.odometerKm,
      conditionNotes: data.conditionNotes,
      photos: {
        images: data.photos ?? [],
        adminSignature: data.adminSignatureDataUrl ?? null,
        driverSignature: data.driverSignatureDataUrl ?? null,
      },
      signedByAdmin: !!data.adminSignatureDataUrl,
      signedByAdminAt: data.adminSignatureDataUrl ? now : undefined,
      signedByDriver: !!data.driverSignatureDataUrl,
      signedByDriverAt: data.driverSignatureDataUrl ? now : undefined,
    },
  });

  // A handover/return is a real odometer reading — keep the vehicle's stored value in sync.
  if (data.odometerKm > vehicle.odometerKm) {
    await prisma.vehicle.update({ where: { id: vehicle.id }, data: { odometerKm: data.odometerKm } });
  }

  return Response.json({ protocol }, { status: 201 });
}
