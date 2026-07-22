import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaugeIcon } from "@/components/icons";
import { LogoutButton } from "@/components/logout-button";
import { getDeadlineStatus } from "@/lib/deadlines";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "driver") redirect("/driver");

  const vehicleCount = await prisma.vehicle.count({ where: { companyId: session.companyId } });

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));

  const [tripAgg, fuelAgg, serviceAgg, vehicles] = await Promise.all([
    prisma.tripLogEntry.aggregate({
      where: { vehicle: { companyId: session.companyId }, tripDate: { gte: monthStart, lt: monthEnd } },
      _sum: { distanceKm: true },
    }),
    prisma.fuelExpense.aggregate({
      where: { vehicle: { companyId: session.companyId }, expenseDate: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.serviceRecord.aggregate({
      where: { vehicle: { companyId: session.companyId }, serviceDate: { gte: monthStart, lt: monthEnd } },
      _sum: { costAmount: true },
    }),
    prisma.vehicle.findMany({
      where: { companyId: session.companyId },
      select: { stkValidUntil: true, insuranceLiabilityValidUntil: true, vignetteValidUntil: true },
    }),
  ]);

  const totalKm = tripAgg._sum.distanceKm ?? 0;
  const fuelCost = fuelAgg._sum.amount ? fuelAgg._sum.amount.toNumber() : 0;
  const serviceCost = serviceAgg._sum.costAmount ? serviceAgg._sum.costAmount.toNumber() : 0;

  const upcomingDeadlineCount = vehicles.filter((v) => {
    const statuses = [
      getDeadlineStatus(v.stkValidUntil),
      getDeadlineStatus(v.insuranceLiabilityValidUntil),
      getDeadlineStatus(v.vignetteValidUntil),
    ];
    return statuses.some((s) => s === "warn" || s === "bad");
  }).length;

  return (
    <main className="relative min-h-screen px-6 py-8">
      <div className="mesh-bg">
        <span className="w-[620px] h-[620px] -left-44 -top-40 bg-[radial-gradient(circle,rgba(52,227,122,0.30),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2 font-extrabold tracking-[0.12em] text-sm">
            <GaugeIcon size={24} /> DRIVER
            <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
          </div>
          <LogoutButton />
        </div>

        <div className="glass-panel p-8 mb-6">
          <p className="text-[11.5px] font-extrabold tracking-[0.14em] uppercase text-signal mb-2">
            Přihlášeno jako {session.role === "admin" ? "administrátor" : "účetní"}
          </p>
          <h1 className="text-2xl font-extrabold mb-3">Vítejte, {session.email}</h1>
          <p className="text-sm text-muted">
            Vozový park: <strong className="text-ink">{vehicleCount}</strong> {vehicleCount === 1 ? "vozidlo" : "vozidel"}
          </p>
        </div>

        <Link
          href="/vehicles"
          className="glass-panel p-6 flex items-center justify-between hover:border-border-green transition-colors mb-6"
        >
          <div>
            <div className="font-bold text-base mb-1">Vozový park</div>
            <div className="text-sm text-muted">Přehled vozidel, termíny a přidání nového vozidla</div>
          </div>
          <span className="text-signal font-bold text-lg">→</span>
        </Link>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-panel p-4">
            <div className="text-[11px] uppercase text-muted mb-2">Ujeté km (měsíc)</div>
            <div className="text-xl font-mono font-extrabold text-mint">{totalKm.toLocaleString("cs-CZ")} km</div>
          </div>
          <div className="glass-panel p-4">
            <div className="text-[11px] uppercase text-muted mb-2">Náklady na palivo</div>
            <div className="text-xl font-mono font-extrabold text-mint">{fuelCost.toLocaleString("cs-CZ")} Kč</div>
          </div>
          <div className="glass-panel p-4">
            <div className="text-[11px] uppercase text-muted mb-2">Náklady na servis</div>
            <div className="text-xl font-mono font-extrabold text-mint">{serviceCost.toLocaleString("cs-CZ")} Kč</div>
          </div>
          <div className="glass-panel p-4">
            <div className="text-[11px] uppercase text-muted mb-2">Blížící se termíny</div>
            <div className={`text-xl font-mono font-extrabold ${upcomingDeadlineCount > 0 ? "text-amber" : "text-signal"}`}>
              {upcomingDeadlineCount}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
