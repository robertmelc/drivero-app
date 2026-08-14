import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaugeIcon } from "@/components/icons";
import { formatDate } from "@/lib/deadlines";
import { PrintButton } from "@/components/print-button";

export default async function HandoverProtocolDetailPage({
  params,
}: {
  params: { id: string; protocolId: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const protocol = await prisma.handoverProtocol.findFirst({
    where: { id: params.protocolId, vehicle: { companyId: session.companyId } },
    include: { vehicle: true, driver: { select: { email: true } } },
  });
  if (!protocol) redirect(`/vehicles/${params.id}/handover`);

  if (session.role === "driver" && protocol.userId !== session.userId) {
    redirect("/driver");
  }

  const photoData = (protocol.photos as {
    images?: string[];
    adminSignature?: string | null;
    driverSignature?: string | null;
  } | null) ?? {};
  const images = photoData.images ?? [];

  return (
    <main className="relative min-h-screen px-6 py-8 print:bg-white print:text-black">
      <div className="mesh-bg print:hidden">
        <span className="w-[620px] h-[620px] -left-44 -top-40 bg-[radial-gradient(circle,rgba(52,227,122,0.30),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 font-extrabold tracking-[0.12em] text-sm">
            <GaugeIcon size={24} /> DRIVER
            <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
          </Link>
          <PrintButton />
        </div>

        <Link
          href={`/vehicles/${params.id}/handover`}
          className="text-sm text-muted font-semibold mb-4 inline-block print:hidden"
        >
          ← Zpět na seznam protokolů
        </Link>

        <h1 className="text-2xl font-extrabold mb-1 print:text-black">
          {protocol.type === "handover" ? "Předávací protokol" : "Protokol o vrácení"}
        </h1>
        <p className="text-sm text-muted mb-6 print:text-black">
          {protocol.vehicle.spz} · {protocol.vehicle.make} {protocol.vehicle.model}
        </p>

        <div className="glass-panel p-6 mb-5 print:border print:border-black/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[11px] uppercase text-muted">Řidič</div>
              <div className="font-semibold">{protocol.driver.email}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase text-muted">Datum</div>
              <div className="font-semibold">{formatDate(protocol.protocolDate)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase text-muted">Stav tachometru</div>
              <div className="font-mono font-semibold">{protocol.odometerKm.toLocaleString("cs-CZ")} km</div>
            </div>
            <div>
              <div className="text-[11px] uppercase text-muted">Stav</div>
              <div className={`font-bold ${protocol.signedByAdmin && protocol.signedByDriver ? "text-signal" : "text-amber"}`}>
                {protocol.signedByAdmin && protocol.signedByDriver ? "✓ Podepsáno oběma stranami" : "⚠ Neúplné"}
              </div>
            </div>
          </div>
          {protocol.conditionNotes && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-[11px] uppercase text-muted mb-1">Poznámka ke stavu</div>
              <div className="text-sm">{protocol.conditionNotes}</div>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-bold mb-2 print:text-black">Fotodokumentace</h2>
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Fotka ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] uppercase text-muted mb-1.5 print:text-black">Podpis administrátora</div>
            <div className="border border-white/10 rounded-lg bg-white/5 p-2 h-[100px] flex items-center justify-center print:border-black/30">
              {photoData.adminSignature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoData.adminSignature} alt="Podpis administrátora" className="max-h-full" />
              ) : (
                <span className="text-xs text-muted">Nepodepsáno</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-muted mb-1.5 print:text-black">Podpis řidiče</div>
            <div className="border border-white/10 rounded-lg bg-white/5 p-2 h-[100px] flex items-center justify-center print:border-black/30">
              {photoData.driverSignature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoData.driverSignature} alt="Podpis řidiče" className="max-h-full" />
              ) : (
                <span className="text-xs text-muted">Nepodepsáno</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
