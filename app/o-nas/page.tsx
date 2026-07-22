import Link from "next/link";
import { GaugeIcon } from "@/components/icons";

export default function ONasPage() {
  return (
    <main className="relative min-h-screen px-6 py-8">
      <div className="mesh-bg">
        <span className="w-[620px] h-[620px] -left-44 -top-40 bg-[radial-gradient(circle,rgba(52,227,122,0.30),transparent_70%)]" />
        <span className="w-[520px] h-[520px] -right-40 -bottom-40 bg-[radial-gradient(circle,rgba(31,157,87,0.24),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="flex items-center gap-2 font-extrabold tracking-[0.12em] text-sm">
            <GaugeIcon size={24} /> DRIVER
            <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
          </Link>
          <Link href="/" className="text-sm text-muted font-semibold">
            ← Zpět na hlavní stránku
          </Link>
        </div>

        <p className="text-[11.5px] font-extrabold tracking-[0.14em] uppercase text-signal mb-3">
          O nás
        </p>
        <h1 className="text-3xl font-extrabold mb-8 leading-tight">
          Proč vzniklo Drivero
        </h1>

        <div className="glass-panel p-8 space-y-5 text-[15px] leading-relaxed text-ink">
          <p>
            Drivero nezačalo jako byznysový nápad. Začalo jako frustrace.
          </p>

          <p>
            Naše firemní auto putovalo mezi kolegy bez jakéhokoli záznamu — kdo ho má, v jakém je stavu,
            kdy byl naposledy servis. Nikdo to nedělal schválně špatně. Prostě to nikdo neřídil.
          </p>

          <p>
            Výsledek: zničený motor. Oprava v autorizovaném servisu vyšla přes{" "}
            <strong className="text-mint">300 000 Kč</strong> — v neautorizovaném servisu jsme to nakonec
            vyřešili levněji, ale škoda, které jsme mohli předejít, byla obrovská.
          </p>

          <p>
            O pár týdnů později moji ženu při služební cestě zastavila policie. Důvod: propadlá STK.
            Pokuta byla jen <strong className="text-mint">500 korun</strong> — ale ten pocit zbytečnosti byl
            mnohem horší než ta částka. Nikdo si totiž nevšiml, že termín blíží, protože to auto
            &bdquo;nebylo ničí&ldquo; — používal ho kdokoliv, kdo ho zrovna potřeboval.
          </p>

          <p>
            Existuje spousta appek na sledování vozidel — kde jsou, kolik najela, jak rychle jel řidič.
            To ale neřeší skutečný problém malých a středních firem: <strong className="text-ink">kdo je
            za auto právě zodpovědný a v jakém je stavu.</strong>
          </p>

          <p>
            Drivero vzniklo přesně na tohle. Předávací protokol, který jasně řekne, kdo auto přebírá
            a v jakém stavu. Appka, co sama hlídá STK, pojištění a servisní termíny, aby na ně nikdo
            nemusel myslet. Kniha jízd, kterou zvládne vyplnit kdokoliv z telefonu za pár vteřin.
          </p>

          <p className="text-lg font-bold text-signal pt-2">
            Ne proto, aby vaše firma vypadala moderně. Aby se jí nestalo to, co nám.
          </p>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/register"
            className="inline-block px-8 py-3.5 rounded-xl font-extrabold text-sm text-black bg-gradient-to-br from-signal to-signal-dim shadow-[0_10px_28px_rgba(52,227,122,0.25)]"
          >
            Založit profil zdarma
          </Link>
        </div>
      </div>
    </main>
  );
}
