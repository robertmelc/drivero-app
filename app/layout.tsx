import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drivero — Váš vozový park pod kontrolou",
  description: "Předávací protokoly, STK, pojištění, servis a kniha jízd na jednom místě.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
