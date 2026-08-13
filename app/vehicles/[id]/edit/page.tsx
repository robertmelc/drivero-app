"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GaugeIcon } from "@/components/icons";

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    spz: "",
    vin: "",
    make: "",
    model: "",
    year: "",
    fuelType: "petrol",
    ownershipType: "owned",
    odometerKm: "",
    stkValidUntil: "",
    vignetteValidUntil: "",
    insuranceLiabilityValidUntil: "",
    insuranceProvider: "",
    parkingCardValidUntil: "",
  });

  useEffect(() => {
    fetch(`/api/vehicles/${vehicleId}`)
      .then((r) => r.json())
      .then((data) => {
        const v = data.vehicle;
        if (!v) {
          setError("Vozidlo se nepodařilo načíst");
          return;
        }
        setForm({
          spz: v.spz ?? "",
          vin: v.vin ?? "",
          make: v.make ?? "",
          model: v.model ?? "",
          year: String(v.year ?? ""),
          fuelType: v.fuelType ?? "petrol",
          ownershipType: v.ownershipType ?? "owned",
          odometerKm: String(v.odometerKm ?? "0"),
          stkValidUntil: toDateInput(v.stkValidUntil),
          vignetteValidUntil: toDateInput(v.vignetteValidUntil),
          insuranceLiabilityValidUntil: toDateInput(v.insuranceLiabilityValidUntil),
          insuranceProvider: v.insuranceProvider ?? "",
          parkingCardValidUntil: toDateInput(v.parkingCardValidUntil),
        });
      })
      .catch(() => setError("Vozidlo se nepodařilo načíst"))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toIso(dateStr: string): string | null {
    if (!dateStr) return null;
    return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spz: form.spz,
          vin: form.vin,
          make: form.make,
          model: form.model,
          year: Number(form.year),
          fuelType: form.fuelType,
          ownershipType: form.ownershipType,
          odometerKm: Number(form.odometerKm),
          stkValidUntil: toIso(form.stkValidUntil),
          vignetteValidUntil: toIso(form.vignetteValidUntil),
          insuranceLiabilityValidUntil: toIso(form.insuranceLiabilityValidUntil),
          insuranceProvider: form.insuranceProvider || null,
          parkingCardValidUntil: toIso(form.parkingCardValidUntil),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Vozidlo se nepodařilo uložit");
        setSaving(false);
        return;
      }

      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    } catch {
      setError("Něco se pokazilo, zkuste to prosím znovu");
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border border-white/10 rounded-lg px-3.5 py-2.5 text-sm bg-white/5 text-ink focus:outline-none focus:ring-2 focus:ring-border-green";
  const labelClass = "block text-[11px] uppercase tracking-wide text-muted mb-1.5";

  if (loading) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted">Načítám…</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-6 py-8">
      <div className="mesh-bg">
        <span className="w-[620px] h-[620px] -left-44 -top-40 bg-[radial-gradient(circle,rgba(52,227,122,0.30),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-extrabold tracking-[0.12em] text-sm">
            <GaugeIcon size={24} /> DRIVER
            <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
          </Link>
        </div>

        <Link href={`/vehicles/${vehicleId}`} className="text-sm text-muted font-semibold mb-5 inline-block">
          ← Zpět na vozidlo
        </Link>
        <h1 className="text-2xl font-extrabold mb-6">Upravit vozidlo</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="glass-panel p-6">
            <h2 className="text-xs uppercase tracking-wide text-muted font-bold mb-4">Základní údaje</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>SPZ</label>
                <input required value={form.spz} onChange={(e) => update("spz", e.target.value)} className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label className={labelClass}>VIN</label>
                <input required value={form.vin} onChange={(e) => update("vin", e.target.value)} className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label className={labelClass}>Značka</label>
                <input required value={form.make} onChange={(e) => update("make", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Model</label>
                <input required value={form.model} onChange={(e) => update("model", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Rok výroby</label>
                <input required type="number" value={form.year} onChange={(e) => update("year", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Palivo</label>
                <select value={form.fuelType} onChange={(e) => update("fuelType", e.target.value)} className={inputClass}>
                  <option value="petrol">Benzín</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Elektro</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="lpg">LPG</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-xs uppercase tracking-wide text-muted font-bold mb-4">Vlastnictví a stav</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Typ vlastnictví</label>
                <select value={form.ownershipType} onChange={(e) => update("ownershipType", e.target.value)} className={inputClass}>
                  <option value="owned">Ve vlastnictví firmy</option>
                  <option value="finance_lease">Finanční leasing</option>
                  <option value="operating_lease">Operativní leasing</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Stav tachometru (km)</label>
                <input type="number" required value={form.odometerKm} onChange={(e) => update("odometerKm", e.target.value)} className={`${inputClass} font-mono`} />
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-xs uppercase tracking-wide text-muted font-bold mb-4">Platnosti a termíny</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>STK platná do</label>
                <input type="date" value={form.stkValidUntil} onChange={(e) => update("stkValidUntil", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Dálniční známka platná do</label>
                <input type="date" value={form.vignetteValidUntil} onChange={(e) => update("vignetteValidUntil", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Parkovací karta platná do</label>
                <input type="date" value={form.parkingCardValidUntil} onChange={(e) => update("parkingCardValidUntil", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Povinné ručení platné do</label>
                <input type="date" value={form.insuranceLiabilityValidUntil} onChange={(e) => update("insuranceLiabilityValidUntil", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pojišťovna</label>
                <input value={form.insuranceProvider} onChange={(e) => update("insuranceProvider", e.target.value)} className={inputClass} />
              </div>
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
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-sm font-extrabold text-black bg-gradient-to-br from-signal to-signal-dim shadow-[0_8px_24px_rgba(52,227,122,0.25)] disabled:opacity-60"
            >
              {saving ? "Ukládám…" : "Uložit změny"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
