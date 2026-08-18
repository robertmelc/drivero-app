"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GaugeIcon } from "@/components/icons";
import { formatDate } from "@/lib/deadlines";

type CompanyUser = { id: string; email: string; role: string; status: string; createdAt: string };

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrátor",
  accountant: "Účetní",
  driver: "Řidič",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktivní",
  invited: "Čeká na přijetí pozvánky",
  disabled: "Zablokován",
};

export function TeamManager() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"accountant" | "driver">("accountant");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function loadUsers() {
    setLoadingUsers(true);
    return fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .finally(() => setLoadingUsers(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setInviting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Pozvání se nepodařilo");
        setInviting(false);
        return;
      }

      setSuccess(
        data.mailError
          ? `Uživatel byl přidán, ale odeslání e-mailu selhalo (${data.mailError}). Sdělte mu prosím odkaz na přihlášení ručně.`
          : data.message || "Pozvánka byla odeslána."
      );
      setEmail("");
      setRole("accountant");
      await loadUsers();
    } catch {
      setError("Něco se pokazilo, zkuste to prosím znovu");
    } finally {
      setInviting(false);
    }
  }

  const inputClass =
    "w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm bg-white/5 text-ink focus:outline-none focus:ring-2 focus:ring-border-green";
  const labelClass = "block text-[11px] uppercase tracking-wide text-muted mb-1.5";

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

        <Link href="/dashboard" className="text-sm text-muted font-semibold mb-4 inline-block">
          ← Zpět na přehled
        </Link>
        <h1 className="text-2xl font-extrabold mb-6">Tým</h1>

        <div className="glass-panel p-6 mb-6">
          <h2 className="text-xs uppercase tracking-wide text-muted font-bold mb-4">+ Pozvat člena týmu</h2>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className={labelClass}>E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan.novak@firma.cz"
                className={inputClass}
              />
            </div>
            <div className="sm:w-44">
              <label className={labelClass}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as "accountant" | "driver")} className={inputClass}>
                <option value="accountant">Účetní</option>
                <option value="driver">Řidič</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="px-5 py-2.5 rounded-lg text-sm font-extrabold text-black bg-gradient-to-br from-signal to-signal-dim shadow-[0_8px_24px_rgba(52,227,122,0.25)] disabled:opacity-60 whitespace-nowrap"
            >
              {inviting ? "Odesílám…" : "Pozvat"}
            </button>
          </form>

          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 mt-4">{error}</p>
          )}
          {success && (
            <p className="text-sm text-signal bg-signal/10 border border-signal/30 rounded-lg px-3 py-2 mt-4">{success}</p>
          )}
        </div>

        <h2 className="text-base font-bold mb-3">
          Členové firmy <span className="text-muted font-normal">({users.length})</span>
        </h2>
        <div className="glass-panel overflow-hidden">
          {loadingUsers ? (
            <div className="p-6 text-center text-sm text-muted">Načítám…</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">Zatím žádní členové.</div>
          ) : (
            users.map((u, i) => (
              <div
                key={u.id}
                className={`p-4 flex items-center justify-between gap-4 ${i !== 0 ? "border-t border-white/10" : ""}`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{u.email}</div>
                  <div className="text-xs text-muted">
                    {ROLE_LABELS[u.role] ?? u.role} · registrace {formatDate(new Date(u.createdAt))}
                  </div>
                </div>
                <div className={`text-xs font-bold shrink-0 ${u.status === "active" ? "text-signal" : u.status === "disabled" ? "text-danger" : "text-amber"}`}>
                  {STATUS_LABELS[u.status] ?? u.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
