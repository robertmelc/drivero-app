"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { GaugeIcon } from "@/components/icons";

const TYPE_LABELS: Record<string, string> = {
  regular_service: "Pravidelný servis",
  repair: "Oprava",
  tires: "Výměna pneu",
  other: "Ostatní",
};

export default function NewServiceRecordPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    type: "regular_service",
    serviceDate: new Date().toISOString().slice(0, 10),
    odometerKm: "",
    supplier: "",
    costAmount: "",
    nextServiceDueDate: "",
    nextServiceDueKm: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/service-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          serviceDate: new Date(`${form.serviceDate}T00:00:00.000Z`).toISOString(),
          odometerKm: Number(form.odometerKm),
          supplier: form.supplier || undefined,
          costAmount: Number(form.costAmount),
          nextServiceDueDate: form.nextServiceDueDate
            ? new Date(`${form.nextServiceDueDate}T00:00:00.000Z`).toISOString()
            : undefined,
          nextServiceDueKm: form.nextServiceDueKm ? Number(form.nextServiceDueKm) : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Záznam se nepodařilo uložit");
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

      <div className="relative z-10 max-w-lg mx-auto">
        <div className="flex items-center gap-2 font-extrabold tracking-[0.12em] text-sm mb-8">
          <GaugeIcon size={24} /> DRIVER
          <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
        </div>

        <Link href={`/vehicles/${vehicleId}`} className="text-sm text-muted font-semibold mb-4 inline-block">
          ← Zpět na vozidlo
        </Link>
        <h1 className="text-xl font-extrabold mb-6">Přidat servisní záznam</h1>

        <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4">
          <div>
            <label className={labelClass}>Typ</label>
            <select value={form.type} onChange={(e) => update("type", e.target.value)} className={inputClass}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Datum</label>
              <input type="date" required value={form.serviceDate} onChange={(e) => update("serviceDate", e.target.value)} className={`${inputClass} font-mono`} />
            </div>
            <div>
              <label className={labelClass}>Stav tachometru (km)</label>
              <input type="number" required value={form.odometerKm} onChange={(e) => update("odometerKm", e.target.value)} placeholder="78400" className={`${inputClass} font-mono`} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Dodavatel</label>
            <input value={form.supplier} onChange={(e) => update("supplier", e.target.value)} placeholder="Škoda Auto servis Praha 9" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Cena (Kč)</label>
            <input type="number" required value={form.costAmount} onChange={(e) => update("costAmount", e.target.value)} placeholder="6200" className={`${inputClass} font-mono`} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div>
              <label className={labelClass}>Příští servis — datum</label>
              <input type="date" value={form.nextServiceDueDate} onChange={(e) => update("nextServiceDueDate", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Příští servis — km</label>
              <input type="number" value={form.nextServiceDueKm} onChange={(e) => update("nextServiceDueKm", e.target.value)} placeholder="volitelné" className={`${inputClass} font-mono`} />
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Link href={`/vehicles/${vehicleId}`} className="px-5 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm font-bold">
              Zrušit
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-sm font-extrabold text-black bg-gradient-to-br from-signal to-signal-dim shadow-[0_8px_24px_rgba(52,227,122,0.25)] disabled:opacity-60"
            >
              {loading ? "Ukládám…" : "Uložit záznam"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
