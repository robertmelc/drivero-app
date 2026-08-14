"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 rounded-lg text-sm font-extrabold text-black bg-gradient-to-br from-signal to-signal-dim print:hidden"
    >
      🖨️ Vytisknout / Uložit jako PDF
    </button>
  );
}
