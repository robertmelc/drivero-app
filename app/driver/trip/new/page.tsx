"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { GaugeIcon } from "@/components/icons";

export default function NewTripPage() {
  return (
    <Suspense fallback={null}>
      <NewTripForm />
    </Suspense>
  );
}

function NewTripForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId") || "";
  const startOdometer = searchParams.get("odometer") || "0";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tripType, setTripType] = useState<"business" | "private">("business");

  const [form, setForm] = useState({
    tripDate: new Date().toISOString().slice(0, 10),
    startLocation: "",
    endLocation: "",
    purpose: "",
    odometerStartKm: startOdometer,
    odometerEndKm: "",
    note: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const distance =
    form.odometerEndKm && form.odometerStartKm
      ? Math.max(0, Number(form.odometerEndKm) - Number(form.odometerStartKm))
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const dayIso = new Date(`${form.tripDate}T08:00:00.000Z`).toISOString();

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          tripDate: dayIso,
          startTime: dayIso,
          endTime: dayIso,
          startLocation: form.startLocation,
          endLocation: form.endLocation,
          purpose: form.purpose,
          tripType,
          odometerStartKm: Number(form.odometerStartKm),
          odometerEndKm: Number(form.odometerEndKm),
          note: form.note || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Jízdu se nepodařilo uložit");
        setLoading(false);
        return;
      }

      router.push("/driver");
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
    <main className="relative min-h-screen flex items-center justify-center px-4 py-10">
      <div className="mesh-bg">
        <span className="w-[520px] h-[520px] -right-40 -bottom-40 bg-[radial-gradient(circle,rgba(31,157,87,0.24),transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex items-center gap-2 font-extrabold tracking-[0.12em] text-sm mb-6">
          <GaugeIcon size={22} /> DRIVER
          <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
        </div>

        <Link href="/driver" className="text-sm text-muted font-semibold mb-4 inline-block">
          ← Zpět
        </Link>
        <h1 className="text-lg font-bold mb-5">Nová jízda</h1>

        {!vehicleId ? (
          <div className="glass-panel p-6 text-center text-sm text-danger">
            Chybí ID vozidla. Vraťte se prosím zpět a zkuste to znovu.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Datum</label>
              <input type="date" required value={form.tripDate} onChange={(e) => update("tripDate", e.target.value)} className={`${inputClass} font-mono`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Odjezd</label>
                <input required value={form.startLocation} onChange={(e) => update("startLocation", e.target.value)} placeholder="Praha, kancelář" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Cíl</label>
                <input required value={form.endLocation} onChange={(e) => update("endLocation", e.target.value)} placeholder="Brno, klient s.r.o." className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Účel jízdy</label>
              <input required value={form.purpose} onChange={(e) => update("purpose", e.target.value)} placeholder="Obchodní jednání" className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Km start</label>
                <input required type="number" value={form.odometerStartKm} onChange={(e) => update("odometerStartKm", e.target.value)} className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label className={labelClass}>Km cíl</label>
                <input required type="number" value={form.odometerEndKm} onChange={(e) => update("odometerEndKm", e.target.value)} placeholder="84415" className={`${inputClass} font-mono`} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Typ jízdy</label>
              <div className="flex border border-white/10 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTripType("business")}
                  className={`flex-1 py-2.5 text-sm font-bold ${tripType === "business" ? "bg-signal/15 text-signal" : "text-muted"}`}
                >
                  Služební
                </button>
                <button
                  type="button"
                  onClick={() => setTripType("private")}
                  className={`flex-1 py-2.5 text-sm font-bold ${tripType === "private" ? "bg-signal/15 text-signal" : "text-muted"}`}
                >
                  Soukromá
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg px-3.5 py-2.5 border border-border-green bg-signal/10">
              <span className="text-xs font-semibold">Vzdálenost</span>
              <span className="font-mono text-sm font-bold text-mint">{distance} km</span>
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm text-black bg-gradient-to-br from-signal to-signal-dim shadow-[0_10px_28px_rgba(52,227,122,0.25)] disabled:opacity-60"
            >
              {loading ? "Ukládám…" : "💾 ULOŽIT JÍZDU"}
            </button>
            <p className="text-center text-[11px] text-muted">
              Záznam dostane pořadové číslo a po uzávěrce měsíce jej nelze upravit
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
