import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaugeIcon } from "@/components/icons";
import { getDeadlineStatus, formatDate, statusColor } from "@/lib/deadlines";

const statusTextColor: Record<string, string> = {
  ok: "text-signal",
  warn: "text-amber",
  bad: "text-danger",
  unknown: "text-muted",
};

const TYPE_LABELS: Record<string, string> = {
  regular_service: "Pravidelný servis",
  repair: "Oprava",
  tires: "Výměna pneu",
  other: "Ostatní",
};

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, companyId: session.companyId },
    include: {
      assignments: { where: { validTo: null }, include: { user: { select: { email: true } } } },
      serviceRecords: { orderBy: { serviceDate: "desc" } },
      handoverProtocols: { orderBy: { protocolDate: "desc" }, take: 1, include: { driver: { select: { email: true } } } },
      fuelExpenses: { orderBy: { expenseDate: "desc" }, take: 5 },
    },
  });

  if (!vehicle) notFound();

  if (session.role === "driver") {
    const isAssigned = vehicle.assignments.some((a) => a.userId === session.userId);
    if (!isAssigned) redirect("/driver");
  }

  const rows = [
    { icon: "🛡️", label: "Pojištění", date: vehicle.insuranceLiabilityValidUntil },
    { icon: "⚠️", label: "STK", date: vehicle.stkValidUntil },
    { icon: "🎫", label: "Dálniční známka", date: vehicle.vignetteValidUntil },
  ];

  const lastProtocol = vehicle.handoverProtocols[0];
  const assignedDriverId = vehicle.assignments[0]?.userId ?? "";

  return (
    <main className="relative min-h-screen px-6 py-8">
      <div className="mesh-bg">
        <span className="w-[620px] h-[620px] -left-44 -top-40 bg-[radial-gradient(circle,rgba(52,227,122,0.30),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-extrabold tracking-[0.12em] text-sm">
            <GaugeIcon size={24} /> DRIVER
            <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
          </Link>
        </div>

        {session.role !== "driver" && (
          <Link href="/vehicles" className="text-sm text-muted font-semibold mb-5 inline-block">
            ← Zpět na přehled
          </Link>
        )}

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-mono text-sm font-bold text-muted">{vehicle.spz}</div>
            <h1 className="text-2xl font-extrabold">{vehicle.make} {vehicle.model}</h1>
            <div className="text-sm text-muted mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              Přiřazeno: {vehicle.assignments[0]?.user?.email || "— nepřiřazeno —"}
              {session.role === "admin" && (
                <Link href={`/vehicles/${vehicle.id}/assign`} className="text-signal font-bold text-xs">
                  {vehicle.assignments[0] ? "(změnit)" : "(přiřadit)"}
                </Link>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase text-muted">Aktuální stav</div>
            <div className="text-2xl font-mono font-extrabold">{vehicle.odometerKm.toLocaleString("cs-CZ")} km</div>
            <a
              href={`/api/trips/export?vehicleId=${vehicle.id}`}
              className="text-xs font-bold text-signal inline-block mt-1"
            >
              ⬇ Export knihy jízd (XLS)
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {rows.map((r) => {
            const status = getDeadlineStatus(r.date);
            return (
              <div key={r.label} className="glass-panel p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase text-muted mb-2">
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                  <span className={`inline-block w-2 h-2 rounded-full ml-auto ${statusColor[status]}`} />
                </div>
                <div className={`text-sm font-bold ${statusTextColor[status]}`}>
                  {r.date ? `platné do ${formatDate(r.date)}` : "termín nezadán"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Historie servisu</h2>
              {session.role === "admin" && (
                <Link
                  href={`/vehicles/${vehicle.id}/service/new`}
                  className="px-3.5 py-2 rounded-lg text-xs font-extrabold text-black bg-gradient-to-br from-signal to-signal-dim"
                >
                  + Přidat záznam
                </Link>
              )}
            </div>
            <div className="glass-panel overflow-hidden">
              {vehicle.serviceRecords.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted">Zatím žádné záznamy o servisu.</div>
              ) : (
                vehicle.serviceRecords.map((s, i) => (
                  <div key={s.id} className={`p-4 flex items-center justify-between ${i !== 0 ? "border-t border-white/10" : ""}`}>
                    <div>
                      <div className="text-sm font-semibold">🔧 {TYPE_LABELS[s.type] || s.type}</div>
                      <div className="text-xs text-muted">
                        {s.supplier} · {formatDate(s.serviceDate)} · {s.odometerKm.toLocaleString("cs-CZ")} km
                      </div>
                    </div>
                    <div className="font-mono text-sm font-bold text-mint">{s.costAmount.toString()} Kč</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Předávací protokol</h2>
            </div>
            <div className="glass-panel p-4 mb-3">
              {!lastProtocol ? (
                <div className="text-sm text-muted text-center py-2">Zatím žádný protokol.</div>
              ) : (
                <>
                  <div className={`flex items-center gap-2 text-sm font-bold mb-1 ${lastProtocol.signedByAdmin && lastProtocol.signedByDriver ? "text-signal" : "text-amber"}`}>
                    {lastProtocol.signedByAdmin && lastProtocol.signedByDriver ? "✓ Podepsáno oběma stranami" : "⚠ Čeká na podpis"}
                  </div>
                  <div className="text-xs text-muted">
                    {lastProtocol.type === "handover" ? "Předání" : "Vrácení"} · {formatDate(lastProtocol.protocolDate)} ·
                    {" "}stav {lastProtocol.odometerKm.toLocaleString("cs-CZ")} km · {lastProtocol.driver.email}
                  </div>
                </>
              )}
            </div>
            {session.role === "admin" && (
              <Link
                href={`/vehicles/${vehicle.id}/handover/new?driverId=${assignedDriverId}&odometer=${vehicle.odometerKm}`}
                className="block text-center px-3.5 py-2.5 rounded-lg text-xs font-extrabold text-black bg-gradient-to-br from-signal to-signal-dim"
              >
                + Nový protokol
              </Link>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Tankování</h2>
            </div>
            <div className="glass-panel overflow-hidden">
              {vehicle.fuelExpenses.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted">Zatím žádné záznamy o tankování.</div>
              ) : (
                vehicle.fuelExpenses.map((f, i) => (
                  <div key={f.id} className={`p-4 flex items-center justify-between ${i !== 0 ? "border-t border-white/10" : ""}`}>
                    <div>
                      <div className="text-sm font-semibold">⛽ {formatDate(f.expenseDate)}</div>
                      <div className="text-xs text-muted">
                        {f.liters ? `${f.liters.toString()} l` : "— l"}
                        {f.odometerKm ? ` · ${f.odometerKm.toLocaleString("cs-CZ")} km` : ""}
                      </div>
                    </div>
                    <div className="font-mono text-sm font-bold text-mint">{f.amount.toString()} Kč</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
