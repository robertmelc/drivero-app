"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { GaugeIcon } from "@/components/icons";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function NewFuelExpensePage() {
  return (
    <Suspense fallback={null}>
      <NewFuelExpenseForm />
    </Suspense>
  );
}

function NewFuelExpenseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId") || "";

  const [form, setForm] = useState({
    expenseDate: new Date().toISOString().slice(0, 10),
    liters: "",
    amount: "",
    odometerKm: searchParams.get("odometer") || "",
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, bucket: "receipts" }),
      });
      const signData = await signRes.json();
      if (!signRes.ok) {
        setError(signData.error || "Přípravu nahrání se nepodařilo dokončit");
        return;
      }

      const { error: uploadError } = await supabaseBrowser.storage
        .from("receipts")
        .uploadToSignedUrl(signData.path, signData.token, file);

      if (uploadError) {
        setError(`Nahrání účtenky selhalo: ${uploadError.message}`);
        return;
      }

      setPhotoUrl(signData.publicUrl);
    } catch {
      setError("Nahrání účtenky selhalo, zkuste to znovu");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const dayIso = new Date(`${form.expenseDate}T08:00:00.000Z`).toISOString();

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/fuel-expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseDate: dayIso,
          liters: form.liters ? Number(form.liters) : undefined,
          amount: Number(form.amount),
          odometerKm: form.odometerKm ? Number(form.odometerKm) : undefined,
          photoUrl: photoUrl || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Tankování se nepodařilo uložit");
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
        <h1 className="text-lg font-bold mb-5">Zapsat tankování</h1>

        {!vehicleId ? (
          <div className="glass-panel p-6 text-center text-sm text-danger">
            Chybí ID vozidla. Vraťte se prosím zpět a zkuste to znovu.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="glass-panel p-5 space-y-4">
              <div>
                <label className={labelClass}>Datum</label>
                <input
                  type="date"
                  required
                  value={form.expenseDate}
                  onChange={(e) => update("expenseDate", e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Litry</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.liters}
                    onChange={(e) => update("liters", e.target.value)}
                    placeholder="45.2"
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Cena celkem (Kč)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.amount}
                    onChange={(e) => update("amount", e.target.value)}
                    placeholder="1890"
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Stav tachometru (km)</label>
                <input
                  type="number"
                  min="0"
                  value={form.odometerKm}
                  onChange={(e) => update("odometerKm", e.target.value)}
                  placeholder="84900"
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            <div className="glass-panel p-5">
              <label className={labelClass}>Účtenka</label>
              <label
                className="aspect-[3/2] rounded-lg border border-dashed border-white/15 hover:border-border-green bg-white/[0.03] flex flex-col items-center justify-center gap-1 cursor-pointer relative overflow-hidden"
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Účtenka" className="absolute inset-0 w-full h-full object-cover" />
                ) : uploading ? (
                  <span className="text-xs text-muted">Nahrávám…</span>
                ) : (
                  <>
                    <span className="text-signal text-xl">＋</span>
                    <span className="text-[11px] text-muted text-center px-1">Vyfotit / nahrát účtenku</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                />
              </label>
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm text-black bg-gradient-to-br from-signal to-signal-dim shadow-[0_10px_28px_rgba(52,227,122,0.25)] disabled:opacity-60"
            >
              {loading ? "Ukládám…" : "⛽ ULOŽIT TANKOVÁNÍ"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
