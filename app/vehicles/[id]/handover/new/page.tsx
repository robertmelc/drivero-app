"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GaugeIcon } from "@/components/icons";
import { SignaturePad } from "@/components/signature-pad";
import { supabaseBrowser } from "@/lib/supabase-browser";

type CompanyUser = { id: string; email: string; role: string };

const PHOTO_SLOTS = [
  { key: "front", label: "Přední část" },
  { key: "rear", label: "Zadní část" },
  { key: "left", label: "Levý bok" },
  { key: "right", label: "Pravý bok" },
  { key: "interior", label: "Interiér" },
  { key: "damage", label: "Poškození" },
];

export default function NewHandoverProtocolPage() {
  return (
    <Suspense fallback={null}>
      <ProtocolForm />
    </Suspense>
  );
}

function ProtocolForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const vehicleId = params.id as string;

  const [protoType, setProtoType] = useState<"handover" | "return">("handover");
  const [drivers, setDrivers] = useState<CompanyUser[]>([]);
  const [userId, setUserId] = useState(searchParams.get("driverId") || "");
  const [protocolDate, setProtocolDate] = useState(new Date().toISOString().slice(0, 16));
  const [odometerKm, setOdometerKm] = useState(searchParams.get("odometer") || "");
  const [conditionNotes, setConditionNotes] = useState("");

  const [photos, setPhotos] = useState<Record<string, string | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [adminSignature, setAdminSignature] = useState<string | null>(null);
  const [driverSignature, setDriverSignature] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setDrivers((data.users || []).filter((u: CompanyUser) => u.role === "driver")))
      .finally(() => setLoadingDrivers(false));
  }, []);

  async function handlePhotoChange(slotKey: string, file: File | undefined) {
    if (!file) return;
    setUploading((u) => ({ ...u, [slotKey]: true }));
    setError(null);
    try {
      // 1. Ask our server for a short-lived signed upload URL — no file bytes sent yet.
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });
      const signData = await signRes.json();
      if (!signRes.ok) {
        setError(signData.error || "Přípravu nahrání se nepodařilo dokončit");
        return;
      }

      // 2. Upload the actual file straight to Supabase Storage from the browser —
      // this never touches our Vercel function, so its payload size limit doesn't apply.
      const { error: uploadError } = await supabaseBrowser.storage
        .from("handover-photos")
        .uploadToSignedUrl(signData.path, signData.token, file);

      if (uploadError) {
        setError(`Nahrání fotky selhalo: ${uploadError.message}`);
        return;
      }

      setPhotos((p) => ({ ...p, [slotKey]: signData.publicUrl }));
    } catch {
      setError("Nahrání fotky selhalo, zkuste to znovu");
    } finally {
      setUploading((u) => ({ ...u, [slotKey]: false }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError("Vyberte řidiče");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/handover-protocols`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: protoType,
          userId,
          protocolDate: new Date(protocolDate).toISOString(),
          odometerKm: Number(odometerKm),
          conditionNotes: conditionNotes || undefined,
          photos: Object.values(photos).filter(Boolean),
          adminSignatureDataUrl: adminSignature || undefined,
          driverSignatureDataUrl: driverSignature || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Protokol se nepodařilo uložit");
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

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 font-extrabold tracking-[0.12em] text-sm mb-8">
          <GaugeIcon size={24} /> DRIVER
          <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
        </div>

        <Link href={`/vehicles/${vehicleId}`} className="text-sm text-muted font-semibold mb-4 inline-block">
          ← Zpět na vozidlo
        </Link>
        <h1 className="text-xl font-extrabold mb-6">Předávací protokol</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="glass-panel p-6">
            <h2 className="text-xs uppercase tracking-wide text-muted font-bold mb-4">Typ a účastníci</h2>

            <div className="flex border border-white/10 rounded-lg overflow-hidden mb-4 w-64">
              <button
                type="button"
                onClick={() => setProtoType("handover")}
                className={`flex-1 py-2.5 text-sm font-bold ${protoType === "handover" ? "bg-signal/15 text-signal" : "text-muted"}`}
              >
                Předání
              </button>
              <button
                type="button"
                onClick={() => setProtoType("return")}
                className={`flex-1 py-2.5 text-sm font-bold ${protoType === "return" ? "bg-signal/15 text-signal" : "text-muted"}`}
              >
                Vrácení
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Řidič</label>
                {loadingDrivers ? (
                  <p className="text-sm text-muted">Načítám…</p>
                ) : (
                  <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputClass}>
                    <option value="">— vyberte —</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.email}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className={labelClass}>Datum a čas</label>
                <input
                  type="datetime-local"
                  required
                  value={protocolDate}
                  onChange={(e) => setProtocolDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Stav tachometru (km)</label>
                <input
                  type="number"
                  required
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className={labelClass}>Poznámka ke stavu vozidla</label>
                <input
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="drobný šrám na zadním nárazníku"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-xs uppercase tracking-wide text-muted font-bold mb-4">Fotodokumentace</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {PHOTO_SLOTS.map((slot) => (
                <label
                  key={slot.key}
                  className="aspect-square rounded-lg border border-dashed border-white/15 hover:border-border-green bg-white/[0.03] flex flex-col items-center justify-center gap-1 cursor-pointer relative overflow-hidden"
                >
                  {photos[slot.key] ? (
                    <img src={photos[slot.key]!} alt={slot.label} className="absolute inset-0 w-full h-full object-cover" />
                  ) : uploading[slot.key] ? (
                    <span className="text-[10px] text-muted">Nahrávám…</span>
                  ) : (
                    <>
                      <span className="text-signal text-lg">＋</span>
                      <span className="text-[9.5px] text-muted text-center px-1">{slot.label}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoChange(slot.key, e.target.files?.[0])}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-xs uppercase tracking-wide text-muted font-bold mb-4">Digitální podpis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SignaturePad label="Administrátor" onChange={setAdminSignature} />
              <SignaturePad label="Řidič" onChange={setDriverSignature} />
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
              {loading ? "Ukládám…" : "Uložit a vygenerovat protokol"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
