import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";

const AssignSchema = z.object({ userId: z.string().uuid() });

// POST /api/vehicles/:id/assignments — admin only
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (!requireRole(session, ["admin"])) {
    return Response.json({ error: "Pouze administrátor může přiřazovat řidiče" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = AssignSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, companyId: session.companyId },
  });
  if (!vehicle) return Response.json({ error: "Vozidlo nenalezeno" }, { status: 404 });

  const driver = await prisma.user.findFirst({
    where: { id: parsed.data.userId, companyId: session.companyId, role: "driver" },
  });
  if (!driver) return Response.json({ error: "Řidič nenalezen" }, { status: 404 });

  const assignment = await prisma.$transaction(async (tx) => {
    // Close any currently open assignment for this vehicle
    await tx.vehicleAssignment.updateMany({
      where: { vehicleId: vehicle.id, validTo: null },
      data: { validTo: new Date() },
    });

    return tx.vehicleAssignment.create({
      data: { vehicleId: vehicle.id, userId: driver.id, validFrom: new Date() },
    });
  });

  return Response.json({ assignment }, { status: 201 });
}
