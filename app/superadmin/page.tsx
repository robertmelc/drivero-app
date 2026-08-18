import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaugeIcon } from "@/components/icons";
import { getDeadlineStatus, statusColor } from "@/lib/deadlines";

export default async function SuperadminPage() {
  const { error } = await requireSuperAdmin();
  if (error) redirect("/dashboard");

  const [companies, vehicles] = await Promise.all([
    prisma.company.findMany({
      include: { _count: { select: { vehicles: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.vehicle.findMany({
      include: { company: { select: { name: true } } },
      orderBy: [{ company: { name: "asc" } }, { spz: "asc" }],
    }),
  ]);

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
          <Link href="/dashboard" className="text-sm text-muted font-semibold">
            ← Zpět do appky
          </Link>
        </div>

        <p className="text-[11.5px] font-extrabold tracking-[0.14em] uppercase text-signal mb-2">Superadmin</p>
        <h1 className="text-2xl font-extrabold mb-8">Přehled napříč všemi firmami</h1>

        <h2 className="text-base font-bold mb-3">
          Firmy <span className="text-muted font-normal">({companies.length})</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {companies.map((c) => (
            <div key={c.id} className="glass-panel p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">{c.name}</div>
                <div className="text-xs text-muted">IČO {c.ico}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-extrabold">{c._count.vehicles}</div>
                <div className="text-[10px] uppercase text-muted">
                  {c._count.vehicles === 1 ? "vozidlo" : c._count.vehicles >= 2 && c._count.vehicles <= 4 ? "vozidla" : "vozidel"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-base font-bold mb-3">
          Všechna vozidla <span className="text-muted font-normal">({vehicles.length})</span>
        </h2>
        <div className="glass-panel overflow-hidden">
          {vehicles.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">Zatím žádná vozidla.</div>
          ) : (
            vehicles.map((v, i) => {
              const statuses = [
                getDeadlineStatus(v.stkValidUntil),
                getDeadlineStatus(v.insuranceLiabilityValidUntil),
                getDeadlineStatus(v.vignetteValidUntil),
                getDeadlineStatus(v.parkingCardValidUntil),
              ];
              return (
                <div
                  key={v.id}
                  className={`p-4 flex items-center justify-between gap-4 ${i !== 0 ? "border-t border-white/10" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">{v.spz}</span>
                      <span className="text-sm text-muted truncate">{v.make} {v.model}</span>
                    </div>
                    <div className="text-xs text-muted truncate">{v.company.name}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {statuses.map((s, idx) => (
                      <span key={idx} className={`inline-block w-2 h-2 rounded-full ${statusColor[s]}`} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
