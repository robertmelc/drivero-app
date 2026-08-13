import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaugeIcon, CarSideIcon } from "@/components/icons";
import { LogoutButton } from "@/components/logout-button";
import { getDeadlineStatus, getDeadlineProgress, statusColor, formatDate } from "@/lib/deadlines";

const trackColor: Record<string, string> = {
  ok: "bg-signal/20",
  warn: "bg-amber/20",
  bad: "bg-danger/20",
  unknown: "bg-white/10",
};

export default async function DriverPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "driver") redirect("/dashboard");

  const assignment = await prisma.vehicleAssignment.findFirst({
    where: { userId: session.userId, validTo: null },
    include: { vehicle: true },
  });

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));

  const trips = assignment
    ? await prisma.tripLogEntry.findMany({
        where: {
          vehicleId: assignment.vehicleId,
          userId: session.userId,
          tripDate: { gte: monthStart, lt: monthEnd },
        },
        orderBy: { sequenceNumber: "desc" },
      })
    : [];

  const totalTripKm = trips.reduce((sum, t) => sum + t.distanceKm, 0);

  const vehicle = assignment?.vehicle;
  const deadlineRows = vehicle
    ? [
        { icon: "🛡️", label: "Pojištění", date: vehicle.insuranceLiabilityValidUntil },
        { icon: "⚠️", label: "STK", date: vehicle.stkValidUntil },
        { icon: "🎫", label: "Dálniční známka", date: vehicle.vignetteValidUntil },
        { icon: "🅿️", label: "Parkovací karta", date: vehicle.parkingCardValidUntil },
      ]
    : [];

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-10">
      <div className="mesh-bg">
        <span className="w-[520px] h-[520px] -right-40 -bottom-40 bg-[radial-gradient(circle,rgba(31,157,87,0.24),transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 font-extrabold tracking-[0.12em] text-sm">
            <GaugeIcon size={22} /> DRIVER
            <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
          </div>
          <LogoutButton />
        </div>

        <div className="mb-4">
          <p className="text-xs text-muted">Ahoj,</p>
          <h1 className="text-lg font-bold">{session.email}</h1>
        </div>

        {!vehicle ? (
          <div className="glass-panel p-6 text-center text-sm text-muted">
            Zatím vám není přiřazeno žádné vozidlo. Ozvěte se administrátorovi vaší firmy.
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-4 mb-5 border border-border-green bg-gradient-to-br from-signal/10 to-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm font-bold">{vehicle.spz}</div>
                  <div className="text-sm text-muted">{vehicle.make} {vehicle.model}</div>
                </div>
                <CarSideIcon width={34} height={16} className="text-mint" />
              </div>
              <div className="font-mono text-2xl font-extrabold mt-2">
                {vehicle.odometerKm.toLocaleString("cs-CZ")} <span className="text-sm font-normal text-muted">km</span>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
                {deadlineRows.map((r) => {
                  const status = getDeadlineStatus(r.date);
                  const progress = getDeadlineProgress(r.date);
                  return (
                    <div key={r.label}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-muted">{r.icon} {r.label}</span>
                        <span className="text-muted">
                          {r.date ? `platné do ${formatDate(r.date)}` : "termín nezadán"}
                        </span>
                      </div>
                      <div className={`relative h-1 rounded-full ${trackColor[status]}`}>
                        <span
                          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${statusColor[status]}`}
                          style={{ left: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Link
                href={`/driver/trip/new?vehicleId=${vehicle.id}&odometer=${vehicle.odometerKm}`}
                className="block text-center py-3.5 rounded-xl font-extrabold text-sm text-black bg-gradient-to-br from-signal to-signal-dim shadow-[0_10px_28px_rgba(52,227,122,0.25)]"
              >
                ＋ ZAPSAT JÍZDU
              </Link>
              <Link
                href={`/driver/fuel/new?vehicleId=${vehicle.id}&odometer=${vehicle.odometerKm}`}
                className="block text-center py-3.5 rounded-xl font-extrabold text-sm text-signal border border-border-green"
              >
                ⛽ Zapsat tankování
              </Link>
            </div>

            <div className="text-xs text-muted mb-2">
              Tento měsíc: <span className="text-ink font-bold">{totalTripKm.toLocaleString("cs-CZ")} km</span>
              {" "}· {trips.length} {trips.length === 1 ? "jízda" : trips.length >= 2 && trips.length <= 4 ? "jízdy" : "jízd"}
            </div>

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold">Jízdy — tento měsíc</h3>
              {trips.length > 0 && (
                <a
                  href={`/api/trips/export?vehicleId=${vehicle.id}`}
                  className="text-xs font-bold text-signal"
                >
                  ⬇ Export XLS
                </a>
              )}
            </div>
            {trips.length === 0 ? (
              <div className="glass-panel p-4 text-center text-xs text-muted">Zatím žádné jízdy.</div>
            ) : (
              <div className="space-y-2">
                {trips.map((t) => (
                  <div key={t.id} className="glass-panel p-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{t.startLocation} → {t.endLocation}</div>
                      <div className="text-xs text-muted">
                        {new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric" }).format(t.tripDate)} ·{" "}
                        {t.tripType === "business" ? "Služební" : "Soukromá"}
                      </div>
                    </div>
                    <div className="font-mono text-sm font-bold">{t.distanceKm} km</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
