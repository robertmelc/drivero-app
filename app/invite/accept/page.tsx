"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { GaugeIcon } from "@/components/icons";

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={null}>
      <InviteAcceptForm />
    </Suspense>
  );
}

function InviteAcceptForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/invite-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nepodařilo se dokončit registraci");
        setLoading(false);
        return;
      }

      router.push(data.role === "driver" ? "/driver" : "/dashboard");
      router.refresh();
    } catch {
      setError("Něco se pokazilo, zkuste to prosím znovu");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-10">
      <div className="mesh-bg">
        <span className="w-[620px] h-[620px] -left-44 -top-40 bg-[radial-gradient(circle,rgba(52,227,122,0.30),transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md glass-panel p-8">
        <Link href="/" className="flex items-center justify-center gap-2 font-extrabold tracking-[0.12em] text-sm mb-7">
          <GaugeIcon size={24} /> DRIVER
          <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
        </Link>

        <h1 className="text-xl font-extrabold text-center mb-1">Vítejte v Drivero</h1>
        <p className="text-sm text-muted text-center mb-7">
          Nastavte si heslo, se kterým se budete napříště přihlašovat.
        </p>

        {!token ? (
          <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 text-center">
            Chybí přihlašovací odkaz. Otevřete prosím odkaz z e-mailu znovu.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-muted mb-1.5">Nové heslo</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min. 8 znaků"
                className="w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm bg-white/5 text-ink focus:outline-none focus:ring-2 focus:ring-border-green"
              />
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-extrabold text-sm text-black bg-gradient-to-br from-signal to-signal-dim shadow-[0_10px_28px_rgba(52,227,122,0.25)] disabled:opacity-60"
            >
              {loading ? "Nastavuji…" : "Nastavit heslo a přihlásit se"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
