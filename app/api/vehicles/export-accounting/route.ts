import * as XLSX from "xlsx";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";

// Downloads receipt photos from Supabase Storage and builds the XLSX in
// memory, so this needs the full Node.js runtime, not the Edge runtime.
export const runtime = "nodejs";

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
}

function extensionFromUrl(url: string): string {
  const path = url.split("?")[0];
  const match = /\.([a-zA-Z0-9]+)$/.exec(path);
  return match ? match[1].toLowerCase() : "jpg";
}

// GET /api/vehicles/export-accounting?month=YYYY-MM — admin/accountant only
export async function GET(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (!requireRole(session, ["admin", "accountant"])) {
    return Response.json({ error: "Pouze administrátor nebo účetní může exportovat data" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const { gte, lt } = monthRange(month);

  const [trips, fuelExpenses] = await Promise.all([
    prisma.tripLogEntry.findMany({
      where: { vehicle: { companyId: session.companyId }, tripDate: { gte, lt } },
      include: { vehicle: { select: { spz: true, make: true, model: true } }, user: { select: { email: true } } },
      orderBy: [{ vehicleId: "asc" }, { sequenceNumber: "asc" }],
    }),
    prisma.fuelExpense.findMany({
      where: { vehicle: { companyId: session.companyId }, expenseDate: { gte, lt } },
      include: { vehicle: { select: { spz: true, make: true, model: true } }, user: { select: { email: true } } },
      orderBy: { expenseDate: "asc" },
    }),
  ]);

  const tripRows = trips.map((t) => ({
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

  const fuelRows = fuelExpenses.map((f) => ({
    Datum: f.expenseDate.toISOString().slice(0, 10),
    Litry: f.liters ? Number(f.liters) : "",
    "Cena (Kč)": Number(f.amount),
    SPZ: f.vehicle.spz,
    Vozidlo: `${f.vehicle.make} ${f.vehicle.model}`,
    Řidič: f.user.email,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(tripRows), "Jízdy");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(fuelRows), "Tankování");
  const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  // FuelExpense.documentId isn't a Prisma relation (just a plain FK column),
  // so the receipt Document rows need a separate batched lookup.
  const documentIds = fuelExpenses.map((f) => f.documentId).filter((id): id is string => !!id);
  const documents = documentIds.length
    ? await prisma.document.findMany({ where: { id: { in: documentIds } } })
    : [];
  const documentById = new Map(documents.map((d) => [d.id, d]));

  const zip = new JSZip();
  zip.file("kniha-jizd.xlsx", xlsxBuffer);
  const receiptsFolder = zip.folder("uctenky")!;

  const usedNames = new Set<string>();
  function uniqueName(base: string, ext: string): string {
    let name = `${base}.${ext}`;
    let i = 2;
    while (usedNames.has(name)) {
      name = `${base}-${i}.${ext}`;
      i++;
    }
    usedNames.add(name);
    return name;
  }

  await Promise.all(
    fuelExpenses.map(async (f) => {
      if (!f.documentId) return;
      const doc = documentById.get(f.documentId);
      if (!doc) return;

      try {
        const res = await fetch(doc.fileUrl);
        if (!res.ok) return;
        const bytes = Buffer.from(await res.arrayBuffer());
        const day = f.expenseDate.toISOString().slice(0, 10);
        const amount = Math.round(Number(f.amount));
        const ext = extensionFromUrl(doc.fileUrl);
        const name = uniqueName(`${day}_${amount}Kc`, ext);
        receiptsFolder.file(name, bytes);
      } catch {
        // A single unreachable receipt shouldn't take down the whole export.
      }
    })
  );

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="export-ucetni-${month}.zip"`,
    },
  });
}
