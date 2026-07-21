"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GaugeIcon, CarSideIcon } from "@/components/icons";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"company" | "driver">("company");

  const [companyName, setCompanyName] = useState("");
  const [ico, setIco] = useState("");
  const [phone, setPhone] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, ico, phone, adminName, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Založení profilu se nezdařilo");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
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
        <span className="w-[520px] h-[520px] -right-40 -bottom-40 bg-[radial-gradient(circle,rgba(31,157,87,0.24),transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md glass-panel p-8">
        <Link href="/" className="flex items-center justify-center gap-2 font-extrabold tracking-[0.12em] text-sm mb-7">
          <GaugeIcon size={24} /> DRIVER
          <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
        </Link>

        <h1 className="text-xl font-extrabold text-center mb-1">Založit profil</h1>
        <p className="text-sm text-muted text-center mb-6">
          Firma i řidič používají stejné okno — jen si vyberou svou roli.
        </p>

        <div className="flex border border-white/10 rounded-lg overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setRole("company")}
            className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 ${
              role === "company" ? "bg-signal/15 text-signal" : "text-muted"
            }`}
          >
            🏢 Jsem firma
          </button>
          <button
            type="button"
            onClick={() => setRole("driver")}
            className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 ${
              role === "driver" ? "bg-signal/15 text-signal" : "text-muted"
            }`}
          >
            <CarSideIcon width={18} height={9} /> Jsem řidič
          </button>
        </div>

        {role === "company" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-muted mb-1.5">Název společnosti</label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ROOMS MANAGEMENT s.r.o."
                className="w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm bg-white/5 text-ink focus:outline-none focus:ring-2 focus:ring-border-green"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-muted mb-1.5">IČO</label>
                <input
                  required
                  value={ico}
                  onChange={(e) => setIco(e.target.value)}
                  placeholder="12345678"
                  className="w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm bg-white/5 text-ink font-mono focus:outline-none focus:ring-2 focus:ring-border-green"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wide text-muted mb-1.5">Telefon</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+420 777 123 456"
                  className="w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm bg-white/5 text-ink focus:outline-none focus:ring-2 focus:ring-border-green"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-muted mb-1.5">Jméno a příjmení (admin)</label>
              <input
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Robert Melc"
                className="w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm bg-white/5 text-ink focus:outline-none focus:ring-2 focus:ring-border-green"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-muted mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@firma.cz"
                className="w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm bg-white/5 text-ink focus:outline-none focus:ring-2 focus:ring-border-green"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-muted mb-1.5">Heslo</label>
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
              {loading ? "Zakládám…" : "Založit profil"}
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="text-3xl mb-3">✉️</div>
            <p className="text-sm text-ink font-semibold mb-2">Řidiči se připojují přes pozvánku</p>
            <p className="text-sm text-muted">
              Váš administrátor vám pošle e-mail s odkazem, kterým si dokončíte profil. Nemáte pozvánku? Ozvěte se
              tomu, kdo ve vaší firmě spravuje vozový park.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted mt-5">
          Už máte profil?{" "}
          <Link href="/login" className="text-signal font-bold">
            Přihlásit se
          </Link>
        </p>
      </div>
    </main>
  );
}
