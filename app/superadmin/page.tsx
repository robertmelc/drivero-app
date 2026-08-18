import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaugeIcon } from "@/components/icons";

export default async function SuperadminPage() {
  const { error } = await requireSuperAdmin();
  if (error) redirect("/dashboard");

  const [companyCount, vehicleCount, userCount] = await Promise.all([
    prisma.company.count(),
    prisma.vehicle.count(),
    prisma.user.count(),
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <Link href="/superadmin/companies" className="glass-panel p-5 block hover:opacity-90 transition-opacity">
            <div className="font-mono text-2xl font-extrabold">{companyCount}</div>
            <div className="text-[11px] uppercase text-muted mt-1">Firem</div>
          </Link>
          <Link href="/superadmin/vehicles" className="glass-panel p-5 block hover:opacity-90 transition-opacity">
            <div className="font-mono text-2xl font-extrabold">{vehicleCount}</div>
            <div className="text-[11px] uppercase text-muted mt-1">Vozidel</div>
          </Link>
          <Link href="/superadmin/users" className="glass-panel p-5 block hover:opacity-90 transition-opacity">
            <div className="font-mono text-2xl font-extrabold">{userCount}</div>
            <div className="text-[11px] uppercase text-muted mt-1">Uživatelů</div>
          </Link>
        </div>

        <Link
          href="/superadmin/companies"
          className="inline-block px-5 py-2.5 rounded-lg text-sm font-extrabold text-black bg-gradient-to-br from-signal to-signal-dim"
        >
          Zobrazit seznam firem
        </Link>
      </div>
    </main>
  );
}
