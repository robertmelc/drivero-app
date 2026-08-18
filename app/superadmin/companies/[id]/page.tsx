import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaugeIcon } from "@/components/icons";
import { getDeadlineStatus, statusColor, formatDate } from "@/lib/deadlines";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrátor",
  accountant: "Účetní",
  driver: "Řidič",
};

export default async function SuperadminCompanyDetailPage({ params }: { params: { id: string } }) {
  const { error } = await requireSuperAdmin();
  if (error) redirect("/dashboard");

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      memberships: { include: { user: { select: { email: true } } }, orderBy: { createdAt: "asc" } },
      vehicles: { orderBy: { spz: "asc" } },
    },
  });

  if (!company) notFound();

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
          <Link href="/superadmin/companies" className="text-sm text-muted font-semibold">
            ← Zpět na firmy
          </Link>
        </div>

        <p className="text-[11.5px] font-extrabold tracking-[0.14em] uppercase text-signal mb-2">Superadmin</p>
        <h1 className="text-2xl font-extrabold mb-1">{company.name}</h1>
        <p className="text-sm text-muted mb-8">
          IČO {company.ico}
          {company.dic ? ` · DIČ ${company.dic}` : ""}
          {company.address ? ` · ${company.address}` : ""} · registrace {formatDate(company.createdAt)}
        </p>

        <h2 className="text-base font-bold mb-3">
          Uživatelé <span className="text-muted font-normal">({company.memberships.length})</span>
        </h2>
        <div className="glass-panel overflow-hidden mb-10">
          {company.memberships.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">Žádní uživatelé.</div>
          ) : (
            company.memberships.map((m, i) => (
              <div
                key={m.id}
                className={`p-4 flex items-center justify-between ${i !== 0 ? "border-t border-white/10" : ""}`}
              >
                <div className="text-sm font-semibold">{m.user.email}</div>
                <div className="text-xs text-muted">{ROLE_LABELS[m.role] ?? m.role}</div>
              </div>
            ))
          )}
        </div>

        <h2 className="text-base font-bold mb-3">
          Vozidla <span className="text-muted font-normal">({company.vehicles.length})</span>
        </h2>
        <div className="glass-panel overflow-hidden">
          {company.vehicles.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">Zatím žádná vozidla.</div>
          ) : (
            company.vehicles.map((v, i) => {
              const statuses = [
                getDeadlineStatus(v.stkValidUntil),
                getDeadlineStatus(v.insuranceLiabilityValidUntil),
                getDeadlineStatus(v.vignetteValidUntil),
                getDeadlineStatus(v.parkingCardValidUntil),
              ];
              return (
                <Link
                  key={v.id}
                  href={`/vehicles/${v.id}`}
                  className={`p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors ${
                    i !== 0 ? "border-t border-white/10" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">{v.spz}</span>
                      <span className="text-sm text-muted truncate">{v.make} {v.model}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {statuses.map((s, idx) => (
                      <span key={idx} className={`inline-block w-2 h-2 rounded-full ${statusColor[s]}`} />
                    ))}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
