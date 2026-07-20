import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

/**
 * PATCH /api/trips/:id
 * Trips are append-only once `locked`. Editing a locked trip does not overwrite it —
 * it creates a new entry referencing the original via `editedFromId`, preserving
 * the audit trail that a controlling authority (finanční úřad) would expect.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const original = await prisma.tripLogEntry.findFirst({
    where: { id: params.id, vehicle: { companyId: session.companyId } },
  });
  if (!original) return Response.json({ error: "Záznam nenalezen" }, { status: 404 });
  if (session.role === "driver" && original.userId !== session.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (!original.locked) {
    const updated = await prisma.tripLogEntry.update({ where: { id: original.id }, data: body });
    return Response.json({ trip: updated });
  }

  // Locked: create a correcting entry instead of mutating history
  const last = await prisma.tripLogEntry.findFirst({
    where: { vehicleId: original.vehicleId },
    orderBy: { sequenceNumber: "desc" },
    select: { sequenceNumber: true },
  });

  const correction = await prisma.tripLogEntry.create({
    data: {
      ...original,
      id: undefined,
      sequenceNumber: (last?.sequenceNumber ?? 0) + 1,
      ...body,
      locked: false,
      editedFromId: original.id,
      createdAt: undefined,
    },
  });

  return Response.json({ trip: correction, note: "Vytvořen opravný záznam, původní zůstal zachován" }, { status: 201 });
}

// POST /api/trips/:id/lock is implemented as a company-wide monthly job in production;
// this endpoint exists for manually locking a single entry during development/testing.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (session.role !== "admin") {
    return Response.json({ error: "Pouze administrátor může uzavřít záznam" }, { status: 403 });
  }

  const trip = await prisma.tripLogEntry.update({
    where: { id: params.id },
    data: { locked: true },
  });
  return Response.json({ trip });
}
