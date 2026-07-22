import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

const FuelExpenseCreateSchema = z.object({
  expenseDate: z.string().datetime(),
  liters: z.number().positive().optional(),
  amount: z.number().positive(),
  odometerKm: z.number().int().nonnegative().optional(),
  photoUrl: z.string().url().optional(),
});

// POST /api/vehicles/:id/fuel-expenses — logs a fuel purchase for the current user
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, companyId: session.companyId },
  });
  if (!vehicle) return Response.json({ error: "Vozidlo nenalezeno" }, { status: 404 });

  const body = await req.json();
  const parsed = FuelExpenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  let fuelExpense = await prisma.fuelExpense.create({
    data: {
      vehicleId: vehicle.id,
      userId: session.userId,
      expenseDate: new Date(data.expenseDate),
      liters: data.liters,
      amount: data.amount,
      odometerKm: data.odometerKm,
    },
  });

  // The receipt photo is optional — only wire up a Document once we actually have one.
  if (data.photoUrl) {
    const document = await prisma.document.create({
      data: {
        companyId: session.companyId,
        ownerType: "fuel_expense",
        ownerId: fuelExpense.id,
        fileUrl: data.photoUrl,
        uploadedBy: session.userId,
      },
    });
    fuelExpense = await prisma.fuelExpense.update({
      where: { id: fuelExpense.id },
      data: { documentId: document.id },
    });
  }

  // Same convention as trips/handover protocols — a fresh odometer reading updates the vehicle.
  if (data.odometerKm && data.odometerKm > vehicle.odometerKm) {
    await prisma.vehicle.update({ where: { id: vehicle.id }, data: { odometerKm: data.odometerKm } });
  }

  return Response.json({ fuelExpense }, { status: 201 });
}
