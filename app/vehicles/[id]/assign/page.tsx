"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GaugeIcon } from "@/components/icons";

type CompanyUser = { id: string; email: string; role: string; status: string };

export default function AssignDriverPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [drivers, setDrivers] = useState<CompanyUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        const onlyDrivers = (data.users || []).filter((u: CompanyUser) => u.role === "driver");
        setDrivers(onlyDrivers);
        if (onlyDrivers.length === 0) setMode("new");
      })
      .finally(() => setLoadingDrivers(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let userId = selectedUserId;

      if (mode === "new") {
        const createRes = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail, role: "driver" }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) {
          setError(createData.error || "Řidiče se nepodařilo pozvat");
          setLoading(false);
          return;
        }
        userId = createData.user.id;
      }

      if (!userId) {
        setError("Vyberte prosím řidiče");
        setLoading(false);
        return;
      }

      const assignRes = await fetch(`/api/vehicles/${vehicleId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const assignData = await assignRes.json();
      if (!assignRes.ok) {
        setError(assignData.error || "Přiřazení se nepodařilo");
        setLoading(false);
        return;
      }

      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    } catch {
      setError("Něco se pokazilo, zkuste to prosím znovu");
      setLoading(false);
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

      <div className="relative z-10 max-w-md mx-auto">
        <div className="flex items-center gap-2 font-extrabold tracking-[0.12em] text-sm mb-8">
          <GaugeIcon size={24} /> DRIVER
          <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
        </div>

        <Link href={`/vehicles/${vehicleId}`} className="text-sm text-muted font-semibold mb-4 inline-block">
          ← Zpět na vozidlo
        </Link>
        <h1 className="text-xl font-extrabold mb-6">Přiřadit řidiče</h1>

        <div className="flex border border-white/10 rounded-lg overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setMode("existing")}
            disabled={drivers.length === 0}
            className={`flex-1 py-2.5 text-sm font-bold disabled:opacity-40 ${mode === "existing" ? "bg-signal/15 text-signal" : "text-muted"}`}
          >
            Vybrat existujícího
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`flex-1 py-2.5 text-sm font-bold ${mode === "new" ? "bg-signal/15 text-signal" : "text-muted"}`}
          >
            Pozvat nového
          </button>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4">
          {mode === "existing" ? (
            loadingDrivers ? (
              <p className="text-sm text-muted">Načítám řidiče…</p>
            ) : drivers.length === 0 ? (
              <p className="text-sm text-muted">Zatím nemáte žádného řidiče — pozvěte nového vedle.</p>
            ) : (
              <div>
                <label className={labelClass}>Řidič</label>
                <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className={inputClass}>
                  <option value="">— vyberte —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.email}</option>
                  ))}
                </select>
              </div>
            )
          ) : (
            <>
              <div>
                <label className={labelClass}>E-mail řidiče</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="jan.novak@firma.cz"
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-muted">
                ✉️ Řidiči přijde e-mail s odkazem, kterým si sám nastaví heslo a přihlásí se — nemusíte mu nic sdělovat.
              </p>
            </>
          )}

          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-extrabold text-sm text-black bg-gradient-to-br from-signal to-signal-dim shadow-[0_10px_28px_rgba(52,227,122,0.25)] disabled:opacity-60"
          >
            {loading ? (mode === "new" ? "Odesílám pozvánku…" : "Přiřazuji…") : mode === "new" ? "Pozvat a přiřadit k vozidlu" : "Přiřadit k vozidlu"}
          </button>
        </form>
      </div>
    </main>
  );
}
