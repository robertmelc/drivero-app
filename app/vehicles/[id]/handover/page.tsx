import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, checkIsSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaugeIcon } from "@/components/icons";
import { formatDate } from "@/lib/deadlines";

export default async function HandoverProtocolsListPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  let vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, companyId: session.companyId },
  });
  let viewingAsSuperAdmin = false;
  if (!vehicle && (await checkIsSuperAdmin(session.userId))) {
    vehicle = await prisma.vehicle.findFirst({ where: { id: params.id } });
    viewingAsSuperAdmin = true;
  }
  if (!vehicle) redirect("/vehicles");

  const protocols = await prisma.handoverProtocol.findMany({
    where: {
      vehicleId: vehicle.id,
      ...(!viewingAsSuperAdmin && session.role === "driver" ? { userId: session.userId } : {}),
    },
    orderBy: { protocolDate: "desc" },
    include: { driver: { select: { email: true } } },
  });

  return (
    <main className="relative min-h-screen px-6 py-8">
      <div className="mesh-bg">
        <span className="w-[620px] h-[620px] -left-44 -top-40 bg-[radial-gradient(circle,rgba(52,227,122,0.30),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 font-extrabold tracking-[0.12em] text-sm mb-8">
          <GaugeIcon size={24} /> DRIVER
          <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
        </div>

        {viewingAsSuperAdmin && (
          <div className="glass-panel px-4 py-2.5 mb-4 border border-signal/30 bg-signal/5 flex items-center gap-2 text-xs font-bold text-signal">
            ⚙ Prohlížíte jako superadmin
          </div>
        )}

        <Link href={`/vehicles/${vehicle.id}`} className="text-sm text-muted font-semibold mb-4 inline-block">
          ← Zpět na vozidlo
        </Link>
        <h1 className="text-xl font-extrabold mb-1">Předávací protokoly</h1>
        <p className="text-sm text-muted mb-6">{vehicle.spz} · {vehicle.make} {vehicle.model}</p>

        {protocols.length === 0 ? (
          <div className="glass-panel p-6 text-center text-sm text-muted">Zatím žádný protokol.</div>
        ) : (
          <div className="space-y-2">
            {protocols.map((p) => (
              <Link
                key={p.id}
                href={`/vehicles/${vehicle.id}/handover/${p.id}`}
                className="glass-panel p-4 flex items-center justify-between hover:border-border-green transition-colors block"
              >
                <div>
                  <div className="text-sm font-semibold">
                    {p.type === "handover" ? "Předání" : "Vrácení"} — {p.driver.email}
                  </div>
                  <div className="text-xs text-muted">
                    {formatDate(p.protocolDate)} · {p.odometerKm.toLocaleString("cs-CZ")} km
                  </div>
                </div>
                <div className={`text-xs font-bold ${p.signedByAdmin && p.signedByDriver ? "text-signal" : "text-amber"}`}>
                  {p.signedByAdmin && p.signedByDriver ? "✓ Podepsáno" : "⚠ Neúplné"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
