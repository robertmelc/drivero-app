import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaugeIcon } from "@/components/icons";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrátor",
  accountant: "Účetní",
  driver: "Řidič",
};

export default async function SuperadminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const { error } = await requireSuperAdmin();
  if (error) redirect("/dashboard");

  const q = searchParams.q?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: q ? { email: { contains: q, mode: "insensitive" } } : undefined,
    include: { memberships: { include: { company: { select: { name: true } } }, orderBy: { createdAt: "asc" } } },
    orderBy: { email: "asc" },
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
          Uživatelé <span className="text-muted font-normal">({users.length})</span>
        </h1>

        <form className="mb-6">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Hledat podle e-mailu…"
            className="w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm bg-white/5 text-ink focus:outline-none focus:ring-2 focus:ring-border-green"
          />
        </form>

        <div className="glass-panel overflow-hidden">
          {users.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">Žádný uživatel neodpovídá hledání.</div>
          ) : (
            users.map((u, i) => (
              <div key={u.id} className={`p-4 ${i !== 0 ? "border-t border-white/10" : ""}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold truncate">{u.email}</div>
                  {u.isSuperAdmin && (
                    <span className="text-[10px] uppercase font-extrabold text-signal shrink-0">⚙ Superadmin</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                  {u.memberships.length === 0 ? (
                    <span className="text-xs text-muted">Žádné členství ve firmě</span>
                  ) : (
                    u.memberships.map((m) => (
                      <span key={m.id} className="text-xs text-muted">
                        {m.company.name} · {ROLE_LABELS[m.role] ?? m.role}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
