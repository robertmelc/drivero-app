import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaugeIcon } from "@/components/icons";
import { LogoutButton } from "@/components/logout-button";
import { getDeadlineStatus, statusColor } from "@/lib/deadlines";

export default async function VehiclesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "driver") redirect("/driver");

  const vehicles = await prisma.vehicle.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
    include: {
      assignments: { where: { validTo: null }, include: { user: { select: { email: true } } } },
    },
  });

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
          <LogoutButton />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h1 className="text-2xl font-extrabold">Vozidla</h1>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/trips/export"
              className="px-4 py-2.5 rounded-lg text-sm font-bold text-signal border border-border-green"
            >
              ⬇ Export knihy jízd (celá firma)
            </a>
            <Link
              href="/vehicles/new"
              className="px-4 py-2.5 rounded-lg text-sm font-extrabold text-black bg-gradient-to-br from-signal to-signal-dim shadow-[0_8px_24px_rgba(52,227,122,0.25)]"
            >
              + Přidat vozidlo
            </Link>
          </div>
        </div>

        {vehicles.length === 0 ? (
          <div className="glass-panel p-8 text-center text-muted text-sm">
            Zatím nemáte žádné vozidlo. Klikněte na „Přidat vozidlo" výše.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vehicles.map((v) => {
              const statuses = [
                getDeadlineStatus(v.stkValidUntil),
                getDeadlineStatus(v.insuranceLiabilityValidUntil),
                getDeadlineStatus(v.vignetteValidUntil),
              ];
              const driver = v.assignments[0]?.user?.email;
              return (
                <Link key={v.id} href={`/vehicles/${v.id}`} className="glass-panel p-4 hover:border-border-green transition-colors block">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-sm font-bold">{v.spz}</div>
                      <div className="text-sm text-muted">{v.make} {v.model}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted mt-2">{driver || "— nepřiřazeno —"}</div>
                  <div className="font-mono text-xs text-muted mt-1">{v.odometerKm.toLocaleString("cs-CZ")} km</div>
                  <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
                    {statuses.map((s, i) => (
                      <span key={i} className={`inline-block w-2.5 h-2.5 rounded-full ${statusColor[s]}`} />
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
