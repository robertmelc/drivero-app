import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaugeIcon } from "@/components/icons";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "driver") redirect("/driver");

  const vehicleCount = await prisma.vehicle.count({ where: { companyId: session.companyId } });

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
          className="glass-panel p-6 flex items-center justify-between hover:border-border-green transition-colors"
        >
          <div>
            <div className="font-bold text-base mb-1">Vozový park</div>
            <div className="text-sm text-muted">Přehled vozidel, termíny a přidání nového vozidla</div>
          </div>
          <span className="text-signal font-bold text-lg">→</span>
        </Link>
      </div>
    </main>
  );
}
