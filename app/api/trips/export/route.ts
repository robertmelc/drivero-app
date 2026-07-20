import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

// GET /api/trips/export?vehicleId=&month=YYYY-MM
export async function GET(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId") ?? undefined;
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  const [y, m] = month.split("-").map(Number);
  const where: Record<string, unknown> = {
    vehicle: { companyId: session.companyId },
    tripDate: { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) },
  };
  if (vehicleId) where.vehicleId = vehicleId;
  if (session.role === "driver") where.userId = session.userId;

  const trips = await prisma.tripLogEntry.findMany({
    where,
    include: { vehicle: { select: { spz: true, make: true, model: true } }, user: { select: { email: true } } },
    orderBy: [{ vehicleId: "asc" }, { sequenceNumber: "asc" }],
  });

  const rows = trips.map((t) => ({
    "Č.": t.sequenceNumber,
    Datum: t.tripDate.toISOString().slice(0, 10),
    SPZ: t.vehicle.spz,
    Vozidlo: `${t.vehicle.make} ${t.vehicle.model}`,
    Řidič: t.user.email,
    Odjezd: t.startLocation,
    Cíl: t.endLocation,
    Účel: t.purpose,
    Typ: t.tripType === "business" ? "Služební" : "Soukromá",
    "Km start": t.odometerStartKm,
    "Km cíl": t.odometerEndKm,
    "Km celkem": t.distanceKm,
    Poznámka: t.note ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Kniha jízd");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="kniha-jizd-${month}.xlsx"`,
    },
  });
}
