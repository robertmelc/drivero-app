"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GaugeIcon } from "@/components/icons";

type Membership = { id: string; companyName: string; role: string };

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrátor",
  accountant: "Účetní",
  driver: "Řidič",
};

export default function ChooseCompanyPage() {
  const router = useRouter();
  const [selectionToken, setSelectionToken] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("selectionToken");
    const raw = sessionStorage.getItem("memberships");
    if (!token || !raw) {
      router.replace("/login");
      return;
    }
    setSelectionToken(token);
    setMemberships(JSON.parse(raw));
  }, [router]);

  async function handleSelect(membershipId: string) {
    if (!selectionToken) return;
    setError(null);
    setSelectingId(membershipId);

    try {
      const res = await fetch("/api/auth/select-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectionToken, membershipId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Výběr se nezdařil");
        setSelectingId(null);
        return;
      }

      sessionStorage.removeItem("selectionToken");
      sessionStorage.removeItem("memberships");
      router.push(data.role === "driver" ? "/driver" : "/dashboard");
      router.refresh();
    } catch {
      setError("Něco se pokazilo, zkuste to prosím znovu");
      setSelectingId(null);
    }
  }

  if (!selectionToken) return null;

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-10">
      <div className="mesh-bg">
        <span className="w-[620px] h-[620px] -left-44 -top-40 bg-[radial-gradient(circle,rgba(52,227,122,0.30),transparent_70%)]" />
        <span className="w-[520px] h-[520px] -right-40 -bottom-40 bg-[radial-gradient(circle,rgba(31,157,87,0.24),transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md glass-panel p-8">
        <Link href="/" className="flex items-center justify-center gap-2 font-extrabold tracking-[0.12em] text-sm mb-7">
          <GaugeIcon size={24} /> DRIVER
          <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
        </Link>

        <h1 className="text-xl font-extrabold text-center mb-1">Vyberte firmu a roli</h1>
        <p className="text-sm text-muted text-center mb-7">
          Jste přiřazeni k víc firmám nebo rolím — vyberte, jako co se chcete přihlásit.
        </p>

        <div className="space-y-3">
          {memberships.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelect(m.id)}
              disabled={selectingId !== null}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-border-green transition-colors text-left disabled:opacity-60"
            >
              <div>
                <div className="text-sm font-bold">{m.companyName}</div>
                <div className="text-xs text-muted">{ROLE_LABELS[m.role] ?? m.role}</div>
              </div>
              <span className="text-signal font-bold text-lg">{selectingId === m.id ? "…" : "→"}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 mt-4">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
