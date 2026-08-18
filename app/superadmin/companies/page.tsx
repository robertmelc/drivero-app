import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaugeIcon } from "@/components/icons";
import { formatDate } from "@/lib/deadlines";

export default async function SuperadminCompaniesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const { error } = await requireSuperAdmin();
  if (error) redirect("/dashboard");

  const q = searchParams.q?.trim() ?? "";

  const companies = await prisma.company.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    include: { _count: { select: { vehicles: true, users: true } } },
    orderBy: { name: "asc" },
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
          <Link href="/superadmin" className="text-sm text-muted font-semibold">
            ← Zpět na přehled
          </Link>
        </div>

        <p className="text-[11.5px] font-extrabold tracking-[0.14em] uppercase text-signal mb-2">Superadmin</p>
        <h1 className="text-2xl font-extrabold mb-6">
          Firmy <span className="text-muted font-normal">({companies.length})</span>
        </h1>

        <form className="mb-6">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Hledat podle názvu firmy…"
            className="w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm bg-white/5 text-ink focus:outline-none focus:ring-2 focus:ring-border-green"
          />
        </form>

        <div className="glass-panel overflow-hidden">
          {companies.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">Žádná firma neodpovídá hledání.</div>
          ) : (
            companies.map((c, i) => (
              <Link
                key={c.id}
                href={`/superadmin/companies/${c.id}`}
                className={`p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors ${
                  i !== 0 ? "border-t border-white/10" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{c.name}</div>
                  <div className="text-xs text-muted">
                    IČO {c.ico} · registrace {formatDate(c.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-right">
                    <div className="font-mono text-lg font-extrabold">{c._count.vehicles}</div>
                    <div className="text-[10px] uppercase text-muted">vozidel</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-extrabold">{c._count.users}</div>
                    <div className="text-[10px] uppercase text-muted">uživatelů</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
