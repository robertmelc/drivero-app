import Link from "next/link";
import { GaugeIcon, CarSideIcon } from "@/components/icons";

const PROBLEMS = [
  { icon: "📋", title: "Chybí předávací protokol", text: "Auto se předá bez zápisu stavu — při vrácení nikdo neví, odkud je nový šrám." },
  { icon: "⚠️", title: "Nikdo neví, kdy končí STK", text: "Platnost STK, pojištění i dálniční známky se hlídá v hlavě — nebo vůbec." },
  { icon: "📖", title: "Kniha jízd nestačí kontrole", text: "Papír nebo Excel jde zpětně dopsat — přesně to finanční úřad kontroluje." },
  { icon: "🧾", title: "Účetní shání podklady ručně", text: "Náklady na servis a PHM po firmě po e-mailech, měsíc co měsíc." },
];

const FEATURES = [
  { icon: "📸", title: "Digitální předávací protokoly", text: "Fotky vozidla, stav tachometru a podpis administrátora i řidiče přímo v appce." },
  { icon: "🔔", title: "Hlídání termínů", text: "STK, pojištění, dálniční známka i servis — upozornění předem, ne po vypršení." },
  { icon: "📖", title: "Kniha jízd, které se dá věřit", text: "Každý záznam má pořadové číslo a po uzávěrce měsíce jde jen opravit, nikdy přepsat." },
  { icon: "🔧", title: "Servisní historie", text: "Kompletní historie oprav a servisů u každého vozidla, s náklady a dodavatelem." },
  { icon: "📊", title: "Export pro účetní jedním klikem", text: "Měsíční XLS export knihy jízd i nákladů." },
  { icon: "👥", title: "Role pro celou firmu", text: "Admin spravuje park, účetní má exporty, řidič vidí jen svoje auto." },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      <div className="mesh-bg">
        <span className="w-[680px] h-[680px] -left-52 -top-56 bg-[radial-gradient(circle,rgba(52,227,122,0.30),transparent_70%)]" />
        <span className="w-[560px] h-[560px] -right-40 top-[10%] bg-[radial-gradient(circle,rgba(31,157,87,0.24),transparent_70%)]" />
      </div>

      <div className="relative z-10">
        {/* NAV */}
        <nav className="sticky top-0 z-50 flex items-center justify-between px-10 py-4 bg-black/65 backdrop-blur-glass border-b border-white/10">
          <div className="flex items-center gap-2 font-extrabold tracking-[0.13em] text-sm">
            <GaugeIcon size={26} /> DRIVER
            <span className="inline-block w-2 h-2 rounded-full bg-signal shadow-[0_0_8px_rgba(52,227,122,0.7)]" />
          </div>
          <div className="hidden md:flex gap-8 text-sm text-muted font-semibold">
            <a href="#problem" className="hover:text-ink">Problém</a>
            <a href="#features" className="hover:text-ink">Co Drivero řeší</a>
            <a href="#pricing" className="hover:text-ink">Ceník</a>
            <Link href="/o-nas" className="hover:text-ink">O nás</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-bold">
              Přihlásit se
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg text-sm font-extrabold text-black bg-gradient-to-br from-signal to-signal-dim shadow-[0_8px_24px_rgba(52,227,122,0.25)]"
            >
              Založit profil
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="max-w-5xl mx-auto px-10 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 text-[11.5px] font-extrabold tracking-[0.14em] uppercase text-signal bg-signal/10 border border-border-green rounded-full px-4 py-1.5 mb-7">
            <CarSideIcon width={22} height={10} className="text-signal" />
            Správa firemních vozidel bez chaosu
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-5">
            Váš vozový park{" "}
            <span className="bg-gradient-to-br from-mint to-signal bg-clip-text text-transparent">pod kontrolou</span>,
            <br />
            ne v hlavě řidiče
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto mb-9">
            Předávací protokoly, STK, pojištění, dálniční známka, servis i kniha jízd na jednom místě — pro admina,
            účetní i každého řidiče ve firmě.
          </p>
          <div className="flex justify-center gap-3.5 flex-wrap">
            <Link
              href="/register?role=company"
              className="px-6 py-3.5 rounded-xl font-extrabold text-sm text-black bg-gradient-to-br from-signal to-signal-dim shadow-[0_8px_24px_rgba(52,227,122,0.25)]"
            >
              Založit profil firmy
            </Link>
            <Link
              href="/register?role=driver"
              className="px-6 py-3.5 rounded-xl font-bold text-sm border border-white/10 bg-white/5"
            >
              Jsem řidič
            </Link>
          </div>
        </section>

        {/* PROBLEM */}
        <section id="problem" className="max-w-6xl mx-auto px-10 py-20">
          <div className="text-[11.5px] font-extrabold tracking-[0.14em] uppercase text-signal mb-3">Problém, který znáte</div>
          <h2 className="text-3xl font-extrabold tracking-tight max-w-xl mb-12">
            Firemní auta se předávají mezi lidmi, ale informace o nich ne
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="glass-panel p-5">
                <div className="text-2xl mb-3">{p.icon}</div>
                <h3 className="font-bold text-sm mb-2">{p.title}</h3>
                <p className="text-xs text-muted">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="max-w-6xl mx-auto px-10 py-20">
          <div className="text-[11.5px] font-extrabold tracking-[0.14em] uppercase text-signal mb-3">Co Drivero řeší</div>
          <h2 className="text-3xl font-extrabold tracking-tight max-w-xl mb-12">
            Všechno o firemních autech na jednom místě
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-panel p-6">
                <div className="w-10 h-10 rounded-xl bg-signal/10 border border-border-green flex items-center justify-center text-lg mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 py-10 text-center text-muted text-xs">
          <div className="flex items-center justify-center gap-2 font-extrabold tracking-[0.1em] text-sm text-ink mb-2">
            <GaugeIcon size={18} /> DRIVERO
          </div>
          Váš vozový park pod kontrolou — jedním pohledem.
        </footer>
      </div>
    </main>
  );
}
